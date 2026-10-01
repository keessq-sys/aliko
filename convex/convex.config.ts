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
    JWT_PRIVATE_KEY: v.optional(v.string()),
    JWKS: v.optional(v.string()),
    MFA_ENCRYPTION_KEY: v.optional(v.string()),
    ADMIN_MFA_REQUIRED: v.optional(v.string()),
    ADMIN_MFA_RECOVERY_ENABLED: v.optional(v.string()),
    ADMIN_ALERT_EMAIL: v.optional(v.string()),
    SITE_URL: v.optional(v.string()),
    APP_URL: v.optional(v.string()),
    RESEND_API_KEY: v.optional(v.string()),
    RESEND_FROM_EMAIL: v.optional(v.string()),
    RESEND_WEBHOOK_SECRET: v.optional(v.string()),
    FLUTTERWAVE_SECRET_KEY: v.optional(v.string()),
    FLUTTERWAVE_SECRET_HASH: v.optional(v.string()),
    PAYSTACK_SECRET_KEY: v.optional(v.string()),
    WHATSAPP_ACCESS_TOKEN: v.optional(v.string()),
    WHATSAPP_PHONE_NUMBER_ID: v.optional(v.string()),
    WHATSAPP_VERIFY_TOKEN: v.optional(v.string()),
    WHATSAPP_APP_SECRET: v.optional(v.string()),
    DROPBOX_SIGN_API_KEY: v.optional(v.string()),
    DROPBOX_SIGN_CLIENT_ID: v.optional(v.string()),
    GOOGLE_MAPS_API_KEY: v.optional(v.string()),
    MALWARE_SCANNER_URL: v.optional(v.string()),
    MALWARE_SCANNER_API_KEY: v.optional(v.string()),
    MALWARE_SCANNER_PROVIDER: v.optional(v.string()),
    MEDIA_PROCESSOR_URL: v.optional(v.string()),
    MEDIA_PROCESSOR_KEY: v.optional(v.string()),
    DROPBOX_SIGN_TEST_MODE: v.optional(v.string()),
    DEPLOYMENT_ENVIRONMENT: v.optional(v.string()),
    LIVE_TRANSACTIONS_ENABLED: v.optional(v.string()),
    LIVE_TRANSACTION_APPROVAL_REFERENCE: v.optional(v.string()),
    QOREID_CLIENT_ID: v.optional(v.string()),
    QOREID_CLIENT_SECRET: v.optional(v.string()),
    QOREID_WEBHOOK_SECRET: v.optional(v.string()),
    QOREID_WORKFLOW_ID: v.optional(v.string()),
    SENTRY_DSN: v.optional(v.string()),
    SENTRY_RELEASE: v.optional(v.string()),
  },
});

app.use(rateLimiter);
app.use(workflow);
app.use(workpool, { name: "integrationWorkpool" });
app.use(migrations);
app.use(aggregate, { name: "paymentAggregate" });
app.use(aggregate, { name: "bookingAggregate" });
app.use(aggregate, { name: "serviceRequestAggregate" });
app.use(aggregate, { name: "managementAggregate" });
app.use(aggregate, { name: "estateAggregate" });

export default app;
