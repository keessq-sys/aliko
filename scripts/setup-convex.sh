#!/usr/bin/env bash
# Convex Setup Script for Aliko Diamond Key
# Run this script to configure Convex for local development and production

set -euo pipefail

echo "🔧 Setting up Convex for Aliko Diamond Key..."

# Check if convex CLI is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js first."
    exit 1
fi

# Check if user is logged in to Convex
echo "📋 Checking Convex authentication..."
if ! npx convex whoami &> /dev/null; then
    echo "🔐 Please log in to Convex:"
    npx convex login
fi

# Create or select deployment
echo "📦 Setting up Convex deployment..."
read -p "Enter deployment name (or press Enter for 'aliko-diamond-key'): " DEPLOYMENT_NAME
DEPLOYMENT_NAME=${DEPLOYMENT_NAME:-aliko-diamond-key}

# Check if deployment exists
if npx convex list | grep -q "$DEPLOYMENT_NAME"; then
    echo "✅ Deployment '$DEPLOYMENT_NAME' already exists"
    npx convex dev --deployment "$DEPLOYMENT_NAME" &
else
    echo "🆕 Creating new deployment '$DEPLOYMENT_NAME'..."
    npx convex dev --deployment "$DEPLOYMENT_NAME" &
fi

# Wait for Convex to start
sleep 5

# Set environment variables
echo "🔐 Setting environment variables..."
echo "Please provide the following secrets (press Enter to skip):"

read -sp "CONVEX_DEPLOY_KEY: " CONVEX_DEPLOY_KEY
echo
if [ -n "$CONVEX_DEPLOY_KEY" ]; then
    npx convex env set CONVEX_DEPLOY_KEY "$CONVEX_DEPLOY_KEY"
fi

read -sp "PAYSTACK_SECRET_KEY: " PAYSTACK_SECRET_KEY
echo
if [ -n "$PAYSTACK_SECRET_KEY" ]; then
    npx convex env set PAYSTACK_SECRET_KEY "$PAYSTACK_SECRET_KEY"
fi

read -sp "WHATSAPP_ACCESS_TOKEN: " WHATSAPP_ACCESS_TOKEN
echo
if [ -n "$WHATSAPP_ACCESS_TOKEN" ]; then
    npx convex env set WHATSAPP_ACCESS_TOKEN "$WHATSAPP_ACCESS_TOKEN"
fi

read -sp "WHATSAPP_PHONE_NUMBER_ID: " WHATSAPP_PHONE_NUMBER_ID
echo
if [ -n "$WHATSAPP_PHONE_NUMBER_ID" ]; then
    npx convex env set WHATSAPP_PHONE_NUMBER_ID "$WHATSAPP_PHONE_NUMBER_ID"
fi

read -sp "WHATSAPP_VERIFY_TOKEN: " WHATSAPP_VERIFY_TOKEN
echo
if [ -n "$WHATSAPP_VERIFY_TOKEN" ]; then
    npx convex env set WHATSAPP_VERIFY_TOKEN "$WHATSAPP_VERIFY_TOKEN"
fi

read -sp "DROPBOX_SIGN_API_KEY: " DROPBOX_SIGN_API_KEY
echo
if [ -n "$DROPBOX_SIGN_API_KEY" ]; then
    npx convex env set DROPBOX_SIGN_API_KEY "$DROPBOX_SIGN_API_KEY"
fi

read -sp "QOREID_CLIENT_ID: " QOREID_CLIENT_ID
echo
if [ -n "$QOREID_CLIENT_ID" ]; then
    npx convex env set QOREID_CLIENT_ID "$QOREID_CLIENT_ID"
fi

read -sp "QOREID_CLIENT_SECRET: " QOREID_CLIENT_SECRET
echo
if [ -n "$QOREID_CLIENT_SECRET" ]; then
    npx convex env set QOREID_CLIENT_SECRET "$QOREID_CLIENT_SECRET"
fi

read -sp "RESEND_API_KEY: " RESEND_API_KEY
echo
if [ -n "$RESEND_API_KEY" ]; then
    npx convex env set RESEND_API_KEY "$RESEND_API_KEY"
fi

read -sp "AUTH_SECRET (openssl rand -base64 33): " AUTH_SECRET
echo
if [ -n "$AUTH_SECRET" ]; then
    npx convex env set AUTH_SECRET "$AUTH_SECRET"
fi

read -sp "GOOGLE_SERVICE_ACCOUNT_KEY (single-line JSON): " GOOGLE_SERVICE_ACCOUNT_KEY
echo
if [ -n "$GOOGLE_SERVICE_ACCOUNT_KEY" ]; then
    npx convex env set GOOGLE_SERVICE_ACCOUNT_KEY "$GOOGLE_SERVICE_ACCOUNT_KEY"
fi

read -p "GOOGLE_CALENDAR_ID: " GOOGLE_CALENDAR_ID
if [ -n "$GOOGLE_CALENDAR_ID" ]; then
    npx convex env set GOOGLE_CALENDAR_ID "$GOOGLE_CALENDAR_ID"
fi

read -p "APP_URL (e.g., https://alikodiamondkey.com): " APP_URL
if [ -n "$APP_URL" ]; then
    npx convex env set APP_URL "$APP_URL"
fi

echo "✅ Convex setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run 'npx convex dev' to start the local Convex dev server"
echo "2. Run 'npm run dev' to start the frontend dev server"
echo "3. Visit http://localhost:5173 to see the app"
echo ""
echo "🔐 For production deployment, set these secrets in GitHub Actions:"
echo "   - CONVEX_DEPLOY_KEY"
echo "   - CONVEX_DEPLOYMENT"
echo "   - All other secrets listed above"
