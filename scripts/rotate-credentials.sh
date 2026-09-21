#!/usr/bin/env bash
# Credential Rotation Script for Aliko Diamond Key
# Run this script to rotate all credentials after initial setup or security incident

set -euo pipefail

echo "🔄 Credential Rotation for Aliko Diamond Key"
echo "============================================="
echo ""
echo "⚠️  WARNING: This script will help you rotate ALL credentials."
echo "   Make sure you have new credentials ready before proceeding."
echo ""
read -p "Continue with credential rotation? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "❌ Rotation cancelled."
    exit 1
fi

# Function to rotate a secret in Convex
rotate_convex_secret() {
    local name=$1
    local prompt=$2
    read -sp "$prompt: " value
    echo
    if [ -n "$value" ]; then
        echo "🔄 Rotating $name in Convex..."
        npx convex env set "$name" "$value"
        echo "✅ $name rotated in Convex"
    else
        echo "⏭️  Skipping $name (no new value provided)"
    fi
}

# Function to rotate a secret in Cloudflare (production)
rotate_cf_secret_prod() {
    local name=$1
    local prompt=$2
    read -sp "$prompt: " value
    echo
    if [ -n "$value" ]; then
        echo "🔄 Rotating $name in Cloudflare (production)..."
        npx wrangler secret put "$name" --env production <<< "$value"
        echo "✅ $name rotated in Cloudflare (production)"
    else
        echo "⏭️  Skipping $name (no new value provided)"
    fi
}

# Function to rotate a secret in Cloudflare (preview)
rotate_cf_secret_preview() {
    local name=$1
    local prompt=$2
    read -sp "$prompt: " value
    echo
    if [ -n "$value" ]; then
        echo "🔄 Rotating $name in Cloudflare (preview)..."
        npx wrangler secret put "$name" --env preview <<< "$value"
        echo "✅ $name rotated in Cloudflare (preview)"
    else
        echo "⏭️  Skipping $name (no new value provided)"
    fi
}

# Function to rotate a secret in GitHub Actions
rotate_github_secret() {
    local name=$1
    local prompt=$2
    read -sp "$prompt: " value
    echo
    if [ -n "$value" ]; then
        echo "🔄 Rotating $name in GitHub Actions..."
        gh secret set "$name" --body "$value"
        echo "✅ $name rotated in GitHub Actions"
    else
        echo "⏭️  Skipping $name (no new value provided)"
    fi
}

echo ""
echo "📦 Rotating Convex secrets..."
echo "------------------------------"
rotate_convex_secret "CONVEX_DEPLOY_KEY" "New CONVEX_DEPLOY_KEY"
rotate_convex_secret "PAYSTACK_SECRET_KEY" "New PAYSTACK_SECRET_KEY"
rotate_convex_secret "WHATSAPP_ACCESS_TOKEN" "New WHATSAPP_ACCESS_TOKEN"
rotate_convex_secret "WHATSAPP_PHONE_NUMBER_ID" "New WHATSAPP_PHONE_NUMBER_ID"
rotate_convex_secret "WHATSAPP_VERIFY_TOKEN" "New WHATSAPP_VERIFY_TOKEN"
rotate_convex_secret "DROPBOX_SIGN_API_KEY" "New DROPBOX_SIGN_API_KEY"
rotate_convex_secret "QOREID_CLIENT_ID" "New QOREID_CLIENT_ID"
rotate_convex_secret "QOREID_CLIENT_SECRET" "New QOREID_CLIENT_SECRET"
rotate_convex_secret "RESEND_API_KEY" "New RESEND_API_KEY"
rotate_convex_secret "AUTH_SECRET" "New AUTH_SECRET (openssl rand -base64 33)"
rotate_convex_secret "GOOGLE_SERVICE_ACCOUNT_KEY" "New GOOGLE_SERVICE_ACCOUNT_KEY (single-line JSON)"
rotate_convex_secret "GOOGLE_CALENDAR_ID" "New GOOGLE_CALENDAR_ID"
rotate_convex_secret "APP_URL" "New APP_URL"

echo ""
echo "☁️  Rotating Cloudflare (production) secrets..."
echo "-----------------------------------------------"
rotate_cf_secret_prod "CONVEX_URL" "New CONVEX_URL"
rotate_cf_secret_prod "CONVEX_DEPLOY_KEY" "New CONVEX_DEPLOY_KEY"
rotate_cf_secret_prod "AUTH_SECRET" "New AUTH_SECRET"
rotate_cf_secret_prod "PAYSTACK_SECRET_KEY" "New PAYSTACK_SECRET_KEY"
rotate_cf_secret_prod "WHATSAPP_PHONE_NUMBER_ID" "New WHATSAPP_PHONE_NUMBER_ID"
rotate_cf_secret_prod "WHATSAPP_ACCESS_TOKEN" "New WHATSAPP_ACCESS_TOKEN"
rotate_cf_secret_prod "WHATSAPP_VERIFY_TOKEN" "New WHATSAPP_VERIFY_TOKEN"
rotate_cf_secret_prod "DROPBOX_SIGN_API_KEY" "New DROPBOX_SIGN_API_KEY"
rotate_cf_secret_prod "QOREID_CLIENT_ID" "New QOREID_CLIENT_ID"
rotate_cf_secret_prod "QOREID_CLIENT_SECRET" "New QOREID_CLIENT_SECRET"
rotate_cf_secret_prod "GOOGLE_SERVICE_ACCOUNT_KEY" "New GOOGLE_SERVICE_ACCOUNT_KEY"
rotate_cf_secret_prod "GOOGLE_CALENDAR_ID" "New GOOGLE_CALENDAR_ID"

echo ""
echo "☁️  Rotating Cloudflare (preview) secrets..."
echo "--------------------------------------------"
rotate_cf_secret_preview "CONVEX_URL" "New CONVEX_URL"
rotate_cf_secret_preview "CONVEX_DEPLOY_KEY" "New CONVEX_DEPLOY_KEY"
rotate_cf_secret_preview "AUTH_SECRET" "New AUTH_SECRET"
rotate_cf_secret_preview "PAYSTACK_SECRET_KEY" "New PAYSTACK_SECRET_KEY"
rotate_cf_secret_preview "WHATSAPP_PHONE_NUMBER_ID" "New WHATSAPP_PHONE_NUMBER_ID"
rotate_cf_secret_preview "WHATSAPP_ACCESS_TOKEN" "New WHATSAPP_ACCESS_TOKEN"
rotate_cf_secret_preview "WHATSAPP_VERIFY_TOKEN" "New WHATSAPP_VERIFY_TOKEN"
rotate_cf_secret_preview "DROPBOX_SIGN_API_KEY" "New DROPBOX_SIGN_API_KEY"
rotate_cf_secret_preview "QOREID_CLIENT_ID" "New QOREID_CLIENT_ID"
rotate_cf_secret_preview "QOREID_CLIENT_SECRET" "New QOREID_CLIENT_SECRET"
rotate_cf_secret_preview "GOOGLE_SERVICE_ACCOUNT_KEY" "New GOOGLE_SERVICE_ACCOUNT_KEY"
rotate_cf_secret_preview "GOOGLE_CALENDAR_ID" "New GOOGLE_CALENDAR_ID"

echo ""
echo "🐙 Rotating GitHub Actions secrets..."
echo "-------------------------------------"
# Check if gh CLI is available
if command -v gh &> /dev/null; then
    rotate_github_secret "CLOUDFLARE_API_TOKEN" "New CLOUDFLARE_API_TOKEN"
    rotate_github_secret "CLOUDFLARE_ACCOUNT_ID" "New CLOUDFLARE_ACCOUNT_ID"
    rotate_github_secret "CONVEX_DEPLOY_KEY" "New CONVEX_DEPLOY_KEY"
    rotate_github_secret "CONVEX_DEPLOYMENT" "New CONVEX_DEPLOYMENT"
    rotate_github_secret "PUBLIC_CONVEX_URL" "New PUBLIC_CONVEX_URL"
    rotate_github_secret "VITE_CONVEX_URL" "New VITE_CONVEX_URL"
else
    echo "⚠️  GitHub CLI (gh) not found. Please manually update these secrets in GitHub:"
    echo "   - CLOUDFLARE_API_TOKEN"
    echo "   - CLOUDFLARE_ACCOUNT_ID"
    echo "   - CONVEX_DEPLOY_KEY"
    echo "   - CONVEX_DEPLOYMENT"
    echo "   - PUBLIC_CONVEX_URL"
    echo "   - VITE_CONVEX_URL"
fi

echo ""
echo "✅ Credential rotation complete!"
echo ""
echo "📋 Post-rotation checklist:"
echo "1. Test local development: npm run dev"
echo "2. Test Convex deployment: npx convex deploy"
echo "3. Test Cloudflare deployment: npm run deploy"
echo "4. Trigger GitHub Actions workflow to verify CI/CD"
echo "5. Verify all integrations work (Paystack, WhatsApp, Dropbox Sign, etc.)"
echo ""
echo "🔐 Remember to:"
echo "   - Revoke old API keys/tokens in their respective dashboards"
echo "   - Update any external services that use these credentials"
echo "   - Document the rotation date in your security log"
