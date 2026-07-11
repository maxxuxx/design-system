import { expect, test, type Locator } from '@playwright/test';
import { expectVisibleFocus } from './support/accessibility';
import { openHtmlRoute } from './support/routes';

async function expectMinimumTarget(locator: Locator, minimum = 44): Promise<void> {
  const box = await locator.boundingBox();
  expect(box, 'interactive target must have a rendered box').not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(minimum);
  expect(box!.height).toBeGreaterThanOrEqual(minimum);
}

async function expectForcedColorFocus(locator: Locator): Promise<void> {
  await expectVisibleFocus(locator);
  const outline = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      color: style.outlineColor,
      style: style.outlineStyle,
      width: Number.parseFloat(style.outlineWidth),
    };
  });
  expect(outline.style).toBe('solid');
  expect(outline.width).toBeGreaterThanOrEqual(2);
  expect(outline.color).not.toMatch(/^(?:transparent|rgba\([^)]*,\s*0\))$/);
}

function rgbChannels(value: string): [number, number, number] {
  const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) throw new Error(`Unsupported CSS color: ${value}`);
  return channels as [number, number, number];
}

function luminance(value: string): number {
  return rgbChannels(value)
    .map((channel) => channel / 255)
    .map((channel) => channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index]!, 0);
}

function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((left, right) => right - left);
  return (lighter! + 0.05) / (darker! + 0.05);
}

function resolvedBlurPixels(value: string): number | null {
  const match = value.match(/(?:^|\s)blur\(\s*(\d+(?:\.\d+)?)px\s*\)/);
  return match ? Number(match[1]) : null;
}

type ScrollAreaState = 'no-overflow' | 'start' | 'middle' | 'end';

async function expectScrollAreaState(
  root: Locator,
  viewport: Locator,
  edgeUp: Locator,
  edgeDown: Locator,
  buttonUp: Locator,
  buttonDown: Locator,
  state: ScrollAreaState,
  active: { up: boolean; down: boolean },
): Promise<void> {
  await expect(root).toHaveAttribute('data-state', state);
  await expect(viewport).toHaveAttribute('data-state', state);

  for (const [edge, button, isActive] of [
    [edgeUp, buttonUp, active.up],
    [edgeDown, buttonDown, active.down],
  ] as const) {
    await expect(edge).toHaveAttribute('data-active', String(isActive));
    if (isActive) await expect(button).toBeEnabled();
    else await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('aria-hidden', String(!isActive));
    const cue = await edge.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backdropFilter: style.backdropFilter,
        backgroundImage: style.backgroundImage,
        opacity: style.opacity,
      };
    });
    if (isActive) {
      expect(resolvedBlurPixels(cue.backdropFilter)).toBe(8);
      expect(cue.backgroundImage).not.toBe('none');
      expect(cue.opacity).toBe('1');
    } else {
      expect(cue.backdropFilter).toBe('none');
      expect(cue.backgroundImage).toBe('none');
      expect(cue.opacity).toBe('0');
    }
  }
}

test('ScrollArea keeps native wheel scrolling while its visual scrollbar is hidden', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop owns native scrolling coverage.');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHtmlRoute(page, { path: '/components/scroll-area/', heading: 'ScrollArea' });
  const viewport = page.getByTestId('scroll-area-viewport');
  await expect(viewport).toHaveAttribute('data-state', 'start');

  const scrolling = await viewport.evaluate((element) => {
    const style = getComputedStyle(element);
    const webkitScrollbar = getComputedStyle(element, '::-webkit-scrollbar');
    return {
      overflowY: style.overflowY,
      scrollbarWidth: style.scrollbarWidth,
      webkitDisplay: webkitScrollbar.display,
    };
  });
  expect(scrolling).toEqual({
    overflowY: 'auto',
    scrollbarWidth: 'none',
    webkitDisplay: 'none',
  });

  const initialScrollTop = await viewport.evaluate((element) => element.scrollTop);
  await viewport.hover();
  await page.mouse.wheel(0, 180);
  await expect.poll(
    () => viewport.evaluate((element) => element.scrollTop),
    { message: 'wheel input should move the native viewport' },
  ).toBeGreaterThan(initialScrollTop);
});

test('ScrollArea state, disabled buttons, and blur cues agree in every runtime state', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop owns runtime state coverage.');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHtmlRoute(page, { path: '/components/scroll-area/', heading: 'ScrollArea' });
  const root = page.getByTestId('scroll-area-root');
  const viewport = page.getByTestId('scroll-area-viewport');
  const edgeUp = page.getByTestId('scroll-area-edge-up');
  const edgeDown = page.getByTestId('scroll-area-edge-down');
  const buttonUp = page.getByTestId('scroll-area-button-up');
  const buttonDown = page.getByTestId('scroll-area-button-down');

  await expectScrollAreaState(
    root, viewport, edgeUp, edgeDown, buttonUp, buttonDown,
    'start', { up: false, down: true },
  );

  await viewport.evaluate((element) => {
    element.scrollTop = (element.scrollHeight - element.clientHeight) / 2;
  });
  await expectScrollAreaState(
    root, viewport, edgeUp, edgeDown, buttonUp, buttonDown,
    'middle', { up: true, down: true },
  );

  await viewport.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expectScrollAreaState(
    root, viewport, edgeUp, edgeDown, buttonUp, buttonDown,
    'end', { up: true, down: false },
  );

  await page.getByTestId('scroll-area-content-toggle').check();
  await expectScrollAreaState(
    root, viewport, edgeUp, edgeDown, buttonUp, buttonDown,
    'no-overflow', { up: false, down: false },
  );
  await expect(viewport).toHaveAttribute('tabindex', '-1');
});

test('ScrollArea buttons move 80 percent of the viewport in both directions', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop owns deterministic button scrolling.');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHtmlRoute(page, { path: '/components/scroll-area/', heading: 'ScrollArea' });
  const viewport = page.getByTestId('scroll-area-viewport');
  const buttonUp = page.getByTestId('scroll-area-button-up');
  const buttonDown = page.getByTestId('scroll-area-button-down');
  await expect(buttonDown).toBeEnabled();

  const viewportHeight = await viewport.evaluate((element) => element.clientHeight);
  const expectedStep = viewportHeight * 0.8;
  await buttonDown.click();
  await expect.poll(async () => {
    const scrollTop = await viewport.evaluate((element) => element.scrollTop);
    return Math.abs(scrollTop - expectedStep) <= 1;
  }, { message: 'down button should move exactly 80% of the viewport' }).toBe(true);

  const afterDown = await viewport.evaluate((element) => element.scrollTop);
  await expect(buttonUp).toBeEnabled();
  await buttonUp.click();
  await expect.poll(async () => {
    const scrollTop = await viewport.evaluate((element) => element.scrollTop);
    return Math.abs(scrollTop - (afterDown - expectedStep)) <= 1;
  }, { message: 'up button should move exactly 80% of the viewport' }).toBe(true);
});

test('ScrollArea active navigation buttons are 44px targets with keyboard-visible focus', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop owns ScrollArea focus coverage.');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHtmlRoute(page, { path: '/components/scroll-area/', heading: 'ScrollArea' });
  const viewport = page.getByTestId('scroll-area-viewport');
  const buttonUp = page.getByTestId('scroll-area-button-up');
  const buttonDown = page.getByTestId('scroll-area-button-down');
  await viewport.evaluate((element) => {
    element.scrollTop = (element.scrollHeight - element.clientHeight) / 2;
  });
  await expect(buttonUp).toBeEnabled();
  await expect(buttonDown).toBeEnabled();
  await expectMinimumTarget(buttonUp);
  await expectMinimumTarget(buttonDown);

  const focusStyleSignature = (element: Element) => {
    const style = getComputedStyle(element);
    return {
      boxShadow: style.boxShadow,
      outlineColor: style.outlineColor,
      outlineOffset: style.outlineOffset,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    };
  };
  const unfocusedUp = await buttonUp.evaluate(focusStyleSignature);
  const unfocusedDown = await buttonDown.evaluate(focusStyleSignature);

  await viewport.focus();
  await page.keyboard.press('Tab');
  await expect(buttonUp).toBeFocused();
  expect(await buttonUp.evaluate(focusStyleSignature)).not.toEqual(unfocusedUp);
  await page.keyboard.press('Tab');
  await expect(buttonDown).toBeFocused();
  expect(await buttonDown.evaluate(focusStyleSignature)).not.toEqual(unfocusedDown);
});

test('demo selects and toggle labels expose 44px targets with forced-colors focus', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile owns compact demo-control coverage.');

  await page.emulateMedia({ forcedColors: 'active' });
  await openHtmlRoute(page, { path: '/components/icon/', heading: 'Icon' });
  const demo = page.locator('[data-component-demo="icon"]');
  const selects = demo.locator('.component-demo__control select');
  const toggle = demo.locator('.component-demo__toggle');
  await expect(selects).toHaveCount(2);
  await expect(toggle).toHaveCount(1);

  for (const select of await selects.all()) await expectMinimumTarget(select);
  await expectMinimumTarget(toggle);

  await selects.first().focus();
  await page.keyboard.press('Tab');
  await expectVisibleFocus(selects.nth(1));
  await page.keyboard.press('Tab');
  await expectVisibleFocus(toggle.locator('input'));
});

test('mobile demos use one-column controls and item stacks without shrinking the stage', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile owns the single-column layout contract.');

  await openHtmlRoute(page, { path: '/components/button/', heading: 'Button' });
  const demo = page.locator('[data-component-demo="button"]');
  const controls = demo.locator('.component-demo__controls > *');
  const items = demo.locator('.component-demo__grid > .component-demo__item');
  const stage = demo.locator('.component-demo__stage');
  const stack = demo.locator('.component-demo__stack');

  const layout = await Promise.all([
    controls.nth(0).boundingBox(),
    controls.nth(1).boundingBox(),
    items.nth(0).boundingBox(),
    items.nth(1).boundingBox(),
    stage.boundingBox(),
    stack.evaluate((element) => getComputedStyle(element).display),
    items.nth(0).evaluate((element) => getComputedStyle(element).flexDirection),
  ]);
  const [firstControl, secondControl, firstItem, secondItem, stageBox, stackDisplay, itemDirection] = layout;
  expect(firstControl).not.toBeNull();
  expect(secondControl).not.toBeNull();
  expect(firstItem).not.toBeNull();
  expect(secondItem).not.toBeNull();
  expect(Math.abs(firstControl!.x - secondControl!.x)).toBeLessThanOrEqual(0.5);
  expect(secondControl!.y).toBeGreaterThan(firstControl!.y);
  expect(Math.abs(firstItem!.x - secondItem!.x)).toBeLessThanOrEqual(0.5);
  expect(secondItem!.y).toBeGreaterThan(firstItem!.y);
  expect(stageBox!.height).toBeGreaterThanOrEqual(160);
  expect(stackDisplay).toBe('grid');
  expect(itemDirection).toBe('column');
});

test('Icon demo switches its selected icon between labelled and decorative semantics', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/icon/', heading: 'Icon' });
  const demo = page.locator('[data-component-demo="icon"]');
  const selectedIcon = demo.locator('.component-demo__stage > .ds-icon');
  const toggle = demo.getByRole('checkbox', { name: '단독 아이콘 이름 제공' });

  await expect(selectedIcon).toHaveAttribute('role', 'img');
  await expect(selectedIcon).toHaveAttribute('aria-label', '선택한 search 아이콘');
  await expect(demo.locator('.component-demo__grid .ds-icon[aria-hidden="true"]')).toHaveCount(5);
  await expect(demo.locator('.component-demo__grid .component-demo__label')).toHaveText([
    'check', 'chevron-right', 'close', 'info', 'search',
  ]);

  await toggle.uncheck();
  await expect(selectedIcon).toHaveAttribute('aria-hidden', 'true');
  await expect(selectedIcon).not.toHaveAttribute('role', 'img');
  await expect(selectedIcon).not.toHaveAttribute('aria-label', /.+/);
  await expect(demo.getByRole('img')).toHaveCount(0);
});

test('every rendered Button demo target is at least 44 by 44 pixels', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile owns minimum touch-target coverage.');

  await openHtmlRoute(page, { path: '/components/button/', heading: 'Button' });
  const buttons = page.locator('[data-component-demo="button"] .ds-button');
  expect(await buttons.count()).toBeGreaterThan(0);
  const narrowButton = page.locator(
    '[data-component-demo="button"] .ds-button[data-size="small"][data-width="hug"]',
  ).first();
  await narrowButton.locator('.ds-button__label').evaluate((element) => { element.textContent = 'i'; });
  await expectMinimumTarget(narrowButton);
  for (const button of await buttons.all()) await expectMinimumTarget(button);
});

test('Button exposes a forced-colors keyboard focus outline', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop owns forced-colors component focus.');

  await page.emulateMedia({ forcedColors: 'active' });
  await openHtmlRoute(page, { path: '/components/button/', heading: 'Button' });
  const demo = page.locator('[data-component-demo="button"]');
  const button = demo.getByRole('button', { name: '주문 확인' });
  await demo.getByLabel('trailing icon', { exact: true }).focus();
  await page.keyboard.press('Tab');
  await expectForcedColorFocus(button);
});

test('TextField exposes a forced-colors keyboard focus outline', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop owns forced-colors component focus.');

  await page.emulateMedia({ forcedColors: 'active' });
  await openHtmlRoute(page, { path: '/components/text-field/', heading: 'TextField' });
  const demo = page.locator('[data-component-demo="text-field"]');
  const input = demo.getByLabel('이름');
  await demo.getByLabel('error', { exact: true }).focus();
  await page.keyboard.press('Tab');
  await expectForcedColorFocus(input);
});

test('TextField default boundary has 3:1 contrast against its adjacent surface', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop owns computed-color coverage.');

  await openHtmlRoute(page, { path: '/components/text-field/', heading: 'TextField' });
  const input = page.getByLabel('기본 상태');
  const colors = await input.evaluate((element) => {
    const style = getComputedStyle(element);
    return { border: style.borderTopColor, surface: style.backgroundColor };
  });
  expect(contrastRatio(colors.border, colors.surface)).toBeGreaterThanOrEqual(3);
});

test('TextField error gains a distinct visible style from keyboard focus', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop owns keyboard focus-style coverage.');

  await openHtmlRoute(page, { path: '/components/text-field/', heading: 'TextField' });
  const previousInput = page.getByLabel('기본 상태');
  const errorInput = page.getByLabel('오류 상태');
  const styles = (element: Element) => {
    const style = getComputedStyle(element);
    return `${style.borderTopColor}|${style.boxShadow}|${style.outlineStyle}|${style.outlineWidth}`;
  };
  const before = await errorInput.evaluate(styles);
  await previousInput.focus();
  await page.keyboard.press('Tab');
  await expectVisibleFocus(errorInput);
  expect(await errorInput.evaluate(styles)).not.toBe(before);
});

test('Badge constrains a long unbroken label without page overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile owns constrained-label coverage.');

  await openHtmlRoute(page, { path: '/components/badge/', heading: 'Badge' });
  const badge = page.locator('[data-component-demo="badge"] > .component-demo__stage > .ds-badge');
  await badge.evaluate((element) => {
    element.textContent = '처리상태정보가매우길어도레이아웃경계를벗어나지않습니다'.repeat(4);
  });
  const result = await badge.evaluate((element) => {
    const parent = element.parentElement!;
    const badgeRect = element.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    return {
      badgeFits: badgeRect.left >= parentRect.left && badgeRect.right <= parentRect.right,
      overflowX: getComputedStyle(element).overflowX,
      pageFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    };
  });
  expect(result.badgeFits).toBe(true);
  expect(result.overflowX).not.toBe('visible');
  expect(result.pageFits).toBe(true);
});
