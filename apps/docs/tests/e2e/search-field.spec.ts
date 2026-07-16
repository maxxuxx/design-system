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
  path: '/components/search-field/',
  heading: 'SearchField',
};

test('SearchField clears in order, restores focus, and retains native form value', async ({ page }) => {
  await openHtmlRoute(page, route);
  const demo = page.locator('[data-component-demo="search-field"]');
  const form = demo.locator('[data-search-field-form]');
  const input = form.getByRole('searchbox', { name: '상품 검색' });

  await input.fill('검색할 상품');
  expect(await input.evaluate((control: HTMLInputElement) =>
    new FormData(control.form!).get(control.name))).toBe('검색할 상품');
  await form.getByRole('button', { name: '상품 검색어 지우기' }).click();

  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  await expect(demo.getByText('clear 1회 · value ""')).toBeVisible();
});

test('fixed SearchField reserves its measured height and stays pinned in its contained scroller', async ({ page }) => {
  await openHtmlRoute(page, route);
  const viewport = page.locator('[data-search-field-fixed-viewport]');
  const scroller = page.locator('[data-search-field-fixed-scroll]');
  const bar = viewport.locator('.hds-search-field__bar');
  const spacer = viewport.locator('.hds-search-field__spacer');
  const [before, viewportBox] = await Promise.all([
    bar.boundingBox(),
    viewport.boundingBox(),
  ]);

  expect(before).not.toBeNull();
  expect(viewportBox).not.toBeNull();
  expect(before!.x).toBeGreaterThanOrEqual(viewportBox!.x - 0.5);
  expect(before!.y).toBeGreaterThanOrEqual(viewportBox!.y - 0.5);
  expect(before!.x + before!.width).toBeLessThanOrEqual(
    viewportBox!.x + viewportBox!.width + 0.5,
  );
  expect(before!.y + before!.height).toBeLessThanOrEqual(
    viewportBox!.y + viewportBox!.height + 0.5,
  );
  await expect.poll(async () => {
    const [barBox, spacerBox] = await Promise.all([
      bar.boundingBox(),
      spacer.boundingBox(),
    ]);
    return {
      barHeight: Math.round(barBox?.height ?? -1),
      spacerHeight: Math.round(spacerBox?.height ?? -2),
    };
  }).toEqual({
    barHeight: Math.round(before!.height),
    spacerHeight: Math.round(before!.height),
  });

  await scroller.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  const after = await bar.boundingBox();
  expect(after?.y).toBeCloseTo(before!.y, 0);
  expect(after!.x).toBeGreaterThanOrEqual(viewportBox!.x - 0.5);
  expect(after!.x + after!.width).toBeLessThanOrEqual(
    viewportBox!.x + viewportBox!.width + 0.5,
  );
});

test('SearchField contains a long value at 320px and at 200% text zoom', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openHtmlRoute(page, route);
  const input = page.getByRole('searchbox', { name: '상품 검색' });
  await input.fill('VeryLongUnbrokenLocalizedSearchValue'.repeat(8));
  await assertNoHorizontalOverflow(page);

  await page.addStyleTag({
    content: `
      [data-component-demo="search-field"] .hds-search-field {
        font-size: 200% !important;
      }
      [data-component-demo="search-field"] .hds-search-field__input {
        font-size: inherit !important;
        line-height: 1.5 !important;
      }
    `,
  });

  const metrics = await input.evaluate((control) => {
    const root = control.closest<HTMLElement>('.hds-search-field')!;
    const field = control.closest<HTMLElement>('.hds-search-field__control')!;
    const clear = field.querySelector<HTMLElement>('.hds-search-field__clear')!;
    const fieldBox = field.getBoundingClientRect();
    const clearBox = clear.getBoundingClientRect();
    return {
      clearContained:
        clearBox.left >= fieldBox.left - 0.5
        && clearBox.right <= fieldBox.right + 0.5,
      rootContained: root.scrollWidth <= root.clientWidth + 0.5,
      pageContained:
        document.documentElement.scrollWidth
        <= document.documentElement.clientWidth + 0.5,
    };
  });
  expect(metrics).toEqual({
    clearContained: true,
    rootContained: true,
    pageContained: true,
  });
});

test('SearchField remains perceivable in forced colors with visible focus', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-chromium',
    'Desktop owns SearchField platform-state coverage.',
  );
  await page.emulateMedia({ forcedColors: 'active' });
  await openHtmlRoute(page, route);
  const input = page.getByRole('searchbox', { name: '상품 검색' });
  await input.focus();
  await expectVisibleFocus(input);
  const control = input.locator('xpath=..');

  expect(await control.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderStyle: style.borderStyle,
      color: style.color,
    };
  })).toMatchObject({
    borderStyle: 'solid',
  });
  await page.emulateMedia({ forcedColors: 'none' });
  await assertNoAxeViolations(page);
});
