# Deployment Guide

This guide covers deploying the Aliko Diamond Key platform to production and preview environments.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   GitHub        │────▶│  GitHub Actions  │────▶│  Cloudflare     │
│   Repository    │     │  CI/CD Pipeline  │     │  Pages          │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Convex          │
                       │  Deployment      │
                       └──────────────────┘
```

## Prerequisites

- GitHub repository with Actions enabled
- Cloudflare account with Pages enabled
- Convex account with deployment created
- All service accounts configured (Paystack, WhatsApp, etc.)

## Initial Setup (One-Time)

### 1. Configure GitHub Repository Secrets

Go to **Settings → Secrets and Variables → Actions** and add:

| Secret | Value | Description |
|--------|-------|-------------|
| `CLOUDFLARE_API_TOKEN` | `...` | Cloudflare API token with `Account:Read`, `Pages:Edit` |
| `CLOUDFLARE_ACCOUNT_ID` | `...` | From `wrangler whoami --json` |
| `CONVEX_DEPLOY_KEY` | `...` | From Convex Dashboard → Settings → Deploy Keys |
| `CONVEX_DEPLOYMENT` | `aliko-diamond-key` | Your Convex deployment name |
| `PUBLIC_CONVEX_URL` | `https://...convex.cloud` | Production Convex URL |
| `VITE_CONVEX_URL` | `https://...convex.cloud` | Same as above (build-time) |

### 2. Configure Cloudflare Pages Project

1. Go to **Cloudflare Dashboard → Pages**
2. Click **Create a project** → **Connect to Git**
3. Select your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `.svelte-kit/cloudflare`
   - **Root directory**: `/` (repository root)
5. Add environment variables (same as GitHub secrets above)
6. Deploy!

### 3. Configure Convex Production Deployment

```bash
# Create production deployment
npx convex deploy --prod

# Set production environment variables
npx convex env set AUTH_SECRET "..." --deployment production
npx convex env set PAYSTACK_SECRET_KEY "..." --deployment production
# ... set all other production secrets
```

## Deployment Workflows

### Automatic Deployment (Recommended)

#### On Push to Main/Develop

```yaml
# Triggered automatically on push to main or develop
# Runs: lint → typecheck → build → deploy Convex → deploy Cloudflare Pages
```

#### On Pull Request

```yaml
# Triggered automatically on PR
# Runs: lint → typecheck → build → deploy Convex → deploy Cloudflare Pages Preview
# Preview URL: https://preview-<pr-number>.alikodiamondkey.pages.dev
```

### Manual Deployment

#### Production Deployment

```bash
# Option 1: GitHub Actions UI
gh workflow run deploy-production.yml -f environment=production

# Option 2: Local deploy (requires all secrets configured)
npm run deploy

# Option 3: Tag-based release
git tag v1.0.0
git push origin v1.0.0
```

#### Preview Deployment

```bash
# Create a preview branch
git checkout -b preview/feature-name
git push origin preview/feature-name
# Automatically deploys to preview-<branch-name>.alikodiamondkey.pages.dev
```

## Build Process

### Local Build

```bash
# Full build (includes type checking)
npm run build

# Build without type checking (faster)
vite build
```

### Build Output

The build produces:
```
.svelte-kit/
├── cloudflare/          # Cloudflare Pages output (deploy this)
│   ├── _worker.js       # Cloudflare Worker entry point
│   ├── _routes.json     # Routing configuration
│   └── ...              # Static assets, HTML, JS, CSS
└── output/              # Standard SvelteKit output (not used for CF Pages)
```

### Build-Time Environment Variables

These must be set during build (in GitHub Actions or locally):

```bash
export PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
export VITE_CONVEX_URL=https://your-deployment.convex.cloud
npm run build
```

## Convex Deployment

### Development

```bash
# Start local Convex dev server
npx convex dev

# Push schema changes to local
npx convex push
```

### Production

```bash
# Deploy to production Convex deployment
npx convex deploy --prod

# Or with custom command
npx convex deploy --cmd "npm run build"
```

### Schema Migrations

Convex handles migrations automatically. For breaking changes:

1. Make schema changes in `convex/schema.ts`
2. Test locally with `npx convex dev`
3. Deploy to preview: `npx convex deploy --deployment preview`
4. Test thoroughly
5. Deploy to production: `npx convex deploy --prod`

## Cloudflare Pages Deployment

### Via Wrangler (Local)

```bash
# Build first
npm run build

# Deploy to preview
npx wrangler pages deploy .svelte-kit/cloudflare --branch preview --project-name aliko-diamond-key

# Deploy to production
npx wrangler pages deploy .svelte-kit/cloudflare --branch production --project-name aliko-diamond-key
```

### Via GitHub Actions (Automatic)

The workflow handles this automatically on push to main/develop.

### Custom Domains

1. Go to **Cloudflare Dashboard → Pages → aliko-diamond-key → Custom domains**
2. Add `alikodiamondkey.com` and `www.alikodiamondkey.com`
3. Configure DNS:
   - `CNAME alikodiamondkey.com aliko-diamond-key.pages.dev`
   - `CNAME www.alikodiamondkey.com aliko-diamondkey.com`
4. Enable **Always Use HTTPS**
5. Enable **Automatic HTTPS Rewrites**

## Environment-Specific Configuration

### Preview Environment

- Branch deploys: `preview-<branch-name>.alikodiamondkey.pages.dev`
- PR deploys: `preview-<pr-number>.alikodiamondkey.pages.dev`
- Uses preview KV namespaces and R2 buckets
- Uses preview Convex deployment (if configured)

### Production Environment

- Domain: `alikodiamondkey.com`
- Uses production KV namespaces and R2 buckets
- Uses production Convex deployment
- All secrets from production environment

## Monitoring & Observability

### Convex Dashboard

- **URL**: https://dashboard.convex.dev
- **Metrics**: Function calls, database reads/writes, storage usage
- **Logs**: Real-time function logs
- **Alerts**: Set up alerts for error rates, latency

### Cloudflare Pages Analytics

- **URL**: https://dash.cloudflare.com/pages/aliko-diamond-key/analytics
- **Metrics**: Requests, bandwidth, cache hit ratio
- **Web Analytics**: Enable for visitor insights

### GitHub Actions

- **URL**: https://github.com/<owner>/<repo>/actions
- **Monitor**: Workflow runs, deployment status, test results

### Application Logs

```bash
# Convex logs
npx convex logs --tail

# Cloudflare Pages logs (in dashboard)
# Or via wrangler
npx wrangler pages deployment tail --project-name aliko-diamond-key
```

## Rollback Procedures

### Convex Rollback

```bash
# List deployments
npx convex deployments --deployment production

# Rollback to previous deployment
npx convex rollback --deployment production --deployment-id <deployment-id>
```

### Cloudflare Pages Rollback

1. Go to **Cloudflare Dashboard → Pages → aliko-diamond-key → Deployments**
2. Click **...** on a previous successful deployment
3. Select **Promote to production**

### GitHub Actions Rollback

```bash
# Re-run a previous successful workflow run
gh run rerun <run-id>

# Or revert the commit and push
git revert <commit-hash>
git push origin main
```

## Troubleshooting

### Build Failures

| Error | Solution |
|-------|----------|
| `Module not found` | Run `npm ci` to reinstall dependencies |
| `TypeScript errors` | Run `npm run check` locally to fix types |
| `Convex import errors` | Ensure `convex/browser` alias in `vite.config.ts` |
| `Out of memory` | Increase Node memory: `NODE_OPTIONS="--max-old-space-size=4096"` |

### Deployment Failures

| Error | Solution |
|-------|----------|
| `Convex deploy failed` | Check Convex dashboard for errors, verify secrets |
| `Cloudflare Pages deploy failed` | Check build output directory, verify API token permissions |
| `Webhook verification failed` | Verify webhook URLs and secrets match service dashboards |
| `Function timeout` | Optimize slow functions, increase timeout limits |

### Runtime Errors

| Error | Solution |
|-------|----------|
| `Convex connection failed` | Check `PUBLIC_CONVEX_URL` and `VITE_CONVEX_URL` |
| `Auth not working` | Verify `AUTH_SECRET` is set in all environments |
| `Payments failing` | Check Paystack webhook URL and secret key |
| `WhatsApp not sending` | Verify access token, phone number ID, and webhook URL |

## Performance Optimization

### Build Optimization

```bash
# Analyze bundle size
npm run build && npx vite-bundle-analyzer

# Enable compression (automatic on Cloudflare)
# Cloudflare automatically compresses with Brotli/Gzip
```

### Runtime Optimization

- Enable Cloudflare **Auto Minify** (CSS, JS, HTML)
- Enable **Brotli** compression
- Configure **Cache Rules** for static assets
- Use **Cloudflare Images** for image optimization

## Security Checklist

### Pre-Deployment

- [ ] All secrets configured in GitHub Actions
- [ ] All secrets configured in Convex Dashboard
- [ ] All secrets configured in Cloudflare Pages
- [ ] Webhook URLs updated to production domain
- [ ] SSL/TLS certificates valid
- [ ] Security headers configured (in `hooks.server.ts`)
- [ ] Rate limiting enabled
- [ ] CORS policies configured

### Post-Deployment

- [ ] Test all critical user flows
- [ ] Verify webhooks receive events
- [ ] Check error tracking (Sentry, etc.)
- [ ] Monitor performance metrics
- [ ] Verify backup/restore procedures

## Maintenance Windows

### Scheduled Maintenance

- **Convex**: Automatic, no downtime expected
- **Cloudflare Pages**: Automatic, zero-downtime deployments
- **External APIs**: Check provider status pages

### Emergency Procedures

1. **Rollback**: Use rollback procedures above
2. **Incident Response**: Follow your organization's incident response plan
3. **Communication**: Update status page, notify stakeholders
4. **Post-Mortem**: Document root cause and prevention

---

## Quick Reference Commands

```bash
# Local development
npm run dev                    # Start dev servers
npx convex dev                 # Start Convex dev server

# Building
npm run build                  # Production build
npm run check                  # Type checking

# Deployment
npm run deploy                 # Build + deploy to Cloudflare Pages
npm run convex:push            # Deploy Convex only

# Convex
npx convex deploy --prod       # Deploy to production
npx convex env set KEY "val"   # Set environment variable
npx convex logs --tail         # View logs

# Cloudflare
npx wrangler pages deploy .svelte-kit/cloudflare --branch production
npx wrangler secret put KEY --env production

# GitHub Actions
gh workflow run deploy-production.yml
gh run list --workflow=ci.yml
gh run view <run-id> --log

# Testing
npx playwright test            # Run E2E tests
npx playwright test --ui       # Run with UI
npx playwright show-report     # View test report
```

---

*Last updated: 2024-12-19*
*Version: 1.0.0*
