import { expect, test } from '@playwright/test';

test('publishes the complete HDS brand, metadata, and asset contract', async ({ page, request }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Haru Design System · HDS v0.1.0');
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Haru의 제품 경험을 일관되게 만드는 디자인 시스템',
  })).toBeVisible();
  await expect(page.getByText(
    '토큰, 접근 가능한 React 컴포넌트, Figma 라이브러리와 AI용 메타데이터를 하나의 계약으로 연결합니다.',
    { exact: true },
  )).toBeVisible();
  await expect(page.getByText(
    '118개 토큰 · 20개 React 컴포넌트 · Figma library · AI metadata',
    { exact: true },
  )).toBeVisible();

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://hds.haru-dev.com/',
  );
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    '/apple-touch-icon.png',
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://hds.haru-dev.com/brand/hds-og.png',
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );

  for (const asset of ['/favicon.svg', '/brand/hds-mark.svg', '/apple-touch-icon.png', '/brand/hds-og.png']) {
    const response = await request.get(asset);
    expect(response.status(), asset).toBe(200);
  }
});

test('uses the canonical production origin on a component route', async ({ page }) => {
  await page.goto('/components/button/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://hds.haru-dev.com/components/button/',
  );
});
