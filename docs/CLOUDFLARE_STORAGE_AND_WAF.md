# Cloudflare storage and WAF

The application uses Convex Storage for authenticated image uploads by default. When the Cloudflare Pages project has an R2 binding named `MEDIA`, the same dashboard uploader stores new images in R2 and serves them through `/api/media/*`. If R2 is unavailable, the uploader automatically falls back to Convex Storage.

R2 must be enabled once from **Cloudflare Dashboard → R2 Object Storage** for the account before the API can create a bucket. Until that account-level activation is complete, Cloudflare returns `Please enable R2 through the Cloudflare Dashboard`; this is an account state rather than an application or token error.

Run the idempotent setup command from a trusted terminal. Use a scoped token with Pages Edit, Workers R2 Storage Edit, Zone Read and Zone WAF Edit permissions. Do not save credentials in `.env` files that are committed to Git.

```powershell
$env:CLOUDFLARE_ACCOUNT_ID = "your-account-id"
$env:CLOUDFLARE_API_TOKEN = "your-scoped-api-token"
$env:CLOUDFLARE_PAGES_PROJECT = "aliko"
$env:R2_BUCKET_NAME = "aliko-diamond-key-media"
npm run cloudflare:setup
```

The command verifies account-owned (`cfat_`) tokens against Cloudflare's account-scoped verifier, creates the R2 bucket when needed, binds it to preview and production Pages deployments as `MEDIA`, and adds idempotent WAF rules for sensitive-path probes and request bursts against authentication and upload routes. The same `MEDIA` binding is declared in `wrangler.toml`, which keeps direct Wrangler deployments from replacing the production configuration without R2. Storage and WAF setup are attempted independently, so a pending R2 activation does not prevent the WAF rules from being installed.

The rate rule blocks an IP for 10 seconds after 10 matching requests in 10 seconds. These values fit the currently provisioned Cloudflare zone plan and can be tightened after reviewing real traffic in Cloudflare Security Analytics.

After setup, redeploy the Pages project so the new binding is available. Images uploaded before R2 is enabled remain available through Convex Storage.
