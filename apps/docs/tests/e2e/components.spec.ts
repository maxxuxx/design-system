import { expect, test } from '@playwright/test';
import { REQUIRED_COMPONENT_HEADINGS } from '../../scripts/validate-component-template';
import { COMPONENT_HTML_ROUTES, openHtmlRoute } from './support/routes';

for (const route of COMPONENT_HTML_ROUTES) {
  test(`${route.heading} renders its complete document template and demo`, async ({ page }) => {
    await openHtmlRoute(page, route);
    const headings = await page.locator('main h2').allTextContents();
    expect(headings.map((heading) => heading.trim())).toEqual(REQUIRED_COMPONENT_HEADINGS);
    await expect(page.locator(`[data-component-demo="${route.slug}"]`)).toBeVisible();
    await expect(page.getByText('preview', { exact: true }).first()).toBeVisible();
  });

  test(`${route.heading} keeps code and API fields readable on mobile`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile owns compact API documentation.');
    await openHtmlRoute(page, route);

    const codeBlocksFit = await page.locator('main pre').evaluateAll((blocks) =>
      blocks.every((block) => block.scrollWidth <= block.clientWidth));
    expect(codeBlocksFit).toBe(true);

    const api = page.locator('.api-table');
    await expect(api).toBeVisible();
    const cellWidths = await api.locator('tbody td').evaluateAll((cells) =>
      cells.map((cell) => cell.getBoundingClientRect().width));
    expect(cellWidths.length).toBeGreaterThan(0);
    expect(cellWidths.every((width) => width >= 240)).toBe(true);
  });
}

test('docs shell loads without browser console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await openHtmlRoute(page, COMPONENT_HTML_ROUTES[0]!);
  await page.waitForLoadState('networkidle');

  expect(errors).toEqual([]);
});

test('Checkbox visible label toggles its native input', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/checkbox/', heading: 'Checkbox' });
  const checkbox = page.locator('[data-component-demo="checkbox"] .ds-checkbox').first();
  const input = checkbox.locator('.ds-checkbox__input');

  await expect(input).toHaveAttribute('type', 'checkbox');
  await expect(input).not.toBeChecked();
  await checkbox.locator('.ds-checkbox__label').click();
  await expect(input).toBeChecked();
});
