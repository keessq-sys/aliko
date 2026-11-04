# Agent, listing and verification remediation — 4 November 2026

## Changes

- The shared file picker stops native-input clicks from bubbling back into its chooser handler. It clears object URLs and selected files after a successful save or a destination change, and allows selecting the same file again.
- A property/land gallery submission can create its draft from the entered title, type, neighbourhood, state/LGA, price, area and description. It retains the selected image batch while the new destination is created. The existing limit is 1–7 images. Non-admin submissions remain private until administrative approval.
- Profile-photo updates and agent enrolment photos now use a same-origin, session-authenticated server endpoint. The endpoint validates type/size, sanitizes image content, hashes it, creates an owner-bound Convex upload intent, stores the file and registers it before returning the saved portrait URL. Profile queries resolve the current storage URL. Registration and existing-account editors use the same path.
- Administrators can open an agent application detail panel, including portrait, contact/address/location, agency/experience, masked submitted NIN, payment state, manual review reference and notes. The panel scrolls into view and has a query-error state.
- Automated identity/BVN integration remains unavailable. The system does not infer verified identity from the length or presence of a submitted NIN. Agent approval requires a recorded physical identity/address confirmation reference. Only manually confirmed, approved active agents appear in the verified directory. Existing approvals without such a reference require re-review.
- New agent applications carry a one-time **₦2,000** fee set by the backend. Enrolment creates an owner-bound Korapay checkout and redirects there. Account settings offer payment resumption. Successful payment does not approve the application or grant the agent role. Approval of a fee-bearing application requires a matching settled non-sandbox attempt. Existing applications are not retroactively charged.
- The registration stepper connector aligns with the numbered circles rather than crossing the labels.

## Acceptance and limits

Local automated tests exercise approval authorization, fee settlement requirements, administrator-only detail access and portrait HTTP session/origin/type checks. Existing storage tests retain ownership and content-validation coverage. A local browser portrait preview must decode the image, not merely expose an image element.

Production database deployment, Pages deployment, authenticated browser upload acceptance and CI results are recorded separately in the release evidence. A passing local test is not proof of a real payment or a physical identity examination. Administrators remain responsible for actually conducting and recording physical confirmation. No BVN provider or government identity verification is claimed.

Do not use real customer records for synthetic acceptance. Diagnostic draft inventory is private and must be deleted after testing. Never include credentials, session tokens or NIN values in release evidence.
