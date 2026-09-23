# Convex production operations

The application installs and registers the Rate Limiter, Workflow, Workpool,
Migrations, and Aggregate components in `convex/convex.config.ts`. Component
state is isolated per Convex deployment.

## Deployment separation

| Environment  | Convex target                        | Cloudflare target          | Required CI secret          |
| ------------ | ------------------------------------ | -------------------------- | --------------------------- |
| Developer    | Personal `dev/<member>` deployment   | Local Vite                 | Local Convex login          |
| Pull request | Ephemeral `preview/pr-<number>`      | Pages branch `pr-<number>` | `CONVEX_PREVIEW_DEPLOY_KEY` |
| Staging      | Dedicated staging project/deployment | Pages branch `staging`     | `CONVEX_STAGING_DEPLOY_KEY` |
| Production   | `gallant-husky-352`                  | Pages branch `main`        | `CONVEX_DEPLOY_KEY`         |

Create preview and staging deploy keys in the Convex dashboard. Keep all three
keys in separate GitHub environments (`preview`, `staging`, `production`). A
production key must never be copied into preview or staging.

## Required environment variables

Configure these independently on each deployment. Preview defaults should use
test/sandbox provider accounts.

- `SITE_URL`, `APP_URL`
- `RESEND_API_KEY`
- `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_SECRET_HASH`
- `PAYSTACK_SECRET_KEY`
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`,
  `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`
- `DROPBOX_SIGN_API_KEY`, `DROPBOX_SIGN_CLIENT_ID`
- `MALWARE_SCANNER_URL`, `MALWARE_SCANNER_API_KEY` when an approved scanning
  provider is connected

Rotate external-provider secrets every 90 days and immediately after staff or
vendor access changes. Update the provider first, then Convex, verify a sandbox
transaction/webhook, and revoke the prior credential.

## Release procedure

1. Run `npm test`, `npm run build`, and `npm run convex:codegen`.
2. Deploy schema and functions to staging and run `npm run convex:migrate` with
   the staging deployment selected.
3. Exercise registration, checkout, signed webhooks, deed creation, messages,
   file quarantine/review, and account suspension.
4. Deploy production through `deploy-production.yml`.
5. Run `npm run convex:migrate:prod`. Migrations are versioned, restartable,
   and safe to re-run; the component records completion.
6. Review Convex Health, function failures, dead-letter jobs, and payment totals.

## Backup and restore

On each production deployment, open **Settings → Backups**, enable automatic
daily backups, and include file storage. Periodic backups require a Convex Pro
plan. Backups contain database records and storage, but not functions,
environment variables, or pending scheduled functions.

Quarterly, restore the newest production backup into staging, reapply staging
environment variables, deploy the matching Git revision, and run the smoke
tests. Record the backup timestamp, restore duration, row/file spot checks, and
the operator in the incident log. Never rehearse a restore against production.

## Logs, exceptions, and privacy

On **Settings → Integrations**, configure a log stream and one exception sink
(Sentry, PostHog, or Datadog). These integrations require a supported paid
plan and provider credentials. Alert on failed payment settlement, webhook
signature failures, workflow failures, and dead-letter jobs.

Do not log webhook bodies, access tokens, KYC data, card data, phone message
contents, document URLs, or signed download URLs. Log event IDs, internal
references, status, provider, request ID, and redacted error summaries only.
The application webhook ledger stores SHA-256 payload digests rather than raw
provider payloads.

## Usage and spending limits

Set warning and disable thresholds in **Settings → Usage Limits** for function
calls, action compute, database I/O, data egress, and search. Use lower limits
for development and preview deployments. Configure the team monthly spending
limit on the billing page. Threshold selection requires an owner to use normal
traffic and budget figures; code cannot safely choose financial limits.

## Authentication controls

Password sign-in limits failed attempts to eight per hour. New registrations
are rate limited and audited. Administrators can suspend an account through
`users:setAccountStatus`; suspension invalidates all active sessions and blocks
new sessions. Role checks and resource ownership remain enforced by server
functions.

MFA and enterprise SSO require selecting and configuring an identity provider
that supports those controls. Connect the chosen OIDC/SAML provider in staging,
map verified identity claims to existing users, require MFA at the provider,
and test administrator recovery before enabling it in production.

## Files and malware scanning

`storage:generateUploadUrl` validates the declared purpose, MIME type, size,
role, and upload rate. `storage:registerUpload` verifies Convex's actual storage
metadata and records ownership. KYC, legal, and service attachments remain in
`PENDING_SCAN` and cannot be downloaded until an administrator or scanning
integration marks them `ACTIVE`. Unsupported or mismatched uploads are deleted.
Expired service attachments are purged daily.

Until a malware-scanning provider is configured, administrators must review
quarantined attachments before activation. A provider should download through
an internal action, scan with an idempotency key based on the storage ID, and
call the same review transition; it must never expose a public storage URL.

## Runtime components

- **Rate Limiter:** registration, enquiries, service requests, messages,
  checkout, storage uploads, and webhook capacity.
- **Workflow:** verified payment → idempotent deed generation → signature-ready
  notification. Signature and allocation events can extend this durable flow.
- **Workpool:** bounded, retried WhatsApp webhook processing with completion
  tracking and a dead-letter queue.
- **Migrations:** payment normalization and aggregate backfills.
- **Aggregate:** logarithmic payment, booking, and service-request totals for
  administrator dashboards.
- **Scheduled functions:** payment reminders, stale-request escalation,
  stalled-job monitoring, and expired-asset retention.

The `operations:listDeadLetters` query gives administrators the jobs requiring
manual investigation. Replaying an external side effect must use the original
provider idempotency key.
