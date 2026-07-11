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
}
