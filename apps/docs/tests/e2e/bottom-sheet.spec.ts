import { expect, test } from '@playwright/test';
import { REQUIRED_COMPONENT_HEADINGS } from '../../scripts/validate-component-template';
import {
  assertNoAxeViolations,
  tabTo,
} from './support/accessibility';
import { assertNoHorizontalOverflow, openHtmlRoute } from './support/routes';

const route = {
  path: '/components/bottom-sheet/',
  heading: 'BottomSheet',
};

async function openSheet(page: import('@playwright/test').Page) {
  const trigger = page.getByRole('button', { name: '바텀시트 열기' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: '배송지 선택' });
  await expect(dialog).toBeVisible();
  return { dialog, trigger };
}

test('BottomSheet renders the complete document template without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await openHtmlRoute(page, route);
  await page.waitForLoadState('networkidle');

  const headings = await page.locator('main h2').allTextContents();
  expect(headings.map((heading) => heading.trim())).toEqual(
    REQUIRED_COMPONENT_HEADINGS,
  );
  await expect(page.locator('[data-component-demo="bottom-sheet"]'))
    .toBeVisible();
  await assertNoHorizontalOverflow(page);
  expect(errors, 'BottomSheet docs must not emit browser console errors')
    .toEqual([]);
});

test('BottomSheet enters focus, traps native modal focus, locks scroll, and restores both on close', async ({ page }) => {
  await openHtmlRoute(page, route);
  const previousOverflow = await page.evaluate(() => {
    document.body.style.overflow = 'clip';
    return document.body.style.overflow;
  });
  const { dialog, trigger } = await openSheet(page);
  const initialFocus = dialog.getByRole('button', { name: '배송지 선택하기' });

  await expect(initialFocus).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press(index === 0 ? 'Shift+Tab' : 'Tab');
    expect(await dialog.evaluate((element) =>
      element.contains(document.activeElement))).toBe(true);
  }

  await dialog.getByRole('button', { name: '바텀시트 닫기' }).click();
  await expect(dialog).not.toBeAttached();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow))
    .toBe(previousOverflow);
  await expect(page.getByText('마지막 종료 사유: close-button')).toBeVisible();
});

test('BottomSheet focus order includes a closed details summary but excludes its hidden controls', async ({ page }) => {
  await openHtmlRoute(page, route);
  const { dialog } = await openSheet(page);
  await dialog.locator('.ds-bottom-sheet__surface').evaluate((surface) => {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    const hiddenButton = document.createElement('button');
    const nestedDetails = document.createElement('details');
    const nestedSummary = document.createElement('summary');
    const nestedButton = document.createElement('button');
    summary.textContent = '닫힌 배송 상세';
    hiddenButton.textContent = '닫힌 상세 행동';
    hiddenButton.type = 'button';
    nestedSummary.textContent = '중첩 배송 상세';
    nestedButton.textContent = '중첩 상세 행동';
    nestedButton.type = 'button';
    nestedDetails.append(nestedSummary, nestedButton);
    details.append(summary, hiddenButton, nestedDetails);
    surface.append(details);
  });
  const summary = dialog.locator('summary', { hasText: '닫힌 배송 상세' });
  const close = dialog.getByRole('button', { name: '바텀시트 닫기' });

  await summary.focus();
  await expect(summary).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();

  await close.click();
  await expect(dialog).not.toBeAttached();
});

test('BottomSheet reports Escape, backdrop, and close-button reasons and honors nondismissible mode', async ({ page }) => {
  await openHtmlRoute(page, route);

  let opened = await openSheet(page);
  await page.keyboard.press('Escape');
  await expect(opened.dialog).not.toBeAttached();
  await expect(page.getByText('마지막 종료 사유: escape')).toBeVisible();

  opened = await openSheet(page);
  const box = await opened.dialog.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + 2, box!.y + 2);
  await page.mouse.down();
  await page.mouse.up();
  await expect(opened.dialog).not.toBeAttached();
  await expect(page.getByText('마지막 종료 사유: backdrop')).toBeVisible();

  await page.getByLabel('Escape·배경으로 닫기').uncheck();
  opened = await openSheet(page);
  await page.keyboard.press('Escape');
  await expect(opened.dialog).toBeVisible();
  const nondismissibleBox = await opened.dialog.boundingBox();
  await page.mouse.click(
    nondismissibleBox!.x + 2,
    nondismissibleBox!.y + 2,
  );
  await expect(opened.dialog).toBeVisible();
  await opened.dialog.getByRole('button', { name: '바텀시트 닫기' }).click();
  await expect(opened.dialog).not.toBeAttached();
  await expect(page.getByText('마지막 종료 사유: close-button')).toBeVisible();
});

test('BottomSheet keeps long content internally scrollable with a visible footer in every viewport', async ({ page }) => {
  await openHtmlRoute(page, route);
  await page.getByRole('checkbox', { name: '긴 본문', exact: true }).check();
  const { dialog } = await openSheet(page);
  const surface = dialog.locator('.ds-bottom-sheet__surface');
  const body = dialog.locator('.ds-bottom-sheet__body');
  const footer = dialog.locator('.ds-bottom-sheet__footer');
  const viewport = page.viewportSize()!;
  const surfaceBox = await surface.boundingBox();

  expect(surfaceBox).not.toBeNull();
  expect(surfaceBox!.width).toBeLessThanOrEqual(Math.min(viewport.width, 640));
  expect(surfaceBox!.height).toBeLessThanOrEqual(viewport.height - 24 + 1);
  expect(await body.evaluate((element) =>
    element.scrollHeight > element.clientHeight)).toBe(true);
  await expect(footer).toBeVisible();
  await assertNoHorizontalOverflow(page);
});

test('BottomSheet uses immediate reduced motion and a legible forced-colors surface', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-chromium',
    'Desktop owns BottomSheet platform-state coverage.',
  );
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await openHtmlRoute(page, route);
  const { dialog } = await openSheet(page);
  const surface = dialog.locator('.ds-bottom-sheet__surface');
  const close = dialog.getByRole('button', { name: '바텀시트 닫기' });

  expect(await surface.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      forcedColorAdjust: style.forcedColorAdjust,
      transitionDuration: style.transitionDuration,
    };
  })).toEqual({
    forcedColorAdjust: 'none',
    transitionDuration: '0s',
  });
  await tabTo(page, close);
  await assertNoAxeViolations(page);

  await close.click();
  await expect(dialog).not.toBeAttached();
});
