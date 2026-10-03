import { getAuthUserId, getAuthSessionId } from "@convex-dev/auth/server";

/** Every protected function checks current account state, not just its JWT. */
export async function requireUser(ctx: any) {
  const id = await getAuthUserId(ctx);
  if (!id) throw new Error("Unauthorized");
  const user = await ctx.db.get(id);
  if (!user || user.accountStatus === "SUSPENDED")
    throw new Error("Unauthorized");
  if (
    user.role === "ADMIN" &&
    process.env.SUPER_ADMIN_EMAIL &&
    user.email.toLowerCase() !== process.env.SUPER_ADMIN_EMAIL.toLowerCase()
  )
    throw new Error("Forbidden");
  const sessionId = await getAuthSessionId(ctx);
  const session = sessionId ? await ctx.db.get(sessionId) : null;
  if (!session || session.userId !== id || session.expirationTime <= Date.now())
    throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin(ctx: any, maxAgeMs = 30 * 60000) {
  const user = await requireUser(ctx);
  if (user.role !== "ADMIN") throw new Error("Forbidden — ADMIN only");
  if (process.env.ADMIN_MFA_REQUIRED === "true") {
    const enrollment = await ctx.db
      .query("adminMfa")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique();
    if (!enrollment?.enabled) throw new Error("ADMIN_MFA_REQUIRED");
    const sessionId = await getAuthSessionId(ctx);
    const proof = sessionId
      ? await ctx.db
          .query("mfaSessions")
          .withIndex("by_session", (q: any) => q.eq("sessionId", sessionId))
          .unique()
      : null;
    if (
      !proof ||
      proof.userId !== user._id ||
      proof.expiresAt <= Date.now() ||
      Date.now() - proof.verifiedAt > maxAgeMs
    )
      throw new Error("ADMIN_MFA_REQUIRED");
  }
  return user._id;
}

export function publicSignupProfile(params: Record<string, unknown>) {
  if (
    params.flow === "signUp" &&
    (params.acceptPolicies !== true || params.policyVersion !== "2026-10-01")
  )
    throw new Error(
      "Accept the current Terms and Privacy Policy before registration",
    );
  const email = String(params.email ?? "")
    .trim()
    .toLowerCase();
  const name = String(params.name ?? email.split("@")[0]).trim();
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    name.length < 1 ||
    name.length > 120
  )
    throw new Error("Provide a valid name and email");
  return {
    email,
    registrationPolicyVersion:
      params.flow === "signUp" ? "2026-10-01" : undefined,
    name,
    role: "CLIENT" as const,
    isDiaspora: params.isDiaspora === true,
    requestedAccountType:
      params.role === "AGENT"
        ? ("AGENT" as const)
        : params.role === "ESTATE_MANAGER"
          ? ("ESTATE_MANAGER" as const)
          : ("CLIENT" as const),
    agencyName:
      typeof params.agencyName === "string"
        ? params.agencyName.trim().slice(0, 160)
        : undefined,
    companyName:
      typeof params.companyName === "string"
        ? params.companyName.trim().slice(0, 160)
        : undefined,
    kycVerified: false,
    accountStatus: "ACTIVE" as const,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };
}
