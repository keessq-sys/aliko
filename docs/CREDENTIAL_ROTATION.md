# Credential Rotation Policy & Procedures

## Overview

This document defines the credential rotation policy for the Aliko Diamond Key platform. Regular credential rotation is a critical security practice that limits the blast radius of compromised credentials.

## Rotation Schedule

| Credential Type | Rotation Frequency | Trigger Events |
|-----------------|-------------------|----------------|
| **API Keys (Production)** | Every 90 days | Security incident, team member departure, suspected compromise |
| **API Keys (Development)** | Every 180 days | Environment reset, suspected compromise |
| **Database Passwords** | Every 90 days | Security incident, DBA departure |
| **Service Account Keys** | Every 90 days | Security incident, project ownership change |
| **Webhook Secrets** | Every 90 days | Security incident, endpoint change |
| **Encryption Keys (AUTH_SECRET)** | Every 180 days | Security incident, key compromise suspected |
| **OAuth Tokens** | Per provider policy | Token expiry, security incident |
| **SSH Keys** | Every 365 days | Key compromise, employee departure |

## Emergency Rotation

**Immediate rotation required when:**
- Credentials accidentally committed to repository
- Credentials shared in chat/email/logs
- Security breach detected
- Third-party service reports compromise
- Employee with access leaves organization

## Rotation Procedures

### 1. Convex Environment Variables

```bash
# List current variables
npx convex env list

# Rotate a single variable
npx convex env set VARIABLE_NAME "new_value"

# Rotate multiple variables
npx convex env set KEY1 "val1" KEY2 "val2" KEY3 "val3"

# Verify rotation
npx convex env get VARIABLE_NAME
```

**Variables to rotate:**
- `CONVEX_DEPLOY_KEY`
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
- `APP_URL`

### 2. Cloudflare Pages Secrets

```bash
# Production environment
npx wrangler secret put SECRET_NAME --env production

# Preview environment
npx wrangler secret put SECRET_NAME --env preview

# List secrets (names only, not values)
npx wrangler secret list --env production
npx wrangler secret list --env preview
```

**Secrets to rotate (both environments):**
- `CONVEX_URL`
- `CONVEX_DEPLOY_KEY`
- `AUTH_SECRET`
- `PAYSTACK_SECRET_KEY`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_VERIFY_TOKEN`
- `DROPBOX_SIGN_API_KEY`
- `QOREID_CLIENT_ID`
- `QOREID_CLIENT_SECRET`
- `GOOGLE_SERVICE_ACCOUNT_KEY`
- `GOOGLE_CALENDAR_ID`

### 3. GitHub Actions Secrets

```bash
# Using GitHub CLI (requires gh auth)
gh secret set SECRET_NAME --body "new_value" --repo owner/repo

# Or manually in GitHub UI:
# Settings → Secrets and Variables → Actions → New repository secret
```

**Secrets to rotate:**
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CONVEX_DEPLOY_KEY`
- `CONVEX_DEPLOYMENT`
- `PUBLIC_CONVEX_URL`
- `VITE_CONVEX_URL`

### 4. Service-Specific Rotation

#### Paystack

1. Log into [Paystack Dashboard](https://dashboard.paystack.com)
2. Go to **Settings → API Keys & Webhooks**
3. Click **Regenerate Secret Key**
4. Update webhook URL if domain changed
5. Test with a small transaction

#### WhatsApp Business API

1. Go to [Meta Developer Console](https://developers.facebook.com)
2. Select your WhatsApp Business App
3. Go to **WhatsApp → Configuration**
4. Click **Rotate** next to **Access Token**
5. Update `WHATSAPP_VERIFY_TOKEN` if desired
6. Verify webhook URL is correct
7. Test sending a message

#### Dropbox Sign (HelloSign)

1. Log into [Dropbox Sign](https://app.hellosign.com)
2. Go to **Settings → API**
3. Click **Regenerate API Key**
4. Update webhook URL if domain changed
5. Test creating a signature request

#### Resend

1. Log into [Resend Dashboard](https://resend.com)
2. Go to **API Keys**
3. Click **Create New Key**
4. Update application with new key
5. Delete old key after verification
6. Verify domain configuration if changed

#### QoreID

1. Log into [QoreID Dashboard](https://qoreid.com)
2. Go to **API Keys**
3. Generate new Client ID/Secret
4. Update webhook URL if domain changed
5. Test KYC verification flow

#### Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services → Credentials**
3. For API Keys: Click **Regenerate Key**
4. For Service Accounts: Create new key → Download JSON → Delete old key
5. Update Calendar API permissions if needed

#### Cloudflare

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **My Profile → API Tokens**
3. Create new token with same permissions
4. Delete old token
5. Update `CLOUDFLARE_API_TOKEN` in GitHub Actions

## Automated Rotation Script

Use the provided rotation script for guided rotation:

```bash
# Run the interactive rotation script
bash scripts/rotate-credentials.sh
```

This script will:
1. Prompt for new values for each credential
2. Update Convex environment variables
3. Update Cloudflare Pages secrets (production & preview)
4. Update GitHub Actions secrets (if `gh` CLI available)
5. Provide post-rotation checklist

## Post-Rotation Verification

After rotating credentials, verify all integrations work:

### Automated Verification

```bash
# Run full test suite
npm run check          # Type checking
npm run lint           # Linting
npm run build          # Build verification
npx playwright test    # E2E tests
```

### Manual Verification Checklist

- [ ] **Local Development**: `npm run dev` works correctly
- [ ] **Convex Dashboard**: Functions execute, data reads/writes work
- [ ] **Authentication**: Login, registration, password reset work
- [ ] **Payments**: Paystack test transaction succeeds
- [ ] **WhatsApp**: Test message sends/receives
- [ ] **E-Signatures**: Dropbox Sign document flow works
- [ ] **KYC**: QoreID verification completes
- [ ] **Emails**: Resend transactional emails deliver
- [ ] **Calendar**: Google Calendar site visit scheduling works
- [ ] **Maps**: Google Maps loads on property pages
- [ ] **File Uploads**: R2 bucket uploads work
- [ ] **Preview Deployment**: Deploy to preview, test all flows
- [ ] **Production Deployment**: Deploy to production, smoke test

## Rollback Procedures

If rotation causes issues:

### Convex Rollback

```bash
# Convex doesn't have direct secret rollback
# Re-set the previous value immediately
npx convex env set VARIABLE_NAME "previous_value"
```

### Cloudflare Rollback

```bash
# Re-set previous secret value
npx wrangler secret put SECRET_NAME --env production <<< "previous_value"
```

### GitHub Actions Rollback

```bash
# Re-set previous secret value
gh secret set SECRET_NAME --body "previous_value"
```

### Service-Level Rollback

For each service, use their dashboard to revert to previous keys if needed.

## Documentation & Audit Trail

### Rotation Log

Maintain a rotation log (in a secure location):

| Date | Credentials Rotated | Reason | Rotated By | Verified By | Notes |
|------|---------------------|--------|------------|-------------|-------|
| 2024-12-19 | All production keys | Initial setup | Dev Team | Security Lead | Post-setup rotation |

### Secure Storage

Store current credentials in:
- **Password Manager**: 1Password, Bitwarden, or similar
- **Secrets Manager**: AWS Secrets Manager, HashiCorp Vault, or similar
- **Access Control**: Limit to DevOps/Security team only

### Access Review

Quarterly access review:
1. List all personnel with credential access
2. Verify each person still needs access
3. Revoke access for departed/changed-role employees
4. Document review completion

## Compliance Considerations

### Data Protection Regulations

- **NDPR (Nigeria)**: Personal data processing requires consent and security measures
- **GDPR (if applicable)**: 72-hour breach notification, data minimization
- **PCI DSS (payments)**: Annual rotation, secure storage, access logging

### Audit Requirements

- Maintain rotation logs for minimum 3 years
- Document emergency rotations with incident references
- Provide rotation evidence for compliance audits
- Test rotation procedures annually

## Emergency Contacts

| Role | Name | Contact | Responsibility |
|------|------|---------|----------------|
| Security Lead | | | Coordinate emergency rotation |
| DevOps Engineer | | | Execute rotation procedures |
| Backend Developer | | | Verify Convex/Backend integrations |
| Frontend Developer | | | Verify Cloudflare/Frontend integrations |
| QA Engineer | | | Run verification tests |

## Quick Reference: All Rotatable Credentials

### Convex (npx convex env set)
```
CONVEX_DEPLOY_KEY
AUTH_SECRET
PAYSTACK_SECRET_KEY
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_VERIFY_TOKEN
DROPBOX_SIGN_API_KEY
QOREID_CLIENT_ID
QOREID_CLIENT_SECRET
RESEND_API_KEY
GOOGLE_SERVICE_ACCOUNT_KEY
GOOGLE_CALENDAR_ID
APP_URL
```

### Cloudflare Production (npx wrangler secret put --env production)
```
CONVEX_URL
CONVEX_DEPLOY_KEY
AUTH_SECRET
PAYSTACK_SECRET_KEY
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_ACCESS_TOKEN
WHATSAPP_VERIFY_TOKEN
DROPBOX_SIGN_API_KEY
QOREID_CLIENT_ID
QOREID_CLIENT_SECRET
GOOGLE_SERVICE_ACCOUNT_KEY
GOOGLE_CALENDAR_ID
```

### Cloudflare Preview (npx wrangler secret put --env preview)
```
CONVEX_URL
CONVEX_DEPLOY_KEY
AUTH_SECRET
PAYSTACK_SECRET_KEY
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_ACCESS_TOKEN
WHATSAPP_VERIFY_TOKEN
DROPBOX_SIGN_API_KEY
QOREID_CLIENT_ID
QOREID_CLIENT_SECRET
GOOGLE_SERVICE_ACCOUNT_KEY
GOOGLE_CALENDAR_ID
```

### GitHub Actions (gh secret set)
```
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
CONVEX_DEPLOY_KEY
CONVEX_DEPLOYMENT
PUBLIC_CONVEX_URL
VITE_CONVEX_URL
```

### Service Dashboards (Manual)
```
Paystack: Secret Key, Webhook URL
WhatsApp: Access Token, Verify Token, Webhook URL
Dropbox Sign: API Key, Webhook URL
QoreID: Client ID, Client Secret, Webhook URL
Resend: API Key, Verified Domain
Google Cloud: API Keys, Service Account Keys
Cloudflare: API Token
```

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024-12-19 | Dev Team | Initial version |

---

*This document should be reviewed and updated quarterly.*
*Store in secure location with restricted access.*
