import { expect, test } from '@playwright/test';
import {
  assertNoAxeViolations,
  expectTabSequence,
  expectVisibleFocus,
  tabTo,
} from './support/accessibility';
import { CANONICAL_HTML_ROUTES, openHtmlRoute } from './support/routes';

for (const route of CANONICAL_HTML_ROUTES) {
  test(`${route.path} has zero automatic axe violations`, async ({ page }) => {
    await openHtmlRoute(page, route);
    await assertNoAxeViolations(page);
  });
}

test('header and responsive navigation have logical visible keyboard focus', async ({ page }) => {
  await openHtmlRoute(page, CANONICAL_HTML_ROUTES[0]!);
  const skipLink = page.getByRole('link', { name: '본문으로 건너뛰기' });
  const brand = page.getByRole('link', { name: 'AI-Readable DS' });
  await expectTabSequence(page, [skipLink, brand]);

  if (page.viewportSize()!.width < 960) {
    const summary = page.getByText('메뉴', { exact: true });
    await page.keyboard.press('Tab');
    await expectVisibleFocus(summary);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('navigation', { name: '모바일 문서 탐색' })).toBeVisible();
    await tabTo(page, page.getByRole('navigation', { name: '모바일 문서 탐색' })
      .getByRole('link', { name: '소개', exact: true }));
  } else {
    await tabTo(page, page.locator('aside').getByRole('link', { name: '소개', exact: true }));
  }
});

test('Button demo is keyboard reachable with visible focus', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/button/', heading: 'Button' });
  await tabTo(page, page.locator('[data-component-demo="button"] button').first());
});

test('TextField demo input is keyboard reachable with visible focus', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/text-field/', heading: 'TextField' });
  await tabTo(page, page.locator('[data-component-demo="text-field"] input').first());
});
