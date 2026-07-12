import { expect, test } from '@playwright/test';
import {
  CANONICAL_HTML_ROUTES,
  COMPONENT_CATALOG_ROUTE,
  assertNoHorizontalOverflow,
  assertSameOriginLinks,
  openHtmlRoute,
} from './support/routes';

interface CatalogManifest {
  components: Array<{
    name: string;
    description: string;
    status: string;
    docsUrl: string;
    frameworks: Record<'react' | 'svelte' | 'reactNative', string>;
  }>;
}

async function visibleNavigation(page: Parameters<typeof openHtmlRoute>[0]) {
  if ((page.viewportSize()?.width ?? 0) < 960) {
    await page.locator('.mobile-navigation summary').click();
  }
  const navigation = page.locator('[data-side-navigation]:visible');
  await expect(navigation).toHaveCount(1);
  return navigation;
}

for (const route of CANONICAL_HTML_ROUTES) {
  test(`${route.path} renders, fits, and has valid same-origin links`, async ({ page, request }) => {
    await openHtmlRoute(page, route);
    await assertNoHorizontalOverflow(page);
    await assertSameOriginLinks(page, request);
  });
}

test('component catalog renders the exact generated manifest as semantic static cards', async ({ page, request }) => {
  await openHtmlRoute(page, COMPONENT_CATALOG_ROUTE);
  const response = await request.get('/design-system/components.json');
  expect(response.ok()).toBe(true);
  const manifest = await response.json() as CatalogManifest;
  expect(manifest.components).toHaveLength(15);

  const list = page.getByRole('list', { name: '컴포넌트 목록' });
  const cards = list.locator(':scope > li');
  await expect(cards).toHaveCount(15);

  for (const [index, component] of manifest.components.entries()) {
    const card = cards.nth(index);
    await expect(card.getByRole('heading', { level: 2, name: component.name, exact: true })).toBeVisible();
    await expect(card.getByText(component.description, { exact: true })).toBeVisible();
    await expect(card.getByText(component.status, { exact: true })).toBeVisible();
    await expect(card.getByText(`React ${component.frameworks.react}`, { exact: true })).toBeVisible();
    await expect(card.getByText(`Svelte ${component.frameworks.svelte}`, { exact: true })).toBeVisible();
    await expect(card.getByText(`React Native ${component.frameworks.reactNative}`, { exact: true })).toBeVisible();
    await expect(card.getByRole('link', { name: `${component.name} 문서 보기`, exact: true }))
      .toHaveAttribute('href', component.docsUrl);
  }

  await expect(page.locator('script')).toHaveCount(0);
  await assertNoHorizontalOverflow(page);
});

test('catalog and detail routes expose only their exact current sidebar entry', async ({ page }) => {
  await openHtmlRoute(page, COMPONENT_CATALOG_ROUTE);
  let navigation = await visibleNavigation(page);
  await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(navigation.getByRole('link', { name: '전체 보기', exact: true }))
    .toHaveAttribute('aria-current', 'page');

  await openHtmlRoute(page, { path: '/components/button/', heading: 'Button' });
  navigation = await visibleNavigation(page);
  await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(navigation.getByRole('link', { name: 'Button', exact: true }))
    .toHaveAttribute('aria-current', 'page');
  await expect(navigation.getByRole('link', { name: '전체 보기', exact: true }))
    .not.toHaveAttribute('aria-current', 'page');
});

test('homepage exposes the v0.3 preview and links to the catalog', async ({ page }) => {
  await openHtmlRoute(page, { path: '/', heading: '사람과 AI가 함께 읽는 디자인 시스템' });
  await expect(page.getByText('v0.3 · Local preview', { exact: true })).toBeVisible();
  await expect(page).toHaveTitle('AI-Readable Design System v0.3');
  await expect(page.getByRole('link', { name: /Components/ })).toHaveAttribute('href', '/components/');
});
