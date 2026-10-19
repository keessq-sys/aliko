import { test, expect } from '@playwright/test';

test('landing sections follow the requested service and investment order', async ({page}) => {
  await page.goto('/');
  const order=await page.locator('main.home-content > section').evaluateAll(sections=>sections.map(el=>el.textContent||''));
  const services=order.findIndex(text=>text.includes('Interior Design')&&text.includes('Architectural'));
  const buyers=order.findIndex(text=>text.includes('Looking to Buy or Rent?'));
  const roi=order.findIndex(text=>text.includes('Investment ROI Calculator'));
  const trust=order.findIndex(text=>text.includes('Review every property before you commit.'));
  const faq=order.findIndex(text=>text.includes('Frequently Asked'));
  expect(services).toBeGreaterThanOrEqual(0);
  expect(buyers).toBe(services+1);
  expect(roi).toBeGreaterThanOrEqual(0);
  expect(trust).toBe(roi+1);
  expect(faq).toBe(trust+1);
});

test('footer keeps social contact and newsletter without duplicated navigation', async ({page}) => {
  await page.goto('/');
  const footer=page.locator('footer');
  await expect(footer.getByRole('link',{name:/Aliko Diamond Key on/})).toHaveCount(4);
  await expect(footer.getByRole('link',{name:'alikodiamondkey@gmail.com',exact:true})).toHaveAttribute('href','mailto:alikodiamondkey@gmail.com');
  await expect(footer.getByRole('link',{name:/09033333909/})).toHaveAttribute('href',/wa\.me\/2349033333909/);
  await expect(footer.locator('input[type="email"]')).toHaveCount(1);
  await expect(footer.getByRole('link',{name:/All Listings|Join as Agent|Become a Manager|Residential|Our Agents|Terms|Privacy/})).toHaveCount(0);
});
