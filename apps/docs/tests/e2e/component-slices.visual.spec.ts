import { expect, test } from '@playwright/test';
import { assertNoAxeViolations } from './support/accessibility';
import { expectPageScreenshot } from './support/visual';

const slices = [
  { name: 'Icon', slug: 'icon' },
  { name: 'Badge', slug: 'badge' },
] as const;

for (const slice of slices) {
  test(`${slice.name} component slice`, async ({ page }, testInfo) => {
    test.skip(process.platform !== 'win32', 'Visual baselines are Windows Chromium only.');
    test.skip(testInfo.project.name === 'tablet-chromium', 'Plan 02 owns tablet responsive coverage.');

    await page.goto(`/components/${slice.slug}/`);
    await expect(page.getByRole('heading', { level: 1, name: slice.name })).toBeVisible();
    await expect(page.locator(`[data-component-demo="${slice.slug}"]`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expectPageScreenshot(page, testInfo, slice.slug);
  });
}

test('Badge component slice has no real-browser accessibility violations', async ({ page }) => {
  await page.goto('/components/badge/');
  await assertNoAxeViolations(page);
});

test('Badge demo uses multiple columns on desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop owns the multi-column layout contract.');

  await page.goto('/components/badge/');
  const items = page.locator('[data-component-demo="badge"] .component-demo__item');
  await expect(items).toHaveCount(16);

  const firstRowItemCount = await items.evaluateAll((elements) => {
    const firstTop = elements[0]?.getBoundingClientRect().top;
    return elements.filter((element) => element.getBoundingClientRect().top === firstTop).length;
  });
  expect(firstRowItemCount).toBeGreaterThan(1);
});
