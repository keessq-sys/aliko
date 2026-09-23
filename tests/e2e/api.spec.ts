import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('should respond to health check', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
  });

  test('does not expose a legacy frontend Convex sync endpoint', async ({ request }) => {
    const response = await request.post('/api/convex/sync', {
      data: { test: true }
    });
    expect(response.status()).toBe(404);
  });
});

test.describe('Webhook Endpoints', () => {
  const actionsUrl = process.env.CONVEX_HTTP_ACTIONS_URL || 'https://gallant-husky-352.eu-west-1.convex.site';
  test('should verify Paystack webhook signature', async ({ request }) => {
    const response = await request.post(`${actionsUrl}/webhooks/paystack`, {
      headers: {
        'x-paystack-signature': 'invalid-signature'
      },
      data: { event: 'charge.success', data: { reference: 'test' } }
    });
    expect([401, 503]).toContain(response.status());
  });

  test('should verify WhatsApp webhook', async ({ request }) => {
    const response = await request.get(`${actionsUrl}/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test&hub.challenge=123`);
    expect(response.status()).toBe(403);
  });

  test('should verify Dropbox Sign webhook', async ({ request }) => {
    const response = await request.post(`${actionsUrl}/webhooks/esign`, {
      headers: {
        'x-hellosign-signature': 'invalid-signature'
      },
      data: 'json=test'
    });
    expect([401, 503]).toContain(response.status());
  });
});
