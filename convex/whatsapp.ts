import { v } from "convex/values";
import { action, internalAction, internalMutation, query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const WA_BASE = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

async function waPost(body: unknown) {
  const res = await fetch(WA_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error("[WhatsApp]", await res.text());
  return res.json();
}

export async function sendText(to: string, text: string) {
  return waPost({ messaging_product: "whatsapp", to: to.replace(/[^\d+]/g, ""), type: "text", text: { body: text } });
}

export async function sendTemplate(to: string, templateName: string, params: string[], languageCode = "en") {
  return waPost({
    messaging_product: "whatsapp",
    to: to.replace(/[^\d+]/g, ""),
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [{ type: "body", parameters: params.map(text => ({ type: "text", text })) }],
    },
  });
}

// ── Chatbot State Machine ──────────────────────────────────────────────────

export const handleIncoming = internalAction({
  args: { phone: v.string(), text: v.string() },
  handler: async (ctx, { phone, text }) => {
    const session = await ctx.runQuery(internal.whatsapp.getSession, { phone });
    const msg = text.trim().toLowerCase();

    if (msg === "agent" || msg === "human") {
      await ctx.runMutation(internal.whatsapp.updateSession, { phone, state: "START", needsHumanReview: true });
      await sendText(phone, "✅ Noted — one of our property consultants will contact you shortly. Our office hours are Monday–Saturday, 8am–6pm WAT.");
      return;
    }

    if (session?.state === "AWAITING_REFERENCE") {
      const doc = await ctx.runQuery(internal.whatsapp.getDocByRef, { ref: text.trim().toUpperCase() });
      if (doc) {
        await sendText(phone, `📄 *${doc.type.replace(/_/g, " ")}*\nStatus: *${doc.status.replace(/_/g, " ")}*\nReference: ${doc.referenceCode}\n\nView full details:\n${process.env.APP_URL}/legal/track?ref=${doc.referenceCode}`);
      } else {
        await sendText(phone, "❌ Reference not found. Please check and try again, or type *agent* to speak with our team.");
      }
      await ctx.runMutation(internal.whatsapp.updateSession, { phone, state: "START", needsHumanReview: false });
      return;
    }

    if (session?.state === "ASK_BUDGET") {
      await ctx.runMutation(internal.whatsapp.updateSession, { phone, state: "START", needsHumanReview: true, context: { budget: text } });
      await sendText(phone, `💰 Budget noted (${text}). Our sales team will reach out with matching available plots. You can also browse now:\n${process.env.APP_URL}/properties`);
      return;
    }

    // START state — keyword dispatch
    const isLand = msg.includes("land") || msg.includes("plot") || msg.includes("buy") || msg.includes("estate");
    const isTrack = msg.includes("track") || msg.includes("document") || msg.includes("deed") || msg.startsWith("doa-") || msg.startsWith("gtf-") || msg.startsWith("adk-");
    const isVisit = msg.includes("visit") || msg.includes("inspect") || msg.includes("site");
    const isCalc = msg.includes("cost") || msg.includes("calculate") || msg.includes("price");

    if (isLand) {
      await ctx.runMutation(internal.whatsapp.updateSession, { phone, state: "ASK_BUDGET", needsHumanReview: false });
      await sendText(phone, `🏡 Great choice! What's your budget range?\n(e.g. ₦20M – ₦50M)\n\nOr browse verified plots:\n${process.env.APP_URL}/properties`);
    } else if (isTrack) {
      await ctx.runMutation(internal.whatsapp.updateSession, { phone, state: "AWAITING_REFERENCE", needsHumanReview: false });
      await sendText(phone, "📋 Please send your *document reference code* (e.g. DOA-LX9F2K).");
    } else if (isVisit) {
      await sendText(phone, `📅 Schedule a site visit through your portal:\n${process.env.APP_URL}/portal/site-visits\n\nNo account yet? Type *agent* and we'll set one up.`);
    } else if (isCalc) {
      await sendText(phone, `🧮 Use our construction cost calculator:\n${process.env.APP_URL}/calculator`);
    } else {
      await sendText(phone,
        `👋 Welcome to *Aliko Diamond Key* — Premium Real Estate, Abuja.\n\n` +
        `How can we help you?\n` +
        `1️⃣ Reply *buy* — Browse available plots\n` +
        `2️⃣ Reply *track* — Track a legal document\n` +
        `3️⃣ Reply *visit* — Schedule a site visit\n` +
        `4️⃣ Reply *cost* — Calculate construction costs\n` +
        `5️⃣ Reply *agent* — Speak with our team directly`
      );
    }
  },
});

// ── Queries & Mutations ────────────────────────────────────────────────────

export const getSession = query({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => ctx.db.query("whatsAppSessions").withIndex("by_phone", q => q.eq("phone", phone)).unique(),
});

export const getDocByRef = query({
  args: { ref: v.string() },
  handler: async (ctx, { ref }) => ctx.db.query("legalDocuments").withIndex("by_reference", q => q.eq("referenceCode", ref)).unique(),
});

// Only ever called from handleIncoming (the WhatsApp webhook action) via
// internal.whatsapp.updateSession — never exposed to any client directly,
// since session state is driven by inbound WhatsApp messages, not by an
// authenticated app user.
export const updateSession = internalMutation({
  args: {
    phone: v.string(),
    state: v.string(),
    needsHumanReview: v.boolean(),
    context: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db.query("whatsAppSessions").withIndex("by_phone", q => q.eq("phone", args.phone)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, { state: args.state, needsHumanReview: args.needsHumanReview, context: args.context, updatedAt: now });
    } else {
      await ctx.db.insert("whatsAppSessions", { phone: args.phone, state: args.state, needsHumanReview: args.needsHumanReview, context: args.context, updatedAt: now, createdAt: now });
    }
  },
});

export const getHumanReviewQueue = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    return ctx.db.query("whatsAppSessions").withIndex("by_needs_review", q => q.eq("needsHumanReview", true)).order("desc").collect();
  },
});

export const resolveSession = mutation({
  args: { sessionId: v.id("whatsAppSessions") },
  handler: async (ctx, { sessionId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId as Id<"users">);
    if (!user || !["ADMIN", "AGENT"].includes(user.role)) throw new Error("Forbidden");
    await ctx.db.patch(sessionId, { needsHumanReview: false, resolvedAt: Date.now(), updatedAt: Date.now() });
  },
});
