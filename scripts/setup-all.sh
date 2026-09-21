#!/usr/bin/env bash
# Complete Setup Script for Aliko Diamond Key
# Run this script to set up the entire development environment

set -euo pipefail

echo "🚀 Aliko Diamond Key - Complete Setup"
echo "======================================"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 22+ first."
    exit 1
fi
NODE_VERSION=$(node --version | sed 's/v//')
echo "✅ Node.js $NODE_VERSION"

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found."
    exit 1
fi
echo "✅ npm $(npm --version)"

if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Please install Git first."
    exit 1
fi
echo "✅ Git $(git --version | cut -d' ' -f3)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm ci

# Initialize git if not already
if [ ! -d ".git" ]; then
    echo ""
    echo "🔧 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: Aliko Diamond Key real estate platform"
    echo "✅ Git repository initialized"
fi

# Setup Convex
echo ""
echo "🔧 Setting up Convex..."
if [ -f "scripts/setup-convex.sh" ]; then
    chmod +x scripts/setup-convex.sh
    ./scripts/setup-convex.sh
else
    echo "⚠️  Convex setup script not found. Run manually: npx convex dev"
fi

# Setup Cloudflare
echo ""
echo "☁️  Setting up Cloudflare Pages..."
if [ -f "scripts/setup-cloudflare.sh" ]; then
    chmod +x scripts/setup-cloudflare.sh
    ./scripts/setup-cloudflare.sh
else
    echo "⚠️  Cloudflare setup script not found. Run manually: npx wrangler login"
fi

# Create .env file from example
echo ""
echo "📝 Creating .env file from template..."
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your local development values."
else
    echo "⏭️  .env already exists or .env.example not found."
fi

# Build the project
echo ""
echo "🏗️  Building project..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env with your local development values"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Visit http://localhost:5173 for the frontend"
echo "4. Visit http://localhost:6791 for the Convex dashboard"
echo ""
echo "🚀 For production deployment:"
echo "1. Push to GitHub: git remote add origin <your-repo-url> && git push -u origin main"
echo "2. Add secrets to GitHub Actions (see scripts/setup-cloudflare.sh output)"
echo "3. Trigger deployment via GitHub Actions or run 'npm run deploy'"
echo ""
echo "🔐 For credential rotation (after initial setup or security incident):"
echo "   Run: ./scripts/rotate-credentials.sh"
