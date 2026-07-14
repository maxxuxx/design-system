import { expect, test } from '@playwright/test';

import {
  assertNoAxeViolations,
  expectVisibleFocus,
} from './support/accessibility';
import {
  assertNoHorizontalOverflow,
  openHtmlRoute,
} from './support/routes';

const route = {
  path: '/components/bottom-cta/',
  heading: 'BottomCTA',
};

test('BottomCTA derives Single and Double layouts with secondary-primary order', async ({ page }) => {
  await openHtmlRoute(page, route);
  const demo = page.locator('[data-component-demo="bottom-cta"]');
  const single = demo.locator('[data-bottom-cta-sample="single"] .ds-bottom-cta');
  const double = demo.locator('[data-bottom-cta-sample="double"] .ds-bottom-cta');

  await expect(single).toHaveAttribute('data-layout', 'single');
  await expect(single.getByRole('button')).toHaveCount(1);
  await expect(double).toHaveAttribute('data-layout', 'double');
  await expect(double.getByRole('button')).toHaveText(['취소', '확인']);

  for (const button of await demo.locator('.ds-bottom-cta .ds-button').all()) {
    await expect(button).toHaveAttribute('data-size', 'large');
    await expect(button).toHaveAttribute('data-width', 'full');
  }

  await double.getByRole('button', { name: '취소' }).click();
  await expect(demo.getByText('마지막 실행: Double secondary')).toBeVisible();
  await double.getByRole('button', { name: '확인' }).click();
  await expect(demo.getByText('마지막 실행: Double primary')).toBeVisible();

  await double.getByRole('button', { name: '취소' }).focus();
  await page.keyboard.press('Tab');
  await expect(double.getByRole('button', { name: '확인' })).toBeFocused();
});

test('fixed BottomCTA stays contained and its measured spacer matches the panel', async ({ page }) => {
  await openHtmlRoute(page, route);
  const viewport = page.locator('[data-bottom-cta-fixed-viewport]');
  const scroller = page.locator('[data-bottom-cta-fixed-scroll]');
  const root = viewport.locator('.ds-bottom-cta');
  const panel = root.locator('.ds-bottom-cta__panel');
  const spacer = root.locator('.ds-bottom-cta__spacer');
  const [before, viewportBox] = await Promise.all([
    panel.boundingBox(),
    viewport.boundingBox(),
  ]);

  expect(before).not.toBeNull();
  expect(viewportBox).not.toBeNull();
  expect(before!.x).toBeGreaterThanOrEqual(viewportBox!.x - 0.5);
  expect(before!.y).toBeGreaterThanOrEqual(viewportBox!.y - 0.5);
  expect(before!.x + before!.width)
    .toBeLessThanOrEqual(viewportBox!.x + viewportBox!.width + 0.5);
  expect(before!.y + before!.height)
    .toBeLessThanOrEqual(viewportBox!.y + viewportBox!.height + 0.5);
  await expect(root).toHaveAttribute('data-fixed', 'true');
  await expect(root).toHaveAttribute('data-take-space', 'true');
  await expect.poll(async () => {
    const [panelBox, spacerBox] = await Promise.all([
      panel.boundingBox(),
      spacer.boundingBox(),
    ]);
    return {
      panelHeight: Math.round(panelBox?.height ?? -1),
      spacerHeight: Math.round(spacerBox?.height ?? -2),
    };
  }).toEqual({
    panelHeight: Math.round(before!.height),
    spacerHeight: Math.round(before!.height),
  });

  await scroller.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  const after = await panel.boundingBox();
  expect(after?.y).toBeCloseTo(before!.y, 0);

  const overlap = await viewport.evaluate((element) => {
    const items = element.querySelectorAll<HTMLElement>(
      '.bottom-cta-demo__fixed-item',
    );
    const lastItem = items.item(items.length - 1);
    const panelElement = element.querySelector<HTMLElement>(
      '.ds-bottom-cta__panel',
    )!;
    return lastItem.getBoundingClientRect().bottom
      - panelElement.getBoundingClientRect().top;
  });
  expect(overlap, 'the last content item must finish before the fixed panel')
    .toBeLessThanOrEqual(0.5);
});

test('BottomCTA honors the safe-area override and background-none surface', async ({ page }) => {
  await openHtmlRoute(page, route);
  const fixedRoot = page.locator(
    '[data-bottom-cta-fixed-viewport] .ds-bottom-cta',
  );
  await fixedRoot.evaluate((element: HTMLElement) => {
    element.style.setProperty('--ds-safe-area-bottom', '40px');
  });
  await expect(fixedRoot).toHaveAttribute('data-safe-area', 'true');
  await expect.poll(() => fixedRoot.locator('.ds-bottom-cta__panel')
    .evaluate((element) => getComputedStyle(element).paddingBottom))
    .toBe('40px');

  const nonePanel = page.locator(
    '[data-bottom-cta-sample="long-copy"] .ds-bottom-cta__panel',
  );
  expect(await nonePanel.evaluate((element) =>
    getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
});

test('BottomCTA contains long labels at 320px and 200 percent text zoom', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await openHtmlRoute(page, route);
  const specimen = page.locator('[data-bottom-cta-sample="long-copy"]');
  const buttons = specimen.getByRole('button');

  await page.addStyleTag({ content: `
    [data-bottom-cta-sample="long-copy"] .ds-button {
      font-size: 200% !important;
      line-height: 1.5 !important;
    }
  ` });

  const containment = await specimen.evaluate((element) => {
    const root = element.querySelector<HTMLElement>('.ds-bottom-cta')!;
    const rootBox = root.getBoundingClientRect();
    const elementBox = element.getBoundingClientRect();
    const actionBoxes = [...element.querySelectorAll<HTMLElement>('.ds-button')]
      .map((button) => button.getBoundingClientRect());
    return {
      actionsContained: actionBoxes.every((box) =>
        box.left >= rootBox.left - 0.5 && box.right <= rootBox.right + 0.5),
      pageContained:
        document.documentElement.scrollWidth
        <= document.documentElement.clientWidth + 0.5,
      rootContained:
        rootBox.left >= elementBox.left - 0.5
        && rootBox.right <= elementBox.right + 0.5,
      wraps: actionBoxes.every((box) => box.height > 56),
    };
  });
  expect(containment).toEqual({
    actionsContained: true,
    pageContained: true,
    rootContained: true,
    wraps: true,
  });
  await expect(buttons).toHaveCount(2);
  await assertNoHorizontalOverflow(page);
});

test('BottomCTA remains perceivable in forced colors and has zero axe violations', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-chromium',
    'Desktop owns BottomCTA forced-colors coverage.',
  );
  await page.emulateMedia({ forcedColors: 'active' });
  await openHtmlRoute(page, route);
  const button = page.locator(
    '[data-bottom-cta-sample="double"] .ds-button',
  ).first();
  await button.focus();
  await expectVisibleFocus(button);
  expect(await button.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
    };
  })).toMatchObject({ outlineStyle: 'solid' });
  await page.emulateMedia({ forcedColors: 'none' });
  await assertNoAxeViolations(page);
});
