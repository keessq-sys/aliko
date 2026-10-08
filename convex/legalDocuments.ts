import { auditedMutation } from "./lib/auditedMutation";
import { requireAdmin, requireUser, requireSubmittedNin } from "./lib/access";
import { workflow } from "./fulfillment";
import type { WorkflowId } from "@convex-dev/workflow";
import { v, ConvexError } from "convex/values";
import {
  query,
  mutation,
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

// ── Queries ────────────────────────────────────────────────────────────────

export const getDocumentByReference = query({
  args: { referenceCode: v.string() },
  handler: async (ctx, { referenceCode }) => {
    const user = await requireUser(ctx);
    const userId = user._id;
    if (user.role === "ADMIN") await requireAdmin(ctx);
    const doc = await ctx.db
      .query("legalDocuments")
      .withIndex("by_reference", (q) => q.eq("referenceCode", referenceCode))
      .unique();
    if (!doc || (doc.clientId !== userId && user.role !== "ADMIN")) return null;
    const [client, plot] = await Promise.all([
      ctx.db.get(doc.clientId),
      doc.plotId ? ctx.db.get(doc.plotId) : null,
    ]);
    const auditLog = await ctx.db
      .query("documentAuditLog")
      .withIndex("by_document", (q) => q.eq("documentId", doc._id))
      .order("asc")
      .collect();
    const pdfUrl = doc.pdfStorageId
      ? await ctx.storage.getUrl(doc.pdfStorageId)
      : null;
    return { ...doc, client, plot, auditLog, pdfUrl };
  },
});

export const getMyDocuments = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const userId = user._id;
    if (user.role === "ADMIN") await requireAdmin(ctx);
    const docs = await ctx.db
      .query("legalDocuments")
      .withIndex("by_client", (q) => q.eq("clientId", userId as Id<"users">))
      .order("desc")
      .collect();
    return Promise.all(
      docs.map(async (d) => {
        const pdfUrl = d.pdfStorageId
          ? await ctx.storage.getUrl(d.pdfStorageId)
          : null;
        return { ...d, pdfUrl };
      }),
    );
  },
});

export const getPendingDocuments = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthorized");
    const user = await ctx.db.get(userId as Id<"users">);
    await requireAdmin(ctx);
    const docs = await ctx.db
      .query("legalDocuments")
      .withIndex("by_status", (q) => q.eq("status", "DRAFT"))
      .order("desc")
      .take(50);
    const signed = await ctx.db
      .query("legalDocuments")
      .withIndex("by_status", (q) => q.eq("status", "SIGNED"))
      .order("desc")
      .take(50);
    const pending = await ctx.db
      .query("legalDocuments")
      .withIndex("by_status", (q) => q.eq("status", "PENDING_SIGNATURE"))
      .order("desc")
      .take(50);
    const all = [...docs, ...signed, ...pending].sort(
      (a, b) => b._creationTime - a._creationTime,
    );
    return Promise.all(
      all.map(async (d) => {
        const [client, plot] = await Promise.all([
          ctx.db.get(d.clientId),
          d.plotId ? ctx.db.get(d.plotId) : null,
        ]);
        const pdfUrl = d.pdfStorageId
          ? await ctx.storage.getUrl(d.pdfStorageId)
          : null;
        return { ...d, client, plot, pdfUrl };
      }),
    );
  },
});

// ── Actions (PDF generation runs in Convex's Node.js environment) ──────────

export const generateDeedOfAssignment = internalAction({
  args: {
    clientId: v.id("users"),
    plotId: v.id("plots"),
    bookingId: v.id("bookings"),
    assigneeAddress: v.string(),
    considerationAmount: v.number(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    referenceCode: string;
    storageId: Id<"_storage"> | undefined;
  }> => {
    const existing: Doc<"legalDocuments"> | null = await ctx.runQuery(
      internal.legalDocuments.getDocumentByBookingInternal,
      { bookingId: args.bookingId },
    );
    if (existing)
      return {
        referenceCode: existing.referenceCode,
        storageId: existing.pdfStorageId,
      };
    // Fetch data needed for the deed
    const [client, plot, booking] = await Promise.all([
      ctx.runQuery(internal.legalDocuments.getClientInternal, {
        userId: args.clientId,
      }),
      ctx.runQuery(internal.legalDocuments.getPlotWithProject, {
        plotId: args.plotId,
      }),
      ctx.runQuery(internal.bookings.getBookingInternal, {
        bookingId: args.bookingId,
      }),
    ]);
    if (!client || !plot || !plot.project || !booking)
      throw new ConvexError("Missing data for document generation");

    if (
      booking.clientId !== args.clientId ||
      booking.plotId !== args.plotId ||
      booking.paymentStatus !== "SUCCESS" ||
      booking.paidAmount < booking.totalAmount ||
      args.considerationAmount !== booking.totalAmount
    )
      throw new ConvexError("Deed must match the fully paid booking");
    const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
    const QRCode = await import("qrcode");

    const referenceCode = `DOA-${crypto.randomUUID().toUpperCase()}`;
    const verificationUrl = `${process.env.APP_URL}/legal/track?ref=${referenceCode}`;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();
    const margin = 56;

    // Header
    page.drawText("ALIKO DIAMOND KEY", {
      x: margin,
      y: height - 60,
      font: helveticaBold,
      size: 18,
      color: rgb(0.05, 0.04, 0.06),
    });
    page.drawText("Real Estate & Property Development · Abuja, Nigeria", {
      x: margin,
      y: height - 80,
      font: helvetica,
      size: 9,
      color: rgb(0.47, 0.44, 0.42),
    });

    // Title
    page.drawText("DEED OF ASSIGNMENT", {
      x: 200,
      y: height - 120,
      font: helveticaBold,
      size: 14,
      color: rgb(0.05, 0.04, 0.06),
    });

    // Body text
    const date = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const body =
      `THIS DEED OF ASSIGNMENT is made this ${date} BETWEEN ALIKO DIAMOND KEY LTD ` +
      `(hereinafter "the Assignor") of the one part AND ${client.name} of ${args.assigneeAddress} ` +
      `(hereinafter "the Assignee") of the other part.\n\n` +
      `WHEREAS the Assignor is seized of and beneficially entitled to ALL THAT piece of land ` +
      `measuring approximately ${plot.sizeSqm} square metres, known as Beacon Number ${plot.beaconNumber}, ` +
      `situate within ${plot.project.name}, ${plot.project.location}, and has agreed to assign ` +
      `same to the Assignee for the consideration stated below.\n\n` +
      `NOW THIS DEED WITNESSES that in consideration of the sum of NGN ${args.considerationAmount.toLocaleString()} ` +
      `(the receipt of which the Assignor hereby acknowledges), the Assignor HEREBY ASSIGNS unto ` +
      `the Assignee ALL THAT the said piece of land TOGETHER WITH all rights, easements and appurtenances ` +
      `thereto, TO HOLD the same unto the Assignee absolutely, subject to the applicable land use ` +
      `regulations in Nigeria.`;

    // Draw body text (simple wrapping)
    const safeBody = body.replace(/\n+/g, " ");
    const supported = new Set(helvetica.getCharacterSet());
    if ([...safeBody].some((char) => !supported.has(char.codePointAt(0)!)))
      throw new ConvexError(
        "Legal names/address need a supported Unicode deed template; review required",
      );
    const words = safeBody.replace(/\n+/g, " ").split(/\s+/);
    let line = "";
    let y = height - 160;
    const maxWidth = width - margin * 2;
    for (const word of words) {
      const testLine = line + word + " ";
      const testWidth = helvetica.widthOfTextAtSize(testLine, 10);
      if (testWidth > maxWidth && line) {
        if (y < 200)
          throw new ConvexError(
            "Deed content exceeds template; legal review required",
          );
        page.drawText(line.trim(), {
          x: margin,
          y,
          font: helvetica,
          size: 10,
          color: rgb(0.27, 0.25, 0.24),
        });
        y -= 16;
        line = word + " ";
      } else {
        line = testLine;
      }
    }
    if (line.trim())
      page.drawText(line.trim(), {
        x: margin,
        y,
        font: helvetica,
        size: 10,
        color: rgb(0.27, 0.25, 0.24),
      });

    // Signature lines
    const sigY = 160;
    page.drawLine({
      start: { x: margin, y: sigY },
      end: { x: margin + 160, y: sigY },
      thickness: 0.5,
      color: rgb(0.4, 0.4, 0.4),
    });
    page.drawText("ASSIGNOR", {
      x: margin,
      y: sigY - 14,
      font: helvetica,
      size: 9,
      color: rgb(0.47, 0.44, 0.42),
    });
    page.drawLine({
      start: { x: 320, y: sigY },
      end: { x: 320 + 160, y: sigY },
      thickness: 0.5,
      color: rgb(0.4, 0.4, 0.4),
    });
    page.drawText("ASSIGNEE", {
      x: 320,
      y: sigY - 14,
      font: helvetica,
      size: 9,
      color: rgb(0.47, 0.44, 0.42),
    });

    // QR code
    const qrDataUrl = await QRCode.default.toDataURL(verificationUrl, {
      margin: 1,
      width: 80,
    });
    const qrBase64 = qrDataUrl.split(",")[1];
    const qrBytes = Buffer.from(qrBase64, "base64");
    const qrImage = await pdfDoc.embedPng(qrBytes);
    page.drawImage(qrImage, { x: width - 90, y: 60, width: 60, height: 60 });

    // Footer
    page.drawText(`Reference: ${referenceCode}`, {
      x: margin,
      y: 56,
      font: helvetica,
      size: 7,
      color: rgb(0.63, 0.61, 0.6),
    });
    page.drawText("Verify at alikodiamondkey.com/legal/track", {
      x: margin,
      y: 44,
      font: helvetica,
      size: 7,
      color: rgb(0.63, 0.61, 0.6),
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob(
      [
        pdfBytes.buffer.slice(
          pdfBytes.byteOffset,
          pdfBytes.byteOffset + pdfBytes.byteLength,
        ) as ArrayBuffer,
      ],
      { type: "application/pdf" },
    );

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

    const saved = await ctx.runQuery(
      internal.legalDocuments.getDocumentByBookingInternal,
      { bookingId: args.bookingId },
    );
    if (!saved) throw new ConvexError("Deed record was not saved");
    return {
      referenceCode: saved.referenceCode,
      storageId: saved.pdfStorageId,
    };
  },
});

export const getDocumentByBookingInternal = internalQuery({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) =>
    ctx.db
      .query("legalDocuments")
      .withIndex("by_booking", (q) => q.eq("bookingId", bookingId))
      .first(),
});

// ── Internal mutations ─────────────────────────────────────────────────────

export const createDocumentRecord = internalMutation({
  args: {
    type: v.union(
      v.literal("DEED_OF_ASSIGNMENT"),
      v.literal("TENANCY_AGREEMENT"),
      v.literal("GUARANTOR_FORM"),
      v.literal("OFFER_LETTER"),
      v.literal("PAYMENT_SCHEDULE"),
      v.literal("LETTER_OF_ALLOCATION"),
    ),
    referenceCode: v.string(),
    clientId: v.id("users"),
    plotId: v.optional(v.id("plots")),
    bookingId: v.optional(v.id("bookings")),
    pdfStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    if (args.bookingId) {
      const existing = await ctx.db
        .query("legalDocuments")
        .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
        .first();
      if (existing) {
        if (args.pdfStorageId && args.pdfStorageId !== existing.pdfStorageId)
          await ctx.storage.delete(args.pdfStorageId);
        return existing._id;
      }
    }
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
    status: v.union(
      v.literal("DRAFT"),
      v.literal("PENDING_SIGNATURE"),
      v.literal("SIGNED"),
      v.literal("VERIFIED"),
      v.literal("REJECTED"),
      v.literal("EXPIRED"),
    ),
    actorRole: v.optional(v.string()),
    providerRequestId: v.optional(v.string()),
    testMode: v.optional(v.boolean()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("legalDocuments")
      .withIndex("by_reference", (q) =>
        q.eq("referenceCode", args.referenceCode),
      )
      .unique();
    if (!doc) throw new ConvexError(`Document ${args.referenceCode} not found`);
    if (
      args.providerRequestId &&
      (doc.externalSignatureId !== args.providerRequestId ||
        Boolean(doc.signatureTestMode) !== Boolean(args.testMode))
    )
      throw new ConvexError(
        "Signature callback does not match the registered request",
      );
    if (doc.status === args.status) return;
    if (["SIGNED", "VERIFIED", "REJECTED", "EXPIRED"].includes(doc.status))
      throw new ConvexError("Terminal document outcome requires legal review");

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
    if (
      doc.bookingId &&
      ["SIGNED", "REJECTED", "EXPIRED"].includes(args.status)
    ) {
      const booking = await ctx.db.get(doc.bookingId);
      if (booking?.fulfillmentWorkflowId)
        await workflow.sendEvent(ctx, {
          workflowId: booking.fulfillmentWorkflowId as WorkflowId,
          name: "signature",
          value: { documentId: doc._id, status: args.status },
        });
    }
  },
});

export const getDocumentForSignature = internalQuery({
  args: { documentId: v.id("legalDocuments") },
  handler: async (ctx, { documentId }) => {
    const document = await ctx.db.get(documentId);
    if (!document) throw new ConvexError("Document not found");
    const client = await ctx.db.get(document.clientId);
    if (!client) throw new ConvexError("Document client not found");
    const pdfUrl = document.pdfStorageId
      ? await ctx.storage.getUrl(document.pdfStorageId)
      : null;
    return { document, client, pdfUrl };
  },
});

export const recordSignatureRequest = internalMutation({
  args: {
    documentId: v.id("legalDocuments"),
    requestId: v.string(),
    testMode: v.optional(v.boolean()),
    actorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) throw new ConvexError("Document not found");
    if (
      document.externalSignatureId &&
      document.externalSignatureId !== args.requestId
    )
      throw new ConvexError("Document already has another provider request");
    await ctx.db.patch(document._id, {
      externalSignatureId: args.requestId,
      signatureDispatchState: "SENT",
      signatureTestMode: args.testMode ?? false,
      status: ["SIGNED", "VERIFIED", "REJECTED", "EXPIRED"].includes(
        document.status,
      )
        ? document.status
        : "PENDING_SIGNATURE",
      updatedAt: Date.now(),
    });
    await ctx.db.insert("documentAuditLog", {
      documentId: document._id,
      action: "SIGNATURE_REQUEST_SENT",
      actorId: args.actorId,
      actorRole: args.actorId ? "ADMIN" : "SYSTEM",
      metadata: { requestId: args.requestId },
      createdAt: Date.now(),
    });
  },
});

export const requestTypedConsent = auditedMutation(
  "legalDocuments:requestTypedConsent",
)({
  args: { documentId: v.id("legalDocuments") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const document = await ctx.db.get(args.documentId);
    if (!document || !["DRAFT", "PENDING_SIGNATURE"].includes(document.status))
      throw new ConvexError("Document is not eligible for consent");
    await ctx.db.patch(document._id, {
      status: "PENDING_SIGNATURE",
      signatureMethod: "TYPED_CONSENT",
      updatedAt: Date.now(),
    });
    await ctx.db.insert("documentAuditLog", {
      documentId: document._id,
      action: "CONSENT_REQUESTED",
      actorRole: "ADMIN",
      createdAt: Date.now(),
    });
  },
});
export const submitTypedConsent = auditedMutation(
  "legalDocuments:submitTypedConsent",
)({
  args: {
    documentId: v.id("legalDocuments"),
    fullName: v.string(),
    consent: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx),
      document = await ctx.db.get(args.documentId);
    if (!document || document.clientId !== user._id)
      throw new ConvexError("Forbidden");
    const normalize = (name: string) =>
      name.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
    if (
      !args.consent ||
      args.fullName.trim().length < 2 ||
      args.fullName.length > 160 ||
      normalize(args.fullName) !== normalize(user.name ?? "")
    )
      throw new ConvexError(
        "Type your profile's full name and accept the consent declaration.",
      );
    if (
      document.signatureMethod === "TYPED_CONSENT" &&
      ["SIGNED", "VERIFIED"].includes(document.status)
    )
      return;
    if (
      document.status !== "PENDING_SIGNATURE" ||
      (document.expiresAt && document.expiresAt <= Date.now())
    )
      throw new ConvexError("Document is not available for consent");
    const now = Date.now();
    await ctx.db.patch(document._id, {
      status: "SIGNED",
      signatureMethod: "TYPED_CONSENT",
      typedConsentName: args.fullName.trim(),
      typedConsentBy: user._id,
      typedConsentAt: now,
      typedConsentPdfStorageId: document.pdfStorageId,
      signedAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("policyAcceptances", {
      userId: user._id,
      policy: "E_SIGNATURE",
      version: "2026-10-08",
      acceptedAt: now,
    });
    await ctx.db.insert("documentAuditLog", {
      documentId: document._id,
      action: "TYPED_CONSENT_RECORDED",
      actorId: user._id,
      actorRole: user.role,
      metadata: {
        consentVersion: "2026-10-08",
        sourceStorageId: document.pdfStorageId,
      },
      createdAt: now,
    });
  },
});
export const claimSignatureDispatch = internalMutation({
  args: { documentId: v.id("legalDocuments") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.externalSignatureId || doc.signatureDispatchState)
      throw new ConvexError(
        "Signature dispatch already sent or requires provider reconciliation",
      );
    if (doc.bookingId) {
      const booking = await ctx.db.get(doc.bookingId);
      const client = await ctx.db.get(doc.clientId);
      if (
        !booking ||
        booking.clientId !== doc.clientId ||
        booking.paymentStatus !== "SUCCESS" ||
        booking.paidAmount < booking.totalAmount ||
        !client ||
        !client.address ||
        client.accountStatus === "SUSPENDED"
      )
        throw new ConvexError(
          "Verified payment and current identity/address are required",
        );
    }
    await ctx.db.patch(doc._id, {
      signatureDispatchState: "SENDING",
      updatedAt: Date.now(),
    });
  },
});
export const signatureDispatchUncertain = internalMutation({
  args: { documentId: v.id("legalDocuments") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (doc && !doc.externalSignatureId)
      await ctx.db.patch(doc._id, {
        signatureDispatchState: "REVIEW",
        updatedAt: Date.now(),
      });
  },
});
export const dispatchBookingSignature = internalAction({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args): Promise<{ requestId: string }> => {
    const doc = await ctx.runQuery(
      internal.legalDocuments.getDocumentByBookingInternal,
      args,
    );
    if (!doc) throw new ConvexError("Deed not found");
    return ctx.runAction(internal.legalDocuments.dispatchSignature, {
      documentId: doc._id,
    });
  },
});
export const prepareTypedConsent = internalMutation({
  args: { documentId: v.id("legalDocuments") },
  handler: async (ctx, { documentId }) => {
    const document = await ctx.db.get(documentId);
    if (!document) throw new ConvexError("Document not found");
    if (!["DRAFT", "PENDING_SIGNATURE"].includes(document.status)) return;
    await ctx.db.patch(documentId, {
      status: "PENDING_SIGNATURE",
      signatureMethod: "TYPED_CONSENT",
      signatureDispatchState: "SENT",
      updatedAt: Date.now(),
    });
    await ctx.db.insert("documentAuditLog", {
      documentId,
      action: "CONSENT_REQUESTED",
      actorRole: "SYSTEM",
      createdAt: Date.now(),
    });
  },
});
export const dispatchSignature = internalAction({
  args: { documentId: v.id("legalDocuments") },
  handler: async (ctx, args): Promise<{ requestId: string }> => {
    await ctx.runMutation(internal.legalDocuments.prepareTypedConsent, args);
    return { requestId: `LOCAL-CONSENT:${args.documentId}` };
  },
});

// Admin actions ─────────────────────────────────────────────────────────────

export const reviewDocument = auditedMutation("legalDocuments:reviewDocument")({
  args: {
    documentId: v.id("legalDocuments"),
    decision: v.union(v.literal("VERIFIED"), v.literal("REJECTED")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthorized");
    const user = await ctx.db.get(userId as Id<"users">);
    await requireAdmin(ctx, 5 * 60000);
    const document = await ctx.db.get(args.documentId);
    if (!document) throw new ConvexError("Document not found");
    if (
      args.decision === "VERIFIED" &&
      (!["SIGNED", "VERIFIED"].includes(document.status) ||
        !document.signedAt ||
        !(
          document.externalSignatureId ||
          (document.typedConsentBy === document.clientId &&
            document.typedConsentAt &&
            document.typedConsentName &&
            document.typedConsentPdfStorageId === document.pdfStorageId)
        ))
    )
      throw new ConvexError(
        "Client consent must be recorded before legal verification",
      );
    if (args.decision === "REJECTED" && document.bookingId) {
      const booking = await ctx.db.get(document.bookingId);
      if (booking?.allocatedAt)
        throw new ConvexError(
          "Allocated title requires a separate legal reversal procedure",
        );
      if (booking?.fulfillmentWorkflowId)
        await workflow.sendEvent(ctx, {
          workflowId: booking.fulfillmentWorkflowId as WorkflowId,
          name: "signature",
          value: { documentId: document._id, status: "REJECTED" },
        });
    }
    if (
      args.decision === "VERIFIED" &&
      document.signatureMethod === "TYPED_CONSENT" &&
      document.bookingId
    ) {
      const booking = await ctx.db.get(document.bookingId);
      if (booking?.fulfillmentWorkflowId)
        await workflow.sendEvent(ctx, {
          workflowId: booking.fulfillmentWorkflowId as WorkflowId,
          name: "signature",
          value: { documentId: document._id, status: "SIGNED" },
        });
    }
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
export const getClientInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => ctx.db.get(userId),
});

export const getPlotWithProject = internalQuery({
  args: { plotId: v.id("plots") },
  handler: async (ctx, { plotId }) => {
    const plot = await ctx.db.get(plotId);
    if (!plot) return null;
    const project = await ctx.db.get(plot.projectId);
    return { ...plot, project };
  },
});
