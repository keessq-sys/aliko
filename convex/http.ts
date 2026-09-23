import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

async function hmacHex(algorithm: "SHA-256" | "SHA-512", secret: string, body: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: algorithm }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i++) mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return mismatch === 0;
}

const http = httpRouter();

// ── Paystack Webhook ───────────────────────────────────────────────────────
http.route({
  path: "/webhooks/paystack",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return new Response("Webhook not configured", { status: 503 });
    const expected = await hmacHex("SHA-512", secret, rawBody);

    if (!signature || !constantTimeEqual(signature, expected)) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(rawBody) as {
      event: string;
      data: { reference: string; id: string; amount: number; channel: string; customer: { email: string } };
    };

    if (event.event === "charge.success") {
      const { reference, id: providerReference, amount, channel } = event.data;

      const result = await ctx.runMutation(internal.bookings.confirmPayment, {
        reference,
        providerReference,
        amount: amount / 100, // convert kobo to naira
        channel,
        metadata: event.data,
      });

      if (result?.isFullyPaid) {
        // Auto-generate deed of assignment
        const booking = result.booking;
        await ctx.runAction(api.legalDocuments.generateDeedOfAssignment, {
          clientId: booking.clientId,
          plotId: booking.plotId,
          bookingId: booking._id,
          assigneeAddress: "To be confirmed",
          considerationAmount: booking.totalAmount,
        });

      }
    }

    return new Response("ok", { status: 200 });
  }),
});

// ── Dropbox Sign (e-signature) Webhook ────────────────────────────────────
http.route({
  path: "/webhooks/esign",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hellosign-signature");
    const secret = process.env.DROPBOX_SIGN_API_KEY;
    if (!secret) return new Response("Webhook not configured", { status: 503 });
    const expected = await hmacHex("SHA-256", secret, rawBody);

    if (!signature || !constantTimeEqual(signature, expected)) {
      return new Response("Invalid signature", { status: 401 });
    }

    const decoded = decodeURIComponent(rawBody.replace(/^json=/, "").replace(/\+/g, " "));
    const payload = JSON.parse(decoded) as {
      event: { event_type: string };
      signature_request: { metadata: { referenceCode: string } };
    };

    if (payload.event.event_type === "signature_request_all_signed") {
      const referenceCode = payload.signature_request.metadata.referenceCode;
      if (referenceCode) {
        await ctx.runMutation(internal.legalDocuments.updateDocumentStatus, {
          referenceCode,
          status: "SIGNED",
          actorRole: "CLIENT",
        });
      }
    }

    // Dropbox Sign requires this exact response
    return new Response("Hello API Event Received", { status: 200 });
  }),
});

// ── WhatsApp Business Cloud API Webhook ───────────────────────────────────
http.route({
  path: "/webhooks/whatsapp",
  method: "GET",
  handler: httpAction(async (_ctx, req) => {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return new Response(challenge ?? "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }),
});

http.route({
  path: "/webhooks/whatsapp",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json() as {
      entry?: { changes?: { value?: { messages?: { from: string; type: string; text?: { body: string } }[] } }[] }[];
    };
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (message?.type === "text" && message.text?.body) {
      // Fire-and-forget — respond to Meta immediately
      void ctx.runAction(internal.whatsapp.handleIncoming, {
        phone: message.from,
        text: message.text.body,
      });
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
