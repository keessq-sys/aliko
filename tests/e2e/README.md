# E2E Tests with Playwright

## Setup

```bash
# Install Playwright and browsers
npm install -D @playwright/test
npx playwright install --with-deps chromium

# Or install all browsers
npx playwright install --with-deps
```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/home.spec.ts

# Run with UI mode
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific project
npx playwright test --project=chromium

# Generate report
npx playwright show-report
```

## Test Structure

```
tests/e2e/
├── home.spec.ts          # Home page tests
├── auth.spec.ts          # Authentication tests
├── properties.spec.ts    # Property listing/detail tests
├── dashboard.spec.ts     # Protected dashboard tests
├── api.spec.ts           # API/Webhook endpoint tests
├── utils/
│   ├── auth-setup.ts     # Admin authentication setup
│   └── test-helpers.ts   # Reusable test utilities
└── README.md             # This file
```

## Authentication for Protected Routes

For tests that require authentication:

1. Set environment variables:
   ```bash
   export ADMIN_EMAIL=admin@alikodiamondkey.com
   export ADMIN_PASSWORD=your-password
   ```

2. Run the auth setup:
   ```bash
   npx playwright test tests/e2e/utils/auth-setup.ts
   ```

3. This creates `tests/.auth/admin.json` with the authenticated session

## CI/CD Integration

Tests run automatically in GitHub Actions on:
- Pull requests
- Pushes to main/develop branches
- Manual workflow dispatch

The workflow:
1. Builds the application
2. Starts preview server
3. Runs Playwright tests
4. Uploads HTML report as artifact

## Writing New Tests

1. Create a new `.spec.ts` file in `tests/e2e/`
2. Use the test helpers from `utils/test-helpers.ts`
3. Follow the existing patterns for consistency
4. Add data-testid attributes to components for reliable selectors

## Best Practices

- Use `data-testid` attributes for element selection
- Keep tests independent and isolated
- Use `beforeEach` for common setup
- Test user journeys, not implementation details
- Handle async operations with proper waits
- Use `expect` assertions with auto-retrying
