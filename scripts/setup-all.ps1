<#
.SYNOPSIS
    Complete Setup Script for Aliko Diamond Key (PowerShell version for Windows)
.DESCRIPTION
    Run this script to set up the entire development environment on Windows.
#>

param(
    [switch]$SkipConvex,
    [switch]$SkipCloudflare,
    [switch]$SkipBuild
)

Write-Host "🚀 Aliko Diamond Key - Complete Setup (Windows)" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 22+ first." -ForegroundColor Red
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found." -ForegroundColor Red
    exit 1
}

try {
    $gitVersion = git --version
    Write-Host "✅ $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found. Please install Git first." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm ci

# Initialize git if not already
if (-not (Test-Path ".git")) {
    Write-Host ""
    Write-Host "🔧 Initializing Git repository..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit: Aliko Diamond Key real estate platform"
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

# Setup Convex
if (-not $SkipConvex) {
    Write-Host ""
    Write-Host "🔧 Setting up Convex..." -ForegroundColor Yellow
    if (Test-Path "scripts/setup-convex.sh") {
        Write-Host "⚠️  Convex setup script is a bash script. Please run it in Git Bash or WSL:" -ForegroundColor Yellow
        Write-Host "   bash scripts/setup-convex.sh" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  Convex setup script not found. Run manually: npx convex dev" -ForegroundColor Yellow
    }
}

# Setup Cloudflare
if (-not $SkipCloudflare) {
    Write-Host ""
    Write-Host "☁️  Setting up Cloudflare Pages..." -ForegroundColor Yellow
    if (Test-Path "scripts/setup-cloudflare.sh") {
        Write-Host "⚠️  Cloudflare setup script is a bash script. Please run it in Git Bash or WSL:" -ForegroundColor Yellow
        Write-Host "   bash scripts/setup-cloudflare.sh" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  Cloudflare setup script not found. Run manually: npx wrangler login" -ForegroundColor Yellow
    }
}

# Create .env file from example
Write-Host ""
Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
    Copy-Item .env.example .env
    Write-Host "✅ .env file created. Please edit it with your local development values." -ForegroundColor Green
} else {
    Write-Host "⏭️  .env already exists or .env.example not found." -ForegroundColor Yellow
}

# Build the project
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "🏗️  Building project..." -ForegroundColor Yellow
    npm run build
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env with your local development values"
Write-Host "2. Run 'npm run dev' to start development servers"
Write-Host "3. Visit http://localhost:5173 for the frontend"
Write-Host "4. Visit http://localhost:6791 for the Convex dashboard"
Write-Host ""
Write-Host "🚀 For production deployment:" -ForegroundColor Cyan
Write-Host "1. Push to GitHub: git remote add origin <your-repo-url> && git push -u origin main"
Write-Host "2. Add secrets to GitHub Actions (see scripts/setup-cloudflare.sh output)"
Write-Host "3. Trigger deployment via GitHub Actions or run 'npm run deploy'"
Write-Host ""
Write-Host "🔐 For credential rotation (after initial setup or security incident):" -ForegroundColor Cyan
Write-Host "   Run: bash scripts/rotate-credentials.sh (in Git Bash or WSL)"
