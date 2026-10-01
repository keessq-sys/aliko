export function minor(value: unknown) {
  const amount = Number(value);
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001 ||
    !Number.isSafeInteger(Math.round(amount * 100))
  )
    throw new Error("Invalid provider monetary value");
  return Math.round(amount * 100);
}
export function refundState(
  data: Record<string, unknown>,
): "PENDING" | "COMPLETED" | "FAILED" {
  const status = String(data.status ?? "").toLowerCase();
  let meta: any = data.meta ?? {};
  if (typeof meta === "string") {
    try {
      meta = JSON.parse(meta);
    } catch {
      meta = {};
    }
  }
  // Flutterwave's bare "completed" means initiated, pending disbursement.
  if (
    [
      "completed-bank-transfer",
      "completed-momo",
      "completed-mpgs",
      "completed-offline",
      "completed-preauth",
    ].includes(status) ||
    (status === "completed" &&
      ["successful", "success", "completed"].includes(
        String(meta.disburse_status).toLowerCase(),
      ))
  )
    return "COMPLETED";
  if (
    ["failed", "cancelled", "canceled"].includes(status) ||
    String(meta.disburse_status).toLowerCase() === "failed"
  )
    return "FAILED";
  return "PENDING";
}
