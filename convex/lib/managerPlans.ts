// Existing advertised plans; clients and approved agents have no invented fee.
export const MANAGER_PLANS = {
  STARTER: { monthlyFeeNgn: 25000, propertyLimit: 10 },
  PROFESSIONAL: { monthlyFeeNgn: 75000, propertyLimit: 100 },
} as const;
export async function managerEntitlement(ctx: any, user: any) {
  if (user.role === "ADMIN")
    return { allowed: true, reason: "", plan: null, propertyLimit: Infinity };
  if (user.role !== "ESTATE_MANAGER")
    return {
      allowed: false,
      reason: "Manager approval is required.",
      plan: null,
      propertyLimit: 0,
    };
  const manager = await ctx.db
    .query("estateManagers")
    .withIndex("by_user", (q: any) => q.eq("userId", user._id))
    .order("desc")
    .take(50);
  const record = manager.find(
    (row: any) => row.userId === user._id && row.status === "APPROVED",
  );
  if (!record)
    return {
      allowed: false,
      reason: "Manager approval is required.",
      plan: null,
      propertyLimit: 0,
    };
  const subscription = await ctx.db
    .query("managerSubscriptions")
    .withIndex("by_owner", (q: any) => q.eq("ownerId", user._id))
    .order("desc")
    .first();
  const now = Date.now();
  if (
    !subscription ||
    subscription.status !== "ACTIVE" ||
    subscription.startsAt > now ||
    subscription.endsAt <= now
  )
    return {
      allowed: false,
      reason: "An active paid manager subscription is required.",
      plan: null,
      propertyLimit: 0,
    };
  const order = await ctx.db.get(subscription.orderId);
  const attempt = order
    ? await ctx.db
        .query("checkoutAttempts")
        .withIndex("by_order", (q: any) => q.eq("orderId", order._id))
        .order("desc")
        .first()
    : null;
  if (
    !order ||
    order.ownerId !== user._id ||
    order.kind !== "MANAGER" ||
    order.targetId !== String(record._id) ||
    order.status !== "PAID" ||
    !attempt ||
    attempt.status !== "SUCCESS" ||
    attempt.testMode ||
    !attempt.providerId ||
    attempt.amount !== order.amount ||
    attempt.currency !== "NGN" ||
    subscription.amount !== order.amount ||
    !(subscription.plan in MANAGER_PLANS)
  )
    return {
      allowed: false,
      reason: "A matching settled subscription payment is required.",
      plan: null,
      propertyLimit: 0,
    };
  const identity = await ctx.db
    .query("identities")
    .withIndex("by_user", (q: any) => q.eq("userId", user._id))
    .unique();
  if (
    identity?.status !== "VERIFIED" ||
    !user.kycVerified ||
    !user.operatingState ||
    !user.operatingLga ||
    !user.whatsapp ||
    !user.name?.trim()
  )
    return {
      allowed: false,
      reason:
        "Complete your NIN, state, LGA and WhatsApp profile before paid operations.",
      plan: null,
      propertyLimit: 0,
    };
  return {
    allowed: true,
    reason: "",
    plan: subscription.plan,
    propertyLimit:
      MANAGER_PLANS[subscription.plan as keyof typeof MANAGER_PLANS]
        .propertyLimit,
  };
}
export async function requireManagerSubscription(ctx: any, user: any) {
  const access = await managerEntitlement(ctx, user);
  if (!access.allowed) throw new Error(access.reason);
  return access;
}
