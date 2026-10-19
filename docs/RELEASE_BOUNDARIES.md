# Release and environment boundaries

Production publication is explicit. Cloudflare Pages automatic Git publication is disabled; CI validates changes without publishing them. Use the protected production workflow once repository administrators have configured reviewer approvals, or a trusted operator after verification. Pushing to main alone does not publish the site.

## Isolated non-production deployments

Automatic Cloudflare Git previews are disabled until isolated Convex deployments and credentials are provisioned. Preview runtime Convex endpoints are blank, production provider secrets are removed, live transactions are disabled, and preview media uses its own bucket. `npm run cloudflare:setup` retains these boundaries and never substitutes production as a staging fallback.

The preview workflow requires a preview-scoped Convex key. Staging requires a matching deployment-scoped key and deployment name. The build helper validates the resulting backend URL and generates a matching Cloudflare configuration. Production endpoints and keys are rejected outside production.

## Backend and frontend release order

1. Run backend regression tests, Convex type checking, frontend diagnostics, a production build and browser checks.
2. Deploy Convex and confirm the CLI completion message.
3. Run `convex run migrations:runAll --prod` and confirm the property aggregate/search backfill completes.
4. Check the public catalogue query against the deployment.
5. Publish the validated frontend and verify its deployment commit and public routes.

Image clients now request an owner-bound upload intent, upload sanitized bytes, and call the validation action before attaching media to a record. Supported image containers are inspected; this is not a complete pixel decoder or external antivirus service. Private document inspection remains a separate policy.

Catalogue text searches use relevance ordering. Clear the text search to use global price ordering. Nearby search has bounded cursor pages and explicit continuation; it is not a dedicated spatial index. Counts and search fields are maintained on listing changes, with a restartable backfill for existing records.

## Recovery and operational acceptance

Backup ZIP exports are unencrypted and must remain in protected storage. Staging restoration checks the manifest, file-storage inclusion, size and SHA-256 before import, and refuses a production target. A successful export does not prove a successful restore.

Do not certify unrestricted live transactions from source presence, local tests or a hosted checkout URL. Credential replacement, isolated staging restoration, provider acceptance and funded settlement reconciliation require separate recorded evidence. The private production handoff report tracks those gates.
