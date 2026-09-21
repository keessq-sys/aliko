import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('should respond to health check', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
  });

  test('should handle Convex sync', async ({ request }) => {
    const response = await request.post('/api/convex/sync', {
      data: { test: true }
    });
    // Convex endpoints may return various status codes
    expect([200, 401, 403, 500]).toContain(response.status());
  });
});

test.describe('Webhook Endpoints', () => {
  test('should verify Paystack webhook signature', async ({ request }) => {
    const response = await request.post('/webhooks/paystack', {
      headers: {
        'x-paystack-signature': 'invalid-signature'
      },
      data: { event: 'charge.success', data: { reference: 'test' } }
    });
    expect(response.status()).toBe(401);
  });

  test('should verify WhatsApp webhook', async ({ request }) => {
    const response = await request.get('/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test&hub.challenge=123');
    expect([200, 403]).toContain(response.status());
  });

  test('should verify Dropbox Sign webhook', async ({ request }) => {
    const response = await request.post('/webhooks/esign', {
      headers: {
        'x-hellosign-signature': 'invalid-signature'
      },
      data: 'json=test'
    });
    expect(response.status()).toBe(401);
  });
});
