# Portal wiring audit and remediation — 24 October 2026

## Delivered in this change

| Flow | Frontend | Backend and authorization | Evidence |
|---|---|---|---|
| Existing agent/manager photo update | Settings and shared Account profile editor | Owned, digest-bound Convex upload intent and validated registration | Existing agent replaces avatar twice in isolated integration test |
| Property/land details | Visible editor, address/neighbourhood, price, type, state/LGA, area and rooms; edit existing draft | Owner/assignment checks, current manager subscription, reservation/payment-history protection | Owner edit and unrelated-user denial tests |
| Customer listing intake | Client My Listings and navigation | Customer-owned listings only; property media permitted, service media denied | Customer submission and cross-account media tests |
| Review and publication | Upload-and-submit, review status, rejection reason, gallery preview; admin approval controls | DRAFT → PENDING → VERIFIED/REJECTED; private until approved; gallery/detail changes withdraw publication | Agent and customer approval integration tests |
| Notifications | Admin alert opens selected listing; owner decision opens appropriate portal | In-app alert records and optional configured channels | Alert creation in integration tests |
| Public land exposure | Approved independent land cards on Land page; shared property detail/checkout | Existing publication and checkout gates | Backend publication test; no production test listing inserted |
| Lead management | Search, filters, pagination, assigned-agent status control and company conversation link | Admin or assigned agent only; customer contacts remain private | Assigned vs unrelated agent test |
| Arabic auth | LTR credential inputs with autocorrection/capitalization disabled, translated errors; Arabic workspace direction | Credentials are not translated or normalized | Live Arabic administrator sign-in HTTP 200, redirect /admin; browser request-integrity tests |

## Existing integrations reviewed

Agent leads and visits query authenticated assignments. Referrals, commissions and messages route through durable OperationsWorkspace/MessageDesk. Manager tenants, work orders, vendors, documents and expense records use management mutations; leases/occupancy and financial ledger use estateOperations. Manager property access retains active paid entitlement checks. The shared sidebar/menu source supplies portal navigation. Administrator review remains server-authorized.

## Remaining boundaries

This audit does not certify every provider, payment settlement, physical-device notification or all possible account/data combinations. The earlier production operations gates (credential replacement, isolated staging/restore rehearsal, funded settlement and provider delivery acceptance) are separate from these portal fixes. Dormant legacy markup remains beneath the active workspace branches in professional dashboards; it should be removed in a later cleanup, without treating its placeholder arrays as live data.

Ordinary customers cannot approve their own listings, publish service galleries or access professional holdings by changing a saved role. Paid managers retain subscription checks. Existing transaction-bearing listings require administrator handling instead of an owner price change.

Release-specific build, browser, CI and deployment results are recorded in the private release handoff after verification. No blanket unrestricted-production certification is made by this document.
