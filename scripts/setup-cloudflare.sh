#!/usr/bin/env bash
# Cloudflare Pages Setup Script for Aliko Diamond Key
# Run this script to configure Cloudflare Pages for deployment

set -euo pipefail

echo "☁️  Setting up Cloudflare Pages for Aliko Diamond Key..."

# Check if wrangler is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js first."
    exit 1
fi

# Check if user is logged in to Cloudflare
echo "📋 Checking Cloudflare authentication..."
if ! npx wrangler whoami &> /dev/null; then
    echo "🔐 Please log in to Cloudflare:"
    npx wrangler login
fi

# Get account ID
echo "📋 Getting Cloudflare account ID..."
ACCOUNT_ID=$(npx wrangler whoami --json | jq -r '.account_id')
echo "✅ Account ID: $ACCOUNT_ID"

# Create KV namespaces
echo "🗄️  Creating KV namespaces..."

echo "Creating SESSIONS KV namespace..."
SESSIONS_KV=$(npx wrangler kv namespace create SESSIONS --json)
SESSIONS_KV_ID=$(echo "$SESSIONS_KV" | jq -r '.id')
SESSIONS_KV_PREVIEW_ID=$(echo "$SESSIONS_KV" | jq -r '.preview_id')
echo "✅ SESSIONS KV created: $SESSIONS_KV_ID (preview: $SESSIONS_KV_PREVIEW_ID)"

# Create R2 buckets
echo "🪣 Creating R2 buckets..."

echo "Creating aliko-documents bucket..."
npx wrangler r2 bucket create aliko-documents
echo "✅ aliko-documents bucket created"

echo "Creating aliko-property-images bucket..."
npx wrangler r2 bucket create aliko-property-images
echo "✅ aliko-property-images bucket created"

# Update wrangler.toml with actual IDs
echo "📝 Updating wrangler.toml with actual IDs..."
sed -i "s/YOUR_KV_NAMESPACE_ID/$SESSIONS_KV_ID/g" wrangler.toml
sed -i "s/YOUR_PREVIEW_KV_ID/$SESSIONS_KV_PREVIEW_ID/g" wrangler.toml

echo "✅ wrangler.toml updated with KV namespace IDs"

# Set secrets for production
echo "🔐 Setting production secrets..."
echo "Please provide the following secrets (press Enter to skip):"

read -sp "CONVEX_URL: " CONVEX_URL
echo
if [ -n "$CONVEX_URL" ]; then
    npx wrangler secret put CONVEX_URL --env production <<< "$CONVEX_URL"
fi

read -sp "CONVEX_DEPLOY_KEY: " CONVEX_DEPLOY_KEY
echo
if [ -n "$CONVEX_DEPLOY_KEY" ]; then
    npx wrangler secret put CONVEX_DEPLOY_KEY --env production <<< "$CONVEX_DEPLOY_KEY"
fi

read -sp "AUTH_SECRET (openssl rand -base64 33): " AUTH_SECRET
echo
if [ -n "$AUTH_SECRET" ]; then
    npx wrangler secret put AUTH_SECRET --env production <<< "$AUTH_SECRET"
fi

read -sp "PAYSTACK_SECRET_KEY: " PAYSTACK_SECRET_KEY
echo
if [ -n "$PAYSTACK_SECRET_KEY" ]; then
    npx wrangler secret put PAYSTACK_SECRET_KEY --env production <<< "$PAYSTACK_SECRET_KEY"
fi

read -sp "WHATSAPP_PHONE_NUMBER_ID: " WHATSAPP_PHONE_NUMBER_ID
echo
if [ -n "$WHATSAPP_PHONE_NUMBER_ID" ]; then
    npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID --env production <<< "$WHATSAPP_PHONE_NUMBER_ID"
fi

read -sp "WHATSAPP_ACCESS_TOKEN: " WHATSAPP_ACCESS_TOKEN
echo
if [ -n "$WHATSAPP_ACCESS_TOKEN" ]; then
    npx wrangler secret put WHATSAPP_ACCESS_TOKEN --env production <<< "$WHATSAPP_ACCESS_TOKEN"
fi

read -sp "WHATSAPP_VERIFY_TOKEN: " WHATSAPP_VERIFY_TOKEN
echo
if [ -n "$WHATSAPP_VERIFY_TOKEN" ]; then
    npx wrangler secret put WHATSAPP_VERIFY_TOKEN --env production <<< "$WHATSAPP_VERIFY_TOKEN"
fi

read -sp "DROPBOX_SIGN_API_KEY: " DROPBOX_SIGN_API_KEY
echo
if [ -n "$DROPBOX_SIGN_API_KEY" ]; then
    npx wrangler secret put DROPBOX_SIGN_API_KEY --env production <<< "$DROPBOX_SIGN_API_KEY"
fi

read -sp "QOREID_CLIENT_ID: " QOREID_CLIENT_ID
echo
if [ -n "$QOREID_CLIENT_ID" ]; then
    npx wrangler secret put QOREID_CLIENT_ID --env production <<< "$QOREID_CLIENT_ID"
fi

read -sp "QOREID_CLIENT_SECRET: " QOREID_CLIENT_SECRET
echo
if [ -n "$QOREID_CLIENT_SECRET" ]; then
    npx wrangler secret put QOREID_CLIENT_SECRET --env production <<< "$QOREID_CLIENT_SECRET"
fi

read -sp "GOOGLE_SERVICE_ACCOUNT_KEY (single-line JSON): " GOOGLE_SERVICE_ACCOUNT_KEY
echo
if [ -n "$GOOGLE_SERVICE_ACCOUNT_KEY" ]; then
    npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY --env production <<< "$GOOGLE_SERVICE_ACCOUNT_KEY"
fi

read -p "GOOGLE_CALENDAR_ID: " GOOGLE_CALENDAR_ID
if [ -n "$GOOGLE_CALENDAR_ID" ]; then
    npx wrangler secret put GOOGLE_CALENDAR_ID --env production <<< "$GOOGLE_CALENDAR_ID"
fi

# Set secrets for preview environment
echo "🔐 Setting preview secrets..."
read -p "Use same secrets for preview environment? (y/n): " USE_SAME
if [ "$USE_SAME" = "y" ] || [ "$USE_SAME" = "Y" ]; then
    if [ -n "$CONVEX_URL" ]; then
        npx wrangler secret put CONVEX_URL --env preview <<< "$CONVEX_URL"
    fi
    if [ -n "$CONVEX_DEPLOY_KEY" ]; then
        npx wrangler secret put CONVEX_DEPLOY_KEY --env preview <<< "$CONVEX_DEPLOY_KEY"
    fi
    if [ -n "$AUTH_SECRET" ]; then
        npx wrangler secret put AUTH_SECRET --env preview <<< "$AUTH_SECRET"
    fi
    if [ -n "$PAYSTACK_SECRET_KEY" ]; then
        npx wrangler secret put PAYSTACK_SECRET_KEY --env preview <<< "$PAYSTACK_SECRET_KEY"
    fi
    if [ -n "$WHATSAPP_PHONE_NUMBER_ID" ]; then
        npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID --env preview <<< "$WHATSAPP_PHONE_NUMBER_ID"
    fi
    if [ -n "$WHATSAPP_ACCESS_TOKEN" ]; then
        npx wrangler secret put WHATSAPP_ACCESS_TOKEN --env preview <<< "$WHATSAPP_ACCESS_TOKEN"
    fi
    if [ -n "$WHATSAPP_VERIFY_TOKEN" ]; then
        npx wrangler secret put WHATSAPP_VERIFY_TOKEN --env preview <<< "$WHATSAPP_VERIFY_TOKEN"
    fi
    if [ -n "$DROPBOX_SIGN_API_KEY" ]; then
        npx wrangler secret put DROPBOX_SIGN_API_KEY --env preview <<< "$DROPBOX_SIGN_API_KEY"
    fi
    if [ -n "$QOREID_CLIENT_ID" ]; then
        npx wrangler secret put QOREID_CLIENT_ID --env preview <<< "$QOREID_CLIENT_ID"
    fi
    if [ -n "$QOREID_CLIENT_SECRET" ]; then
        npx wrangler secret put QOREID_CLIENT_SECRET --env preview <<< "$QOREID_CLIENT_SECRET"
    fi
    if [ -n "$GOOGLE_SERVICE_ACCOUNT_KEY" ]; then
        npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY --env preview <<< "$GOOGLE_SERVICE_ACCOUNT_KEY"
    fi
    if [ -n "$GOOGLE_CALENDAR_ID" ]; then
        npx wrangler secret put GOOGLE_CALENDAR_ID --env preview <<< "$GOOGLE_CALENDAR_ID"
    fi
    echo "✅ Preview secrets set"
fi

echo "✅ Cloudflare Pages setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run 'npm run build' to build the application"
echo "2. Run 'npm run deploy' to deploy to Cloudflare Pages"
echo "3. Or push to GitHub to trigger automatic deployment via GitHub Actions"
echo ""
echo "🔐 For GitHub Actions, add these secrets to your repository:"
echo "   - CLOUDFLARE_API_TOKEN (from Cloudflare dashboard > My Profile > API Tokens)"
echo "   - CLOUDFLARE_ACCOUNT_ID: $ACCOUNT_ID"
echo "   - All other secrets listed above"
