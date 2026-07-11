import { expect, test } from '@playwright/test';
import { REQUIRED_COMPONENT_HEADINGS } from '../../scripts/validate-component-template';
import { COMPONENT_HTML_ROUTES, openHtmlRoute } from './support/routes';

for (const route of COMPONENT_HTML_ROUTES) {
  test(`${route.heading} renders its complete document template and demo`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await openHtmlRoute(page, route);
    await page.waitForLoadState('networkidle');
    const headings = await page.locator('main h2').allTextContents();
    expect(headings.map((heading) => heading.trim())).toEqual(REQUIRED_COMPONENT_HEADINGS);
    await expect(page.locator(`[data-component-demo="${route.slug}"]`)).toBeVisible();
    await expect(page.getByText('preview', { exact: true }).first()).toBeVisible();
    expect(errors, `${route.path} must not emit browser console errors`).toEqual([]);
  });

  test(`${route.heading} keeps code and API fields readable on mobile`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile owns compact API documentation.');
    await openHtmlRoute(page, route);

    const codeBlocksFit = await page.locator('main pre').evaluateAll((blocks) =>
      blocks.every((block) => block.scrollWidth <= block.clientWidth));
    expect(codeBlocksFit).toBe(true);

    const api = page.locator('.api-table');
    await expect(api).toBeVisible();
    const cellWidths = await api.locator('tbody td').evaluateAll((cells) =>
      cells.map((cell) => cell.getBoundingClientRect().width));
    expect(cellWidths.length).toBeGreaterThan(0);
    expect(cellWidths.every((width) => width >= 240)).toBe(true);
  });
}

test('Checkbox visible label toggles its native input', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/checkbox/', heading: 'Checkbox' });
  const checkbox = page.locator('[data-component-demo="checkbox"] .ds-checkbox').first();
  const input = checkbox.locator('.ds-checkbox__input');

  await expect(input).toHaveAttribute('type', 'checkbox');
  await expect(input).not.toBeChecked();
  await checkbox.locator('.ds-checkbox__label').click();
  await expect(input).toBeChecked();
});

test('RadioGroup label click updates its native same-name form value', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/radio-group/', heading: 'RadioGroup' });
  const group = page.locator('[data-component-demo="radio-group"] .ds-radio-group').first();
  const express = group.getByRole('radio', { name: '빠른 배송' });

  await expect(group).toHaveAttribute('data-state', 'default');
  await expect(express).toHaveAttribute('name', 'delivery-demo');
  await group.getByText('빠른 배송', { exact: true }).click();
  await expect(express).toBeChecked();
  expect(await express.evaluate((input: HTMLInputElement) =>
    new FormData(input.form!).get(input.name))).toBe('express');
});

test('Switch visible label toggles its stable native switch and form value', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/switch/', heading: 'Switch' });
  const root = page.locator('[data-component-demo="switch"] .ds-switch').first();
  const input = root.getByRole('switch', { name: '자동 저장' });
  const label = root.locator('.ds-switch__label');

  await expect(input).toHaveAttribute('type', 'checkbox');
  await expect(label).toHaveText('자동 저장');
  await label.click();
  await expect(input).toBeChecked();
  await expect(label).toHaveText('자동 저장');
  expect(await input.evaluate((control: HTMLInputElement) =>
    new FormData(control.form!).get(control.name))).toBe('enabled');
});

test('Textarea keeps native typing, rows, maxLength, and form value', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/textarea/', heading: 'Textarea' });
  const textarea = page.locator('[data-component-demo="textarea"] .ds-textarea__control').first();

  await expect(textarea).toHaveAttribute('rows', '4');
  await expect(textarea).toHaveAttribute('maxlength', '80');
  await textarea.fill('배송 전에 연락해 주세요.');
  await expect(textarea).toHaveValue('배송 전에 연락해 주세요.');
  expect(await textarea.evaluate((control: HTMLTextAreaElement) =>
    new FormData(control.form!).get(control.name))).toBe('배송 전에 연락해 주세요.');
});

test('Select keeps native single-value option selection and form value', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/select/', heading: 'Select' });
  const select = page.locator('[data-component-demo="select"] .ds-select__control').first();

  await expect(select).not.toHaveAttribute('multiple');
  await expect(select).not.toHaveAttribute('size');
  await expect(select.getByRole('option', { name: '선택하세요' })).toBeDisabled();
  await select.selectOption('express');
  await expect(select).toHaveValue('express');
  expect(await select.evaluate((control: HTMLSelectElement) =>
    new FormData(control.form!).get(control.name))).toBe('express');
});
