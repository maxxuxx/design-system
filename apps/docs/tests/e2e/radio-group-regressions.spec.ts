import { expect, test } from '@playwright/test';

import { openHtmlRoute } from './support/routes';

test('RadioGroup exposes its fieldset through the visible legend', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/radio-group/', heading: 'RadioGroup' });
  const demo = page.locator('[data-component-demo="radio-group"]');
  const group = demo.getByRole('group', { name: '배송 방법' });

  await expect(group).toBeVisible();
  await expect(group.getByRole('radio')).toHaveCount(3);
});

test('RadioGroup Error border survives hover and active interaction', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop owns computed interaction styles.');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHtmlRoute(page, { path: '/components/radio-group/', heading: 'RadioGroup' });
  const demo = page.locator('[data-component-demo="radio-group"]');
  await demo.getByLabel('error', { exact: true }).check();
  const group = demo.getByRole('group', { name: '배송 방법' });
  const unchecked = group.getByRole('radio', { name: '빠른 배송' });
  const row = unchecked.locator('..');
  const border = (element: Element) => getComputedStyle(element).borderColor;
  const before = await unchecked.evaluate(border);

  await row.hover();
  expect(await unchecked.evaluate(border)).toBe(before);
  await page.mouse.down();
  expect(await unchecked.evaluate(border)).toBe(before);
  await page.mouse.up();
});

test('RadioGroup forced-colors checked palette survives hover', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop owns forced-colors interaction styles.');

  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await openHtmlRoute(page, { path: '/components/radio-group/', heading: 'RadioGroup' });
  const demo = page.locator('[data-component-demo="radio-group"]');
  const group = demo.getByRole('group', { name: '배송 방법' });
  const checked = group.getByRole('radio', { name: '일반 배송' });
  const row = checked.locator('..');
  const colors = (element: Element) => {
    const style = getComputedStyle(element);
    return { background: style.backgroundColor, border: style.borderColor, color: style.color };
  };
  const before = await checked.evaluate(colors);

  await row.hover();
  expect(await checked.evaluate(colors)).toEqual(before);
});
