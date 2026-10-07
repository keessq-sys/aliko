export function assertCheckoutEnvironment(
  provider: "FLUTTERWAVE" | "PAYSTACK" | "KORAPAY",
  secret: string,
) {
  const environment = process.env.DEPLOYMENT_ENVIRONMENT ?? "production";
  const sandbox =
    provider === "PAYSTACK" || provider === "KORAPAY"
      ? secret.startsWith("sk_test_")
      : /TEST/i.test(secret);
  if (["staging", "development"].includes(environment)) {
    if (!sandbox)
      throw new Error("Sandbox deployment requires test payment credentials");
    return;
  }
  if (
    sandbox ||
    process.env.LIVE_TRANSACTIONS_ENABLED !== "true" ||
    (process.env.LIVE_TRANSACTION_APPROVAL_REFERENCE?.trim().length ?? 0) < 10
  )
    throw new Error(
      "Payments are temporarily unavailable. Please contact support.",
    );
}
