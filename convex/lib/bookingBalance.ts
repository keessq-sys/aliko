/** Checkout collects the outstanding contracted balance, without inventing instalment terms. */
export function bookingBalance(booking: {
  paymentStatus: string;
  totalAmount: number;
  paidAmount: number;
}) {
  const amount =
    Math.round((booking.totalAmount - booking.paidAmount) * 100) / 100;
  if (
    !["PENDING", "PARTIAL"].includes(booking.paymentStatus) ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error("This booking has no payable outstanding balance.");
  }
  return amount;
}
