# Environment Setup Guide

This document describes all environment variables required for the Aliko Diamond Key platform, organized by service and environment.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Convex Configuration](#convex-configuration)
3. [Cloudflare Pages Configuration](#cloudflare-pages-configuration)
4. [Payment Integrations](#payment-integrations)
5. [Communication Integrations](#communication-integrations)
6. [Document & Identity Verification](#document--identity-verification)
7. [Email & Notifications](#email--notifications)
8. [Maps & Location](#maps--location)
9. [Local Development](#local-development)
10. [Production Deployment](#production-deployment)
11. [Credential Rotation](#credential-rotation)

---

## Quick Start

```bash
# 1. Copy the example environment file
cp .env.example .env

# 2. Edit .env with your local development values
# 3. Run the setup script (Linux/macOS/Git Bash)
bash scripts/setup-all.sh

# 4. Or run the PowerShell version (Windows)
.\scripts\setup-all.ps1
```

---

## Convex Configuration

### Required for All Environments

| Variable | Description | Example |
|----------|-------------|---------|
| `PUBLIC_CONVEX_URL` | Public Convex deployment URL (client-side) | `https://your-deployment.convex.cloud` |
| `VITE_CONVEX_URL` | Vite build-time Convex URL (client-side) | `https://your-deployment.convex.cloud` |
| `CONVEX_DEPLOYMENT` | Convex deployment name | `aliko-diamond-key` |
| `CONVEX_DEPLOY_KEY` | Convex deploy key (from Convex dashboard) | `convex_deploy_key_...` |
| `CONVEX_HTTP_ACTIONS_URL` | Convex HTTP actions URL | `https://your-deployment.convex.site` |

### Required for Production (Convex Dashboard → Settings → Environment Variables)

| Variable | Description | Required |
|----------|-------------|----------|
| `AUTH_SECRET` | Auth encryption key (run `openssl rand -base64 33`) | ✅ Yes |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | ✅ Yes |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business phone number ID | ✅ Yes |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp Business API access token | ✅ Yes |
| `WHATSAPP_VERIFY_TOKEN` | WhatsApp webhook verification token | ✅ Yes |
| `DROPBOX_SIGN_API_KEY` | Dropbox Sign (HelloSign) API key | ✅ Yes |
| `QOREID_CLIENT_ID` | QoreID client ID for KYC | ⭕ Optional |
| `QOREID_CLIENT_SECRET` | QoreID client secret for KYC | ⭕ Optional |
| `RESEND_API_KEY` | Resend API key for transactional emails | ✅ Yes |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Google service account JSON (single-line) | ⭕ Optional |
| `GOOGLE_CALENDAR_ID` | Google Calendar ID for site visits | ⭕ Optional |
| `APP_URL` | Production application URL | ✅ Yes |

### Setting Convex Environment Variables

```bash
# Set individual variables
npx convex env set VARIABLE_NAME "value"

# Or set multiple at once
npx convex env set AUTH_SECRET "..." PAYSTACK_SECRET_KEY "..." WHATSAPP_ACCESS_TOKEN "..."
```

---

## Cloudflare Pages Configuration

### Required for Deployment

| Variable | Description | Source |
|----------|-------------|--------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | `wrangler whoami --json` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (Pages:Edit) | Cloudflare Dashboard → My Profile → API Tokens |
| `CLOUDFLARE_WORKERS_AI_TOKEN` | Workers AI token (if using AI features) | Cloudflare Dashboard → AI → Workers AI |

### KV Namespaces (Created Automatically)

Run the setup script to create these automatically:

```bash
bash scripts/setup-cloudflare.sh
```

This creates:
- `SESSIONS_KV` - Session cache and rate limiting
- Preview and production IDs for each namespace

### R2 Buckets (Created Automatically)

The setup script creates:
- `aliko-documents` - Legal documents, generated PDFs
- `aliko-property-images` - Property images, gallery uploads

### Production Secrets (Set via Wrangler)

```bash
# Set each secret for production environment
npx wrangler secret put CONVEX_URL --env production
npx wrangler secret put CONVEX_DEPLOY_KEY --env production
npx wrangler secret put AUTH_SECRET --env production
npx wrangler secret put PAYSTACK_SECRET_KEY --env production
npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID --env production
npx wrangler secret put WHATSAPP_ACCESS_TOKEN --env production
npx wrangler secret put WHATSAPP_VERIFY_TOKEN --env production
npx wrangler secret put DROPBOX_SIGN_API_KEY --env production
npx wrangler secret put QOREID_CLIENT_ID --env production
npx wrangler secret put QOREID_CLIENT_SECRET --env production
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY --env production
npx wrangler secret put GOOGLE_CALENDAR_ID --env production
```

### Preview Secrets

Repeat the above with `--env preview` for preview deployments.

---

## Payment Integrations

### Paystack (Primary Payment Gateway)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `PAYSTACK_SECRET_KEY` | Secret key for server-side operations | Paystack Dashboard → Settings → API Keys |
| `PAYSTACK_PUBLIC_KEY` | Public key for client-side (if needed) | Paystack Dashboard → Settings → API Keys |

**Webhook URL**: `https://your-domain.com/webhooks/paystack`
**Events to Subscribe**: `charge.success`, `charge.failed`, `transfer.success`, `transfer.failed`

### Flutterwave (Alternative - Not Currently Implemented)

| Variable | Description |
|----------|-------------|
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave secret key |
| `FLUTTERWAVE_PUBLIC_KEY` | Flutterwave public key |
| `FLUTTERWAVE_WEBHOOK_SECRET` | Webhook signature secret |

---

## Communication Integrations

### WhatsApp Business Cloud API

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `WHATSAPP_PHONE_NUMBER_ID` | Business phone number ID | Meta Developer Console → WhatsApp → Configuration |
| `WHATSAPP_ACCESS_TOKEN` | Permanent access token | Meta Developer Console → WhatsApp → Configuration → Access Token |
| `WHATSAPP_VERIFY_TOKEN` | Custom verification token (you choose) | Set any random string |
| `WHATSAPP_APP_ID` | WhatsApp Business App ID | Meta Developer Console → App Settings |
| `WHATSAPP_APP_SECRET` | WhatsApp Business App Secret | Meta Developer Console → App Settings |

**Webhook URL**: `https://your-domain.com/webhooks/whatsapp`
**Fields**: `messages`, `message_template_status_update`

### Resend (Transactional Emails)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `RESEND_API_KEY` | Resend API key | Resend Dashboard → API Keys |
| `RESEND_WEBHOOK_SECRET` | Webhook signing secret | Resend Dashboard → Webhooks |

**Verified Domain**: Configure a verified domain in Resend (e.g., `mail.alikodiamondkey.com`)
**From Address**: `noreply@your-verified-domain.com`

---

## Document & Identity Verification

### Dropbox Sign (HelloSign) - E-Signatures

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `DROPBOX_SIGN_API_KEY` | API key for document signing | Dropbox Sign Dashboard → Settings → API |
| `DROPBOX_SIGN_CLIENT_ID` | OAuth client ID (if using OAuth) | Dropbox Sign Dashboard → Settings → API |
| `DROPBOX_SIGN_CLIENT_SECRET` | OAuth client secret | Dropbox Sign Dashboard → Settings → API |

**Webhook URL**: `https://your-domain.com/webhooks/esign`
**Events**: `signature_request_all_signed`, `signature_request_declined`, `signature_request_expired`

### QoreID - KYC Verification (Nigeria)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `QOREID_CLIENT_ID` | Client ID | QoreID Dashboard → API Keys |
| `QOREID_CLIENT_SECRET` | Client secret | QoreID Dashboard → API Keys |
| `QOREID_WEBHOOK_SECRET` | Webhook secret | QoreID Dashboard → Webhooks |

**Webhook URL**: `https://your-domain.com/webhooks/qoreid`
**Events**: `verification.completed`, `verification.failed`

---

## Email & Notifications

### Resend (Primary)

See [Communication Integrations](#communication-integrations) above.

### Alternative: SendGrid (Not Currently Implemented)

| Variable | Description |
|----------|-------------|
| `SENDGRID_API_KEY` | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Verified sender email |
| `SENDGRID_WEBHOOK_SECRET` | Webhook secret |

---

## Maps & Location

### Google Maps Platform

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `PUBLIC_GOOGLE_MAPS_API_KEY` | Client-side Maps JavaScript API key | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_MAPS_API_KEY` | Server-side API key (if different) | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Service account JSON for Calendar API | Google Cloud Console → IAM → Service Accounts |
| `GOOGLE_CALENDAR_ID` | Calendar ID for site visit scheduling | Google Calendar → Settings → Integrate Calendar |

**Required APIs**:
- Maps JavaScript API
- Places API
- Geocoding API
- Calendar API (for site visits)

**API Key Restrictions**:
- HTTP referrers: `https://alikodiamondkey.com/*`, `https://*.alikodiamondkey.com/*`
- API restrictions: Maps JavaScript API, Places API, Geocoding API

---

## Local Development

### .env File (Create from .env.example)

```bash
# Convex
PUBLIC_CONVEX_URL=http://localhost:3210
VITE_CONVEX_URL=http://localhost:3210
CONVEX_DEPLOYMENT=local
CONVEX_DEPLOY_KEY=local_dev_key_not_needed
CONVEX_HTTP_ACTIONS_URL=http://localhost:3210

# Cloudflare (local only)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_WORKERS_AI_TOKEN=your_ai_token

# Payments
PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
PAYSTACK_SECRET_KEY=sk_test_...

# WhatsApp (use test credentials)
WHATSAPP_PHONE_NUMBER_ID=test_id
WHATSAPP_ACCESS_TOKEN=test_token
WHATSAPP_VERIFY_TOKEN=test_verify_token

# Dropbox Sign (use test mode)
DROPBOX_SIGN_API_KEY=test_key

# QoreID (use sandbox)
QOREID_CLIENT_ID=sandbox_client_id
QOREID_CLIENT_SECRET=sandbox_client_secret

# Email
RESEND_API_KEY=re_test_...

# Google
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_CALENDAR_ID=your_calendar_id

# App
APP_URL=http://localhost:5173
```

### Starting Local Development

```bash
# Terminal 1: Start Convex dev server
npx convex dev

# Terminal 2: Start frontend dev server
npm run dev

# Or run both concurrently
npm run dev
```

### Local Convex Dashboard

Visit: http://localhost:6791

---

## Production Deployment

### GitHub Actions Secrets

Add these secrets in GitHub Repository → Settings → Secrets and Variables → Actions:

| Secret | Description | Required |
|--------|-------------|----------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages:Edit | ✅ Yes |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | ✅ Yes |
| `CONVEX_DEPLOY_KEY` | Convex deploy key | ✅ Yes |
| `CONVEX_DEPLOYMENT` | Convex deployment name | ✅ Yes |
| `PUBLIC_CONVEX_URL` | Production Convex URL | ✅ Yes |
| `VITE_CONVEX_URL` | Production Convex URL (build-time) | ✅ Yes |

### Deployment Commands

```bash
# Build and deploy to Cloudflare Pages
npm run deploy

# Deploy Convex only
npm run convex:push

# Deploy via GitHub Actions (push to main)
git push origin main

# Manual production deployment
gh workflow run deploy-production.yml
```

### Post-Deployment Verification

1. Check Convex Dashboard: https://dashboard.convex.dev
2. Check Cloudflare Pages: https://dash.cloudflare.com/pages
3. Verify site: https://alikodiamondkey.com
4. Test webhooks in each service dashboard
5. Run E2E tests: `npx playwright test`

---

## Credential Rotation

### When to Rotate

- After initial setup (credentials may have been exposed in logs)
- After any security incident
- Every 90 days as a security best practice
- When team members leave
- Before major releases

### Rotation Process

```bash
# Run the rotation script
bash scripts/rotate-credentials.sh
```

This script will:
1. Prompt for new values for all secrets
2. Update Convex environment variables
3. Update Cloudflare Pages secrets (production & preview)
4. Update GitHub Actions secrets (if `gh` CLI is available)

### Manual Rotation Checklist

After rotating credentials:

- [ ] Revoke old API keys in each service dashboard
- [ ] Update any external integrations using old keys
- [ ] Test all integrations locally
- [ ] Deploy to preview environment
- [ ] Run full E2E test suite
- [ ] Deploy to production
- [ ] Monitor logs for errors
- [ ] Document rotation date in security log

### Service-Specific Rotation

#### Convex
```bash
npx convex env set VARIABLE_NAME "new_value"
# Old values are immediately invalidated
```

#### Cloudflare Pages
```bash
npx wrangler secret put SECRET_NAME --env production
npx wrangler secret put SECRET_NAME --env preview
```

#### GitHub Actions
```bash
gh secret set SECRET_NAME --body "new_value"
# Or manually in GitHub UI
```

#### Paystack
1. Dashboard → Settings → API Keys → Regenerate Secret Key
2. Update webhook URL if domain changed

#### WhatsApp
1. Meta Developer Console → WhatsApp → Configuration → Rotate Access Token
2. Update webhook verify token if changed

#### Dropbox Sign
1. Dashboard → Settings → API → Regenerate API Key
2. Update webhook URL if domain changed

#### Resend
1. Dashboard → API Keys → Create New Key → Delete Old Key
2. Update verified domain if changed

#### Google Cloud
1. Console → APIs & Services → Credentials → Rotate Key
2. Update service account key JSON

---

## Troubleshooting

### Common Issues

**Convex: "Deployment not found"**
- Check `CONVEX_DEPLOYMENT` matches your deployment name
- Run `npx convex list` to see available deployments

**Cloudflare: "KV namespace not found"**
- Run `scripts/setup-cloudflare.sh` to create namespaces
- Update `wrangler.toml` with the new IDs

**Paystack: "Invalid signature"**
- Ensure `PAYSTACK_SECRET_KEY` matches the webhook secret
- Check webhook URL is accessible publicly

**WhatsApp: "Webhook verification failed"**
- Ensure `WHATSAPP_VERIFY_TOKEN` matches Meta console
- Check webhook URL uses HTTPS

**Build fails: "Module not found"**
- Run `npm ci` to reinstall dependencies
- Check Node.js version matches `package.json` engines

### Getting Help

- Check service-specific documentation
- Review GitHub Actions logs for CI/CD issues
- Check Convex logs: `npx convex logs`
- Check Cloudflare Pages logs in dashboard
- Open an issue in the repository

---

## Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use different credentials for each environment** (local, preview, production)
3. **Rotate credentials regularly** (every 90 days)
4. **Use least-privilege API keys** (restrict by domain, IP, permissions)
5. **Monitor API usage** for anomalies
6. **Enable 2FA** on all service accounts
7. **Document all credentials** in a secure password manager
8. **Audit access** quarterly

---

## Appendix: Complete Variable Reference

### Client-Side (Exposed to Browser)
- `PUBLIC_CONVEX_URL`
- `VITE_CONVEX_URL`
- `PUBLIC_GOOGLE_MAPS_API_KEY`

### Server-Side Only (Never Expose to Client)
- `CONVEX_DEPLOY_KEY`
- `CONVEX_DEPLOYMENT`
- `CONVEX_HTTP_ACTIONS_URL`
- `AUTH_SECRET`
- `PAYSTACK_SECRET_KEY`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `DROPBOX_SIGN_API_KEY`
- `QOREID_CLIENT_ID`
- `QOREID_CLIENT_SECRET`
- `RESEND_API_KEY`
- `GOOGLE_SERVICE_ACCOUNT_KEY`
- `GOOGLE_CALENDAR_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_WORKERS_AI_TOKEN`
- `APP_URL`

### Build-Time Only
- `VITE_CONVEX_URL` (used during `npm run build`)

---

*Last updated: 2024-12-19*
*Version: 1.0.0*
