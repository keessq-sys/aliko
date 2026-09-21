# Aliko Diamond Key

Premium Real Estate & Property Development Platform for Abuja, Nigeria.

## 🏗️ Architecture

- **Frontend**: SvelteKit 2 + TypeScript + TailwindCSS
- **Backend**: Convex (Real-time Database + Functions + Auth)
- **Deployment**: Cloudflare Pages (Edge Network)
- **Payments**: Paystack (Nigeria)
- **Communications**: WhatsApp Business Cloud API
- **E-Signatures**: Dropbox Sign (HelloSign)
- **KYC**: QoreID (Nigeria)
- **Email**: Resend
- **Maps**: Google Maps Platform
- **Storage**: Cloudflare R2 + Convex Storage

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- npm 10+
- Git
- Convex account
- Cloudflare account

### Local Development

```bash
# Clone and install
git clone <repository-url>
cd aliko-diamond-key
npm ci

# Complete setup (Linux/macOS/Git Bash)
bash scripts/setup-all.sh

# Or Windows PowerShell
.\scripts\setup-all.ps1

# Start development servers
npm run dev
```

Visit:
- Frontend: http://localhost:5173
- Convex Dashboard: http://localhost:6791

## 📁 Project Structure

```
├── .github/                 # GitHub Actions, templates, dependabot
├── convex/                  # Convex backend (schema, functions, auth)
│   ├── schema.ts           # Database schema
│   ├── auth.ts             # Authentication config
│   ├── http.ts             # HTTP endpoints (webhooks)
│   └── *.ts                # Business logic modules
├── src/                     # SvelteKit frontend
│   ├── routes/             # File-based routing
│   ├── lib/                # Shared components, stores, utils
│   └── app.html            # HTML template
├── scripts/                 # Setup and utility scripts
├── tests/                   # Playwright E2E tests
├── docs/                    # Documentation
├── static/                  # Static assets
├── wrangler.toml           # Cloudflare Pages config
├── vite.config.ts          # Vite config
├── svelte.config.js        # SvelteKit config
├── tailwind.config.ts      # Tailwind config
└── package.json
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev servers (Convex + Vite) |
| `npm run dev:frontend` | Start Vite only |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run check` | TypeScript + Svelte type checking |
| `npm run lint` | Prettier + ESLint |
| `npm run format` | Auto-format code |
| `npm run convex:push` | Deploy Convex functions |
| `npm run deploy` | Build + deploy to Cloudflare Pages |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run tests with UI |
| `npm run test:e2e:report` | Show test report |

## 🌐 Deployment

### Automatic (GitHub Actions)

Push to `main` or `develop` triggers:
1. Lint & Type Check
2. Build
3. Deploy Convex
4. Deploy Cloudflare Pages (production or preview)

### Manual

```bash
# Production deployment
npm run deploy

# Or via GitHub Actions
gh workflow run deploy-production.yml
```

### Environments

| Environment | URL | Branch |
|-------------|-----|--------|
| Production | https://alikodiamondkey.com | `main` |
| Preview | https://preview-<pr>.alikodiamondkey.pages.dev | PR branches |
| Development | http://localhost:5173 | Local |

## 📚 Documentation

- [Environment Setup](docs/ENVIRONMENT_SETUP.md) - Complete variable reference
- [Deployment Guide](docs/DEPLOYMENT.md) - CI/CD, rollback, troubleshooting
- [Credential Rotation](docs/CREDENTIAL_ROTATION.md) - Security procedures

## 🔐 Security

- All secrets managed via GitHub Actions, Convex Dashboard, Cloudflare Dashboard
- Credential rotation every 90 days (see [Credential Rotation](docs/CREDENTIAL_ROTATION.md))
- Security headers in `src/hooks.server.ts`
- Rate limiting on API endpoints
- Input validation with Zod

## 🧪 Testing

```bash
# Install Playwright browsers
npx playwright install --with-deps chromium

# Run tests
npm run test:e2e

# With UI
npm run test:e2e:ui
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

See [Pull Request Template](.github/PULL_REQUEST_TEMPLATE/pull_request_template.md) for guidelines.

## 📄 License

Private - All rights reserved.

## 🆘 Support

- Check [Documentation](docs/)
- Review [GitHub Actions](https://github.com/your-org/aliko-diamond-key/actions)
- Open an [Issue](https://github.com/your-org/aliko-diamond-key/issues/new/choose)

---

Built with ❤️ for the Nigerian real estate market.