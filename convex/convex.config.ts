import { defineApp } from "convex/server";
import { v } from "convex/values";
import aggregate from "@convex-dev/aggregate/convex.config.js";
import migrations from "@convex-dev/migrations/convex.config.js";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import workflow from "@convex-dev/workflow/convex.config.js";
import workpool from "@convex-dev/workpool/convex.config.js";

const app = defineApp({
  // Provider credentials remain optional at deploy time so preview deployments
  // can build safely. Each integration checks its own required variables before
  // accepting traffic.
  env: {
    SITE_URL: v.optional(v.string()),
    APP_URL: v.optional(v.string()),
    RESEND_API_KEY: v.optional(v.string()),
    FLUTTERWAVE_SECRET_KEY: v.optional(v.string()),
    FLUTTERWAVE_SECRET_HASH: v.optional(v.string()),
    PAYSTACK_SECRET_KEY: v.optional(v.string()),
    WHATSAPP_ACCESS_TOKEN: v.optional(v.string()),
    WHATSAPP_PHONE_NUMBER_ID: v.optional(v.string()),
    WHATSAPP_VERIFY_TOKEN: v.optional(v.string()),
    WHATSAPP_APP_SECRET: v.optional(v.string()),
    DROPBOX_SIGN_API_KEY: v.optional(v.string()),
    DROPBOX_SIGN_CLIENT_ID: v.optional(v.string()),
    MALWARE_SCANNER_URL: v.optional(v.string()),
    MALWARE_SCANNER_API_KEY: v.optional(v.string()),
  },
});

app.use(rateLimiter);
app.use(workflow);
app.use(workpool, { name: "integrationWorkpool" });
app.use(migrations);
app.use(aggregate, { name: "paymentAggregate" });
app.use(aggregate, { name: "bookingAggregate" });
app.use(aggregate, { name: "serviceRequestAggregate" });

export default app;
