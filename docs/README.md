# Aliko Diamond Key - Documentation

## Documentation Index

| Document | Description |
|----------|-------------|
| [Environment Setup](ENVIRONMENT_SETUP.md) | Complete environment variable reference and setup guide |
| [Deployment Guide](DEPLOYMENT.md) | CI/CD pipeline, deployment procedures, and troubleshooting |
| [Credential Rotation](CREDENTIAL_ROTATION.md) | Security policy and procedures for rotating credentials |

## Quick Links

### Getting Started
- [Environment Setup](ENVIRONMENT_SETUP.md#quick-start) - Set up local development
- [Deployment Guide](DEPLOYMENT.md#initial-setup-one-time) - Configure production deployment

### Operations
- [Credential Rotation](CREDENTIAL_ROTATION.md#rotation-procedures) - Rotate compromised or expired credentials
- [Deployment Guide](DEPLOYMENT.md#deployment-workflows) - Deploy to preview/production
- [Deployment Guide](DEPLOYMENT.md#rollback-procedures) - Rollback failed deployments

### Reference
- [Environment Setup](ENVIRONMENT_SETUP.md#appendix-complete-variable-reference) - Complete variable reference
- [Credential Rotation](CREDENTIAL_ROTATION.md#quick-reference-all-rotatable-credentials) - All rotatable credentials list
- [Deployment Guide](DEPLOYMENT.md#quick-reference-commands) - Quick reference commands

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/setup-all.sh` | Complete local environment setup (Linux/macOS/Git Bash) |
| `scripts/setup-all.ps1` | Complete local environment setup (Windows PowerShell) |
| `scripts/setup-convex.sh` | Convex-specific setup |
| `scripts/setup-cloudflare.sh` | Cloudflare Pages-specific setup |
| `scripts/rotate-credentials.sh` | Interactive credential rotation |

## Support

For questions about deployment or configuration:
1. Check the relevant documentation above
2. Review GitHub Actions workflow logs
3. Check Convex and Cloudflare dashboards
4. Open an issue in the repository
