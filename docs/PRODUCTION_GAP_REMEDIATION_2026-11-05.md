# Production gap remediation — 5 November 2026

This supplements the application review dated 4 November. It is an evidence record, not an unrestricted-live-transactions certificate.

## Implemented in this change

- Korapay full-order refunds for live successful checkout attempts, with administrator authorization, server-resolved amounts, minimum NGN 100, one durable reference per order, audit records and a confirmation prompt. Repeated requests reuse the existing operation rather than sending another provider POST.
- Refund acceptance is never treated as delivery. The server re-fetches the refund and checks reference, original charge, currency and amount before updating money/access state. Unknown outcomes remain reserved; a bounded scheduled reconciler revisits pending operations. Signed refund callbacks use the existing signature, payload-limit, digest and event-claim controls and re-query Korapay.
- A pending refund blocks manager paid access, new agent fee approval and land allocation. A confirmed full refund marks checkout/attempt records refunded, revokes its manager subscription, clears stale paid-through dates, returns an affected agent application to review, and adjusts service/land balances. Allocated land cannot be automatically refunded. Property reservations, signed documents and legal title are never automatically reversed.
- Administrator finance UI for refund initiation, status and provider verification. This supports **full refunds**, not arbitrary partial refunds or automatic replacement attempts after a failed/ambiguous operation.
- A separately labelled Korapay settlement-report import: normalized CSV columns `payment_reference,gross,fees,net`, 1–100 rows, NGN only. It rejects mismatched live charges, duplicate transactions, inconsistent amounts and conflicting batch imports; exact retries are idempotent. Source evidence/ticket, actor and totals are recorded. Status is `REPORTED_NOT_BANK_VERIFIED`.
- Audited administrator portrait upload for an existing agent, with the original content/size/ownership validation retained. The asset belongs to the target agent; the administrator's avatar and the accounts' roles are preserved. Other users cannot nominate a target. Administrator access is checked again at completion.
- Restore receipts now record target, source digest, operator, duration and exit status. Successful CLI import is explicitly `IMPORT_COMPLETED_INTEGRITY_PENDING`, not a passed recovery exercise.
- Compatible Sentry dependency updates remove the five previously moderate advisory entries. Current lockfile audit: **8 low, 0 moderate, 0 high, 0 critical**. The low-severity SvelteKit/adapter/Convex-Svelte chains still require tested major upgrades; deprecated authentication dependencies also remain.

## Provider contract and evidence limits

Kora documents refund initiation at `POST /merchant/api/v1/refunds/initiate` and lookup by merchant refund reference at `GET /merchant/api/v1/refunds/:reference`. The integration uses these documented contracts: [Kora Refunds API](https://developers.korapay.com/docs/refunds-api).

Kora's settlement documentation describes viewing batches and their component transactions in its merchant dashboard and choosing Kora balance or a verified bank account as destination: [settlement overview](https://developers.korapay.com/docs/get-settled), [local settlements](https://developers.korapay.com/docs/local-settlements). No public settlement-list API contract was established in this review. Therefore the implemented import is an **audited merchant report matched to app charges**, not an invented API integration or proof of a bank credit. Obtain an approved provider API contract to automate collection, and a bank/merchant statement to verify actual receipt.

Read-only Resend API inspection returned HTTP 200 and two recent messages with `delivered` status. This proves provider delivery status for those sampled messages only; it does not certify every signup, recovery, receipt, bounce and complaint journey. See [Resend list emails](https://resend.com/docs/api-reference/emails/list-emails).

## Recovery evidence

A new production export including file storage completed successfully into an owner-restricted directory outside the repository. Its SHA-256 matched the manifest; ZIP inspection found 158 table streams and 665 records. There were zero storage-file entries in this snapshot. R2 objects are separate and are not included in a Convex export. The archive contains sensitive account data and is not a public deliverable or Git artifact.

No staging restore was run: no isolated staging deployment/key exists in the connected protected configuration. The production key must not be used as a restore target. Existing target guards reject `gallant-husky-352`. Automatic Convex backup scheduling/retention still needs account-level activation and verification. A one-off export does not prove automatic backups.

## External or explicitly deferred acceptance

| Item | Current evidence | Required next step |
|---|---|---|
| Real agent portrait | Approved Snapchat image inspected locally. Exact supplied email had no matching production agent application. User explicitly requested skipping record creation. | Existing agent/account, followed by persisted upload and directory verification. The personal photo remains outside Git. |
| Funded registration payment | Supplied payer email is the super-admin; it has no agent application. No registration identity was fabricated, no charge was made, and no legitimate funded callback was asserted. | Owner completes a valid agent registration and authorizes its NGN 2,000 checkout; verify provider charge, callback replay and merchant/bank settlement. |
| Refund provider acceptance | Code, mocked provider and backend tests cover request/verification/replay paths. | A provider-approved sandbox/live settled charge and owner-authorized refund; confirm actual receipt by the customer. |
| Settlement import | Controlled report import implemented. | Actual merchant batch export, matching transaction references and independent bank/merchant receipt evidence. |
| Protected GitHub environments | Connected repository permission reports `admin=false`, `maintain=false`, `push=true`; environments API returned an empty list. Existing workflow fails closed without production reviewer protection. | Repository administrator creates/protects preview, staging and production and stores environment-scoped credentials. |
| Staging and restore | Production backup and integrity record exist; restore remains prohibited against production. | Provision an isolated target, load a reviewed snapshot under an appointed operator, time the import, compare records/files and run auth/payment/application smoke tests. |
| Secrets and monitoring | No replacement/revocation or external alert-delivery evidence was fabricated. | Account owner confirms rotation/revocation, separate deployment keys, monitoring account configuration and a named alert recipient. |
| Legal and operating approval | Policy pages and controls are engineering artifacts. | Nigerian counsel and the business owner approve fee/refund/retention/consent wording, legal-title handling, incident ownership and operational limits. Software cannot grant regulatory or legal approval. |

## Release validation

Final test counts, deployment revision and CI evidence are appended after release verification. Earlier 147-test success predates the last portrait and renewal regressions and must not be presented as final verification for all changes.

Validation completed before release: Svelte check 0 errors/0 warnings; 151 backend tests passed. After the final monetary-currency guard, all 9 Korapay operation tests passed again. Production build completed successfully. GitHub and hosted acceptance are recorded separately below.


### Completed release verification

- Application revision: aa3cb513f4963c101e948a0ee360c9ba258d1c04.
- GitHub CI 42079178172 passed, including lint, backend tests, production build and 40 browser regressions: https://github.com/keessq-sys/aliko/actions/runs/42079178172 .
- Convex functions/schema deployed successfully. Cloudflare frontend: https://e767df65.aliko-3f9.pages.dev . Custom domain returned HTTP 200 with matching immutable asset references.
- Authenticated hosted queries for Korapay refunds and settlement reports succeeded. The finance controls rendered, the page fit a 390px viewport, and the agent-detail portrait-upload control rendered without browser page errors.
- The hosted check performed no refund, payment, agent creation or portrait mutation. These results certify the tested controls, not external transfer delivery or unrestricted production readiness.
- The approved personal photo remains untracked and was excluded from the release. This final documentation-only update does not change the tested application artifact.

