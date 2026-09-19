import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Auth (managed by @convex-dev/auth) ───────────────────────────────────
  ...authTables,

  // ── Users & Roles ─────────────────────────────────────────────────────────
  users: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.union(
      v.literal("ADMIN"),
      v.literal("AGENT"),
      v.literal("CLIENT"),
      v.literal("DIASPORA_CLIENT"),
      v.literal("TENANT"),
    ),
    isDiaspora: v.boolean(),
    kycVerified: v.boolean(),
    // auth user id from @convex-dev/auth
    authId: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    country: v.optional(v.string()),
    occupation: v.optional(v.string()),
    createdAt: v.number(),
    lastActiveAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_authId", ["authId"])
    .index("by_role", ["role"]),

  // ── Projects (Estates / Developments) ────────────────────────────────────
  projects: defineTable({
    name: v.string(),
    slug: v.string(),
    location: v.string(),
    lga: v.string(),           // Local Government Area
    state: v.string(),
    description: v.string(),
    fullDescription: v.optional(v.string()),
    masterPlanModelUrl: v.optional(v.string()),
    heroImageStorageId: v.optional(v.id("_storage")),
    galleryStorageIds: v.optional(v.array(v.id("_storage"))),
    // Legal documentation
    surveyPlanRef: v.optional(v.string()),
    agisRef: v.optional(v.string()),
    layoutApprovalRef: v.optional(v.string()),
    developerCacRc: v.optional(v.string()),
    // Amenities
    amenities: v.array(v.string()),
    infrastructure: v.array(v.string()),
    // Status
    isActive: v.boolean(),
    isFeatured: v.boolean(),
    phase: v.optional(v.string()),
    totalPlots: v.number(),
    availablePlots: v.number(),
    // Developer info
    developerName: v.optional(v.string()),
    developerWebsite: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"])
    .index("by_featured", ["isFeatured"]),

  // ── Plots (Individual Land Units) ────────────────────────────────────────
  plots: defineTable({
    projectId: v.id("projects"),
    beaconNumber: v.string(),
    plotNumber: v.string(),
    sizeSqm: v.number(),
    price: v.number(),
    serviceChargeAnnual: v.optional(v.number()),
    status: v.union(
      v.literal("AVAILABLE"),
      v.literal("RESERVED"),
      v.literal("SOLD"),
      v.literal("UNDER_DEVELOPMENT"),
      v.literal("OFF_PLAN"),
    ),
    titleType: v.union(
      v.literal("C_OF_O"),
      v.literal("GOVERNORS_CONSENT"),
      v.literal("DEED_OF_ASSIGNMENT"),
      v.literal("R_OF_O"),
      v.literal("STATUTORY_OFFER"),
    ),
    titleVerified: v.boolean(),
    verificationDocsUrls: v.optional(v.array(v.string())),
    agisNumber: v.optional(v.string()),
    // 3D master plan coordinates
    positionX: v.optional(v.number()),
    positionY: v.optional(v.number()),
    positionZ: v.optional(v.number()),
    // Geo coordinates
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    boundaries: v.optional(v.string()),  // GeoJSON polygon
    // Flags
    isCornerPlot: v.boolean(),
    isPrimeLocation: v.boolean(),
    isFeatured: v.boolean(),
    tags: v.optional(v.array(v.string())),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    // Growth projection
    projectedGrowthPct: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_beacon", ["beaconNumber"])
    .index("by_status", ["status"])
    .index("by_project_status", ["projectId", "status"]),

  // ── Bookings ──────────────────────────────────────────────────────────────
  bookings: defineTable({
    clientId: v.id("users"),
    plotId: v.id("plots"),
    reference: v.string(),
    paymentStatus: v.union(
      v.literal("PENDING"),
      v.literal("PARTIAL"),
      v.literal("SUCCESS"),
      v.literal("FAILED"),
      v.literal("REFUNDED"),
    ),
    totalAmount: v.number(),
    paidAmount: v.number(),
    installmentPlan: v.optional(v.string()),  // e.g. "6-MONTHS", "12-MONTHS", "OUTRIGHT"
    nextPaymentDate: v.optional(v.number()),
    nextPaymentAmount: v.optional(v.number()),
    notes: v.optional(v.string()),
    agentId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_plot", ["plotId"])
    .index("by_reference", ["reference"])
    .index("by_status", ["paymentStatus"]),

  // ── Payments ──────────────────────────────────────────────────────────────
  payments: defineTable({
    bookingId: v.id("bookings"),
    provider: v.union(v.literal("PAYSTACK"), v.literal("FLUTTERWAVE"), v.literal("BANK_TRANSFER")),
    amount: v.number(),
    reference: v.string(),
    providerReference: v.optional(v.string()),
    status: v.union(v.literal("PENDING"), v.literal("SUCCESS"), v.literal("FAILED")),
    channel: v.optional(v.string()),  // card, bank, ussd
    currency: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_booking", ["bookingId"])
    .index("by_reference", ["reference"])
    .index("by_status", ["status"]),

  // ── Legal Documents ───────────────────────────────────────────────────────
  legalDocuments: defineTable({
    type: v.union(
      v.literal("DEED_OF_ASSIGNMENT"),
      v.literal("TENANCY_AGREEMENT"),
      v.literal("GUARANTOR_FORM"),
      v.literal("OFFER_LETTER"),
      v.literal("PAYMENT_SCHEDULE"),
      v.literal("LETTER_OF_ALLOCATION"),
    ),
    referenceCode: v.string(),
    status: v.union(
      v.literal("DRAFT"),
      v.literal("PENDING_SIGNATURE"),
      v.literal("SIGNED"),
      v.literal("VERIFIED"),
      v.literal("REJECTED"),
      v.literal("EXPIRED"),
    ),
    clientId: v.id("users"),
    plotId: v.optional(v.id("plots")),
    bookingId: v.optional(v.id("bookings")),
    pdfStorageId: v.optional(v.id("_storage")),
    externalSignatureId: v.optional(v.string()),  // Dropbox Sign request ID
    signedAt: v.optional(v.number()),
    verifiedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_reference", ["referenceCode"])
    .index("by_client", ["clientId"])
    .index("by_status", ["status"])
    .index("by_booking", ["bookingId"]),

  // ── Document Audit Trail ──────────────────────────────────────────────────
  documentAuditLog: defineTable({
    documentId: v.id("legalDocuments"),
    action: v.string(),
    actorId: v.optional(v.id("users")),
    actorRole: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_actor", ["actorId"]),

  // ── Construction Milestones ───────────────────────────────────────────────
  milestones: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    percentComplete: v.number(),
    phase: v.optional(v.string()),
    mediaStorageIds: v.optional(v.array(v.id("_storage"))),
    videoUrls: v.optional(v.array(v.string())),
    publishedAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_project", ["projectId"])
    .index("by_project_date", ["projectId", "publishedAt"]),

  // ── Site Visit Requests ───────────────────────────────────────────────────
  siteVisitRequests: defineTable({
    clientId: v.id("users"),
    projectId: v.id("projects"),
    plotId: v.optional(v.id("plots")),
    requestedAt: v.number(),
    preferredTime: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("CONFIRMED"),
      v.literal("COMPLETED"),
      v.literal("CANCELLED"),
    ),
    googleCalendarEventId: v.optional(v.string()),
    agentId: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    confirmationSentAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_date", ["requestedAt"]),

  // ── KYC Verifications ─────────────────────────────────────────────────────
  kycVerifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("NIN"),
      v.literal("BVN"),
      v.literal("PASSPORT"),
      v.literal("DRIVERS_LICENSE"),
      v.literal("CAC"),
    ),
    status: v.union(v.literal("PENDING"), v.literal("VERIFIED"), v.literal("FAILED")),
    providerReference: v.optional(v.string()),
    verifiedData: v.optional(v.any()),
    failureReason: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"])
    .index("by_status", ["status"]),

  // ── WhatsApp Bot Sessions ─────────────────────────────────────────────────
  whatsAppSessions: defineTable({
    phone: v.string(),
    state: v.string(),
    context: v.optional(v.any()),
    needsHumanReview: v.boolean(),
    assignedAgentId: v.optional(v.id("users")),
    resolvedAt: v.optional(v.number()),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_phone", ["phone"])
    .index("by_needs_review", ["needsHumanReview"]),

  // ── Notification Log ──────────────────────────────────────────────────────
  notificationLog: defineTable({
    channel: v.union(v.literal("WHATSAPP"), v.literal("EMAIL"), v.literal("SMS"), v.literal("PUSH")),
    recipient: v.string(),
    subject: v.optional(v.string()),
    templateName: v.optional(v.string()),
    message: v.string(),
    status: v.union(v.literal("SENT"), v.literal("FAILED"), v.literal("QUEUED")),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_recipient", ["recipient"])
    .index("by_status", ["status"])
    .index("by_channel_date", ["channel", "createdAt"]),

  // ── Architectural Models (for cost calculator) ────────────────────────────
  architecturalModels: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    modelUrl: v.optional(v.string()),
    bedrooms: v.number(),
    bathrooms: v.number(),
    stories: v.number(),
    costPerSqm: v.number(),
    thumbnailStorageId: v.optional(v.id("_storage")),
    category: v.union(v.literal("BUNGALOW"), v.literal("DUPLEX"), v.literal("MANSION"), v.literal("TERRACE"), v.literal("COMMERCIAL")),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),

  // ── Property Enquiries / Leads ────────────────────────────────────────────
  enquiries: defineTable({
    plotId: v.optional(v.id("plots")),
    projectId: v.optional(v.id("projects")),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    message: v.optional(v.string()),
    source: v.optional(v.string()),  // website, whatsapp, referral
    status: v.union(
      v.literal("NEW"),
      v.literal("CONTACTED"),
      v.literal("QUALIFIED"),
      v.literal("CONVERTED"),
      v.literal("LOST"),
    ),
    assignedAgentId: v.optional(v.id("users")),
    nextFollowUpAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_agent", ["assignedAgentId"])
    .index("by_date", ["createdAt"]),
});
