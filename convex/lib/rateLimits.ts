import { HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

/** Transactional application-level abuse controls shared by public entry points. */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  registration: { kind: "fixed window", rate: 5, period: HOUR },
  enquiry: { kind: "token bucket", rate: 6, period: HOUR, capacity: 3 },
  serviceRequest: { kind: "token bucket", rate: 5, period: HOUR, capacity: 2 },
  serviceMessage: {
    kind: "token bucket",
    rate: 20,
    period: MINUTE,
    capacity: 10,
  },
  checkout: { kind: "token bucket", rate: 5, period: HOUR, capacity: 2 },
  upload: { kind: "token bucket", rate: 20, period: HOUR, capacity: 5 },
  webhook: { kind: "fixed window", rate: 600, period: MINUTE, shards: 8 },
});

export function contactRateKey(email: string, phone: string) {
  return `${email.trim().toLowerCase()}|${phone.replace(/\D/g, "").slice(-12)}`;
}
