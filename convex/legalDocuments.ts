import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ── Queries ────────────────────────────────────────────────────────────────

export const getDocumentByReference = query({
  args: { referenceCode: v.string() },
  handler: async (ctx, { referenceCode }) => {
    const doc = await ctx.db
      .query("legalDocuments")
      .withIndex("by_reference", q => q.eq("referenceCode", referenceCode))
      .unique();
    if (!doc) return null;
    const [client, plot] = await Promise.all([
      ctx.db.get(doc.clientId),
      doc.plotId ? ctx.db.get(doc.plotId) : null,
    ]);
    const auditLog = await ctx.db
      .query("documentAuditLog")
      .withIndex("by_document", q => q.eq("documentId", doc._id))
      .order("asc")
      .collect();
    const pdfUrl = doc.pdfStorageId ? await ctx.storage.getUrl(doc.pdfStorageId) : null;
    return { ...doc, client, plot, auditLog, pdfUrl };
  },
});

export const getMyDocuments = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const docs = await ctx.db
      .query("legalDocuments")
      .withIndex("by_client", q => q.eq("clientId", userId as Id<"users">))
      .order("desc")
      .collect();
    return Promise.all(docs.map(async d => {
      const pdfUrl = d.pdfStorageId ? await ctx.storage.getUrl(d.pdfStorageId) : null;
      return { ...d, pdfUrl };
    }));
  },
});

export const getPendingDocuments = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId as Id<"users">);
    if (user?.role !== "ADMIN") throw new Error("Forbidden");
    const docs = await ctx.db
      .query("legalDocuments")
      .withIndex("by_status", q => q.eq("status", "DRAFT"))
      .order("desc")
      .take(50);
    const signed = await ctx.db
      .query("legalDocuments")
      .withIndex("by_status", q => q.eq("status", "SIGNED"))
      .order("desc")
      .take(50);
    const pending = await ctx.db
      .query("legalDocuments")
      .withIndex("by_status", q => q.eq("status", "PENDING_SIGNATURE"))
      .order("desc")
      .take(50);
    const all = [...docs, ...signed, ...pending].sort((a, b) => b._creationTime - a._creationTime);
    return Promise.all(all.map(async d => {
      const [client, plot] = await Promise.all([ctx.db.get(d.clientId), d.plotId ? ctx.db.get(d.plotId) : null]);
      const pdfUrl = d.pdfStorageId ? await ctx.storage.getUrl(d.pdfStorageId) : null;
      return { ...d, client, plot, pdfUrl };
    }));
  },
});

// ── Actions (PDF generation runs in Convex's Node.js environment) ──────────

export const generateDeedOfAssignment = action({
  args: {
    clientId: v.id("users"),
    plotId: v.id("plots"),
    bookingId: v.id("bookings"),
    assigneeAddress: v.string(),
    considerationAmount: v.number(),
  },
  handler: async (ctx, args) => {
    // Fetch data needed for the deed
    const [client, plot, booking] = await Promise.all([
      ctx.runQuery(internal.legalDocuments.getClientInternal, { userId: args.clientId }),
      ctx.runQuery(internal.legalDocuments.getPlotWithProject, { plotId: args.plotId }),
      ctx.runQuery(internal.bookings.getBookingInternal, { bookingId: args.bookingId }),
    ]);
    if (!client || !plot || !booking) throw new Error("Missing data for document generation");

    const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
    const QRCode = await import("qrcode");

    const referenceCode = `DOA-${Date.now().toString(36).toUpperCase()}`;
    const verificationUrl = `${process.env.APP_URL}/legal/track?ref=${referenceCode}`;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();
    const margin = 56;

    // Header
    page.drawText("ALIKO DIAMOND KEY", { x: margin, y: height - 60, font: helveticaBold, size: 18, color: rgb(0.05, 0.04, 0.06) });
    page.drawText("Real Estate & Property Development · Abuja, Nigeria", { x: margin, y: height - 80, font: helvetica, size: 9, color: rgb(0.47, 0.44, 0.42) });

    // Title
    page.drawText("DEED OF ASSIGNMENT", { x: 200, y: height - 120, font: helveticaBold, size: 14, color: rgb(0.05, 0.04, 0.06) });

    // Body text
    const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const body = `THIS DEED OF ASSIGNMENT is made this ${date} BETWEEN ALIKO DIAMOND KEY LTD ` +
      `(hereinafter "the Assignor") of the one part AND ${client.name} of ${args.assigneeAddress} ` +
      `(hereinafter "the Assignee") of the other part.\n\n` +
      `WHEREAS the Assignor is seized of and beneficially entitled to ALL THAT piece of land ` +
      `measuring approximately ${plot.sizeSqm} square metres, known as Beacon Number ${plot.beaconNumber}, ` +
      `situate within ${plot.project.name}, ${plot.project.location}, and has agreed to assign ` +
      `same to the Assignee for the consideration stated below.\n\n` +
      `NOW THIS DEED WITNESSES that in consideration of the sum of ₦${args.considerationAmount.toLocaleString()} ` +
      `(the receipt of which the Assignor hereby acknowledges), the Assignor HEREBY ASSIGNS unto ` +
      `the Assignee ALL THAT the said piece of land TOGETHER WITH all rights, easements and appurtenances ` +
      `thereto, TO HOLD the same unto the Assignee absolutely, subject to the applicable land use ` +
      `regulations of the Federal Capital Territory.`;

    // Draw body text (simple wrapping)
    const words = body.split(" ");
    let line = "";
    let y = height - 160;
    const maxWidth = width - margin * 2;
    for (const word of words) {
      const testLine = line + word + " ";
      const testWidth = helvetica.widthOfTextAtSize(testLine, 10);
      if (testWidth > maxWidth && line) {
        if (y < 200) break;
        page.drawText(line.trim(), { x: margin, y, font: helvetica, size: 10, color: rgb(0.27, 0.25, 0.24) });
        y -= 16;
        line = word + " ";
      } else {
        line = testLine;
      }
    }
    if (line.trim()) page.drawText(line.trim(), { x: margin, y, font: helvetica, size: 10, color: rgb(0.27, 0.25, 0.24) });

    // Signature lines
    const sigY = 160;
    page.drawLine({ start: { x: margin, y: sigY }, end: { x: margin + 160, y: sigY }, thickness: 0.5, color: rgb(0.4, 0.4, 0.4) });
    page.drawText("ASSIGNOR", { x: margin, y: sigY - 14, font: helvetica, size: 9, color: rgb(0.47, 0.44, 0.42) });
    page.drawLine({ start: { x: 320, y: sigY }, end: { x: 320 + 160, y: sigY }, thickness: 0.5, color: rgb(0.4, 0.4, 0.4) });
    page.drawText("ASSIGNEE", { x: 320, y: sigY - 14, font: helvetica, size: 9, color: rgb(0.47, 0.44, 0.42) });

    // QR code
    const qrDataUrl = await QRCode.default.toDataURL(verificationUrl, { margin: 1, width: 80 });
    const qrBase64 = qrDataUrl.split(",")[1];
    const qrBytes = Buffer.from(qrBase64, "base64");
    const qrImage = await pdfDoc.embedPng(qrBytes);
    page.drawImage(qrImage, { x: width - 90, y: 60, width: 60, height: 60 });

    // Footer
    page.drawText(`Reference: ${referenceCode}`, { x: margin, y: 56, font: helvetica, size: 7, color: rgb(0.63, 0.61, 0.6) });
    page.drawText("Verify at alikodiamondkey.com/legal/track", { x: margin, y: 44, font: helvetica, size: 7, color: rgb(0.63, 0.61, 0.6) });

    const pdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

    // Upload to Convex storage
    const storageId = await ctx.storage.store(pdfBlob);

    // Create the document record
    await ctx.runMutation(internal.legalDocuments.createDocumentRecord, {
      type: "DEED_OF_ASSIGNMENT",
      referenceCode,
      clientId: args.clientId,
      plotId: args.plotId,
      bookingId: args.bookingId,
      pdfStorageId: storageId,
    });

    return { referenceCode, storageId };
  },
});

// ── Internal mutations ─────────────────────────────────────────────────────

export const createDocumentRecord = internalMutation({
  args: {
    type: v.union(v.literal("DEED_OF_ASSIGNMENT"), v.literal("TENANCY_AGREEMENT"), v.literal("GUARANTOR_FORM"), v.literal("OFFER_LETTER"), v.literal("PAYMENT_SCHEDULE"), v.literal("LETTER_OF_ALLOCATION")),
    referenceCode: v.string(),
    clientId: v.id("users"),
    plotId: v.optional(v.id("plots")),
    bookingId: v.optional(v.id("bookings")),
    pdfStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const docId = await ctx.db.insert("legalDocuments", {
      ...args,
      status: "DRAFT",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("documentAuditLog", {
      documentId: docId,
      action: "CREATED",
      actorRole: "SYSTEM",
      createdAt: now,
    });
    return docId;
  },
});

export const updateDocumentStatus = internalMutation({
  args: {
    referenceCode: v.string(),
    status: v.union(v.literal("DRAFT"), v.literal("PENDING_SIGNATURE"), v.literal("SIGNED"), v.literal("VERIFIED"), v.literal("REJECTED"), v.literal("EXPIRED")),
    actorRole: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("legalDocuments")
      .withIndex("by_reference", q => q.eq("referenceCode", args.referenceCode))
      .unique();
    if (!doc) throw new Error(`Document ${args.referenceCode} not found`);

    await ctx.db.patch(doc._id, {
      status: args.status,
      signedAt: args.status === "SIGNED" ? Date.now() : doc.signedAt,
      verifiedAt: args.status === "VERIFIED" ? Date.now() : doc.verifiedAt,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("documentAuditLog", {
      documentId: doc._id,
      action: args.status,
      actorRole: args.actorRole ?? "SYSTEM",
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

// Admin actions ─────────────────────────────────────────────────────────────

export const reviewDocument = mutation({
  args: {
    documentId: v.id("legalDocuments"),
    decision: v.union(v.literal("VERIFIED"), v.literal("REJECTED")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId as Id<"users">);
    if (user?.role !== "ADMIN") throw new Error("Forbidden");
    const now = Date.now();
    await ctx.db.patch(args.documentId, {
      status: args.decision,
      verifiedAt: args.decision === "VERIFIED" ? now : undefined,
      updatedAt: now,
    });
    await ctx.db.insert("documentAuditLog", {
      documentId: args.documentId,
      action: args.decision,
      actorId: userId as Id<"users">,
      actorRole: "ADMIN",
      createdAt: now,
    });
  },
});

// Internal queries used by actions ─────────────────────────────────────────
export const getClientInternal = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => ctx.db.get(userId),
});

export const getPlotWithProject = query({
  args: { plotId: v.id("plots") },
  handler: async (ctx, { plotId }) => {
    const plot = await ctx.db.get(plotId);
    if (!plot) return null;
    const project = await ctx.db.get(plot.projectId);
    return { ...plot, project };
  },
});
