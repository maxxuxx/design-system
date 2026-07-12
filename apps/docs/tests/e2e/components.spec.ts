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

test('Dialog documents both public variants and exact close-reason unions', async ({ page }) => {
  await openHtmlRoute(page, {
    path: '/components/dialog/',
    heading: 'Dialog',
  });

  const main = page.locator('main');
  await expect(main).toContainText('AlertDialog');
  await expect(main).toContainText('ConfirmDialog');
  await expect(main).toContainText('AlertDialogCloseReason');
  await expect(main).toContainText('ConfirmDialogCloseReason');
});

test('SearchField documents its state, positioning, and deliberate validation boundary', async ({ page }) => {
  await openHtmlRoute(page, {
    path: '/components/search-field/',
    heading: 'SearchField',
  });

  const main = page.locator('main');
  await expect(main).toContainText('controlled');
  await expect(main).toContainText('uncontrolled');
  await expect(main).toContainText('fixed');
  await expect(main).toContainText('takeSpace');
  await expect(main).toContainText('onValueChange');
  await expect(main).toContainText('onClear');
  await expect(main).toContainText('TextField');
});

test('TextButton renders its complete document template and demo without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await openHtmlRoute(page, {
    path: '/components/text-button/',
    heading: 'TextButton',
  });
  await page.waitForLoadState('networkidle');

  const headings = await page.locator('main h2').allTextContents();
  expect(headings.map((heading) => heading.trim())).toEqual(
    REQUIRED_COMPONENT_HEADINGS,
  );
  await expect(
    page.locator('[data-component-demo="text-button"]'),
  ).toBeVisible();
  await expect(page.getByText('preview', { exact: true }).first()).toBeVisible();
  expect(errors, 'TextButton docs must not emit browser console errors').toEqual([]);
});

test('TextButton demo switches between native navigation and button semantics', async ({ page }) => {
  await openHtmlRoute(page, {
    path: '/components/text-button/',
    heading: 'TextButton',
  });
  const demo = page.locator('[data-component-demo="text-button"]');
  const elementSelect = demo.getByLabel('요소');

  const button = demo.getByRole('button', { name: '계속', exact: true });
  await expect(button).toHaveAttribute('type', 'button');
  await button.click();
  await expect(demo.getByText('활성화 횟수: 1')).toBeVisible();

  await elementSelect.selectOption('anchor');
  const link = demo.getByRole('link', {
    name: '상세 안내로 이동',
    exact: true,
  });
  await expect(link).toHaveAttribute('href', '#text-button-demo-target');
  await expect(link).not.toHaveAttribute('disabled');
  await expect(demo.getByLabel('disabled', { exact: true })).toBeDisabled();
  await link.click();
  await expect(page).toHaveURL(/#text-button-demo-target$/);

  await elementSelect.selectOption('button');
  await demo.getByLabel('disabled', { exact: true }).check();
  await expect(
    demo.getByRole('button', { name: '계속', exact: true }),
  ).toBeDisabled();
});

test('IconButton renders its complete document template and demo without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await openHtmlRoute(page, {
    path: '/components/icon-button/',
    heading: 'IconButton',
  });
  await page.waitForLoadState('networkidle');

  const headings = await page.locator('main h2').allTextContents();
  expect(headings.map((heading) => heading.trim())).toEqual(
    REQUIRED_COMPONENT_HEADINGS,
  );
  await expect(
    page.locator('[data-component-demo="icon-button"]'),
  ).toBeVisible();
  await expect(page.getByText('preview', { exact: true }).first()).toBeVisible();
  expect(errors, 'IconButton docs must not emit browser console errors').toEqual([]);
});

test('IconButton demo preserves owned naming, disabled, and native form behavior', async ({ page }) => {
  await openHtmlRoute(page, {
    path: '/components/icon-button/',
    heading: 'IconButton',
  });
  const demo = page.locator('[data-component-demo="icon-button"]');
  const interactive = demo.locator(
    '[data-icon-button-sample="interactive"]',
  );

  await expect(interactive).toHaveAttribute('type', 'button');
  await expect(interactive).toHaveAttribute('aria-label', '검색 열기');
  await interactive.click();
  await expect(demo.getByText('활성화 횟수: 1')).toBeVisible();
  await expect(demo.getByText('폼 제출 횟수: 0')).toBeVisible();

  await interactive.focus();
  await page.keyboard.press('Enter');
  await expect(demo.getByText('활성화 횟수: 2')).toBeVisible();
  await page.keyboard.press('Space');
  await expect(demo.getByText('활성화 횟수: 3')).toBeVisible();
  await expect(demo.getByText('폼 제출 횟수: 0')).toBeVisible();

  await demo.getByLabel('아이콘').selectOption('close');
  await demo.getByLabel('크기').selectOption('large');
  await demo.getByLabel('변형').selectOption('outline');
  await expect(interactive).toHaveAttribute('data-size', 'large');
  await expect(interactive).toHaveAttribute('data-variant', 'outline');
  await expect(interactive.locator('.ds-icon')).toHaveAttribute('data-size', '24');

  await demo.getByLabel('disabled', { exact: true }).check();
  await expect(interactive).toBeDisabled();
  await demo.locator('[data-icon-button-sample="form-submit"]').click();
  await expect(demo.getByText('폼 제출 횟수: 1')).toBeVisible();
});

test('BoardRow renders its complete document template and demo without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await openHtmlRoute(page, {
    path: '/components/board-row/',
    heading: 'BoardRow',
  });
  await page.waitForLoadState('networkidle');

  const headings = await page.locator('main h2').allTextContents();
  expect(headings.map((heading) => heading.trim())).toEqual(
    REQUIRED_COMPONENT_HEADINGS,
  );
  await expect(page.locator('[data-component-demo="board-row"]')).toBeVisible();
  await expect(page.getByText('preview', { exact: true }).first()).toBeVisible();
  expect(errors, 'BoardRow docs must not emit browser console errors').toEqual([]);
});

test('BoardRow preserves native click, Enter, Space, and controlled reconciliation', async ({ page }) => {
  await openHtmlRoute(page, {
    path: '/components/board-row/',
    heading: 'BoardRow',
  });
  const demo = page.locator('[data-component-demo="board-row"]');
  const uncontrolled = demo.locator('[data-board-row-sample="uncontrolled"]');
  const controlled = demo.locator('[data-board-row-sample="controlled"]');
  const uncontrolledSummary = uncontrolled.locator(':scope > summary');
  const controlledSummary = controlled.locator(':scope > summary');

  await expect(uncontrolled).not.toHaveAttribute('open');
  await uncontrolledSummary.click();
  await expect(uncontrolled).toHaveAttribute('open', '');
  await expect(
    demo.getByText('비제어 상태 변경: 1', { exact: true }),
  ).toBeVisible();

  await controlledSummary.focus();
  await page.keyboard.press('Enter');
  await expect(controlled).toHaveAttribute('open', '');
  await expect(
    demo.getByText('제어 상태 변경: 1', { exact: true }),
  ).toBeVisible();

  await page.keyboard.press('Space');
  await expect(controlled).not.toHaveAttribute('open');
  await expect(
    demo.getByText('제어 상태 변경: 2', { exact: true }),
  ).toBeVisible();

  await demo.getByLabel('제어된 행 열기', { exact: true }).check();
  await expect(controlled).toHaveAttribute('open', '');
  await demo.getByLabel('제어된 행 열기', { exact: true }).uncheck();
  await expect(controlled).not.toHaveAttribute('open');
});

test('Tab renders its complete document template and demo without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await openHtmlRoute(page, {
    path: '/components/tab/',
    heading: 'Tab',
  });
  await page.waitForLoadState('networkidle');

  const headings = await page.locator('main h2').allTextContents();
  expect(headings.map((heading) => heading.trim())).toEqual(
    REQUIRED_COMPONENT_HEADINGS,
  );
  await expect(page.locator('[data-component-demo="tab"]')).toBeVisible();
  await expect(page.getByText('preview', { exact: true }).first()).toBeVisible();
  expect(errors, 'Tab docs must not emit browser console errors').toEqual([]);
});

test('Tab automatically activates with Arrow, Home, End, and pointer input', async ({ page }) => {
  await openHtmlRoute(page, {
    path: '/components/tab/',
    heading: 'Tab',
  });
  const demo = page.locator('[data-component-demo="tab"]');
  const root = demo.locator('[data-tab-sample="interactive"]');
  const overview = root.getByRole('tab', { name: '요약' });
  const history = root.getByRole('tab', { name: '내역' });
  const receipts = root.getByRole('tab', { name: '영수증' });
  const settings = root.getByRole('tab', { name: '설정' });

  await expect(root.getByRole('tablist', { name: '주문 정보' })).toBeVisible();
  await expect(overview).toHaveAttribute('aria-selected', 'true');
  await expect(root.getByRole('tabpanel')).toContainText('요약 패널');
  await overview.focus();
  await page.keyboard.press('ArrowRight');
  await expect(history).toBeFocused();
  await expect(history).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(settings).toBeFocused();
  await expect(settings).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(overview).toBeFocused();
  await page.keyboard.press('End');
  await expect(settings).toBeFocused();
  await expect(receipts).toBeDisabled();
  await receipts.click({ force: true });
  await expect(settings).toHaveAttribute('aria-selected', 'true');

  await history.click();
  await expect(history).toHaveAttribute('aria-selected', 'true');
  await expect(root.getByRole('tabpanel')).toContainText('내역 패널');
  await expect(root.locator('[role="tabpanel"]:not([hidden])')).toHaveCount(1);

  await demo.getByLabel('크기').selectOption('small');
  await demo.getByLabel('레이아웃').selectOption('scroll');
  await expect(root).toHaveAttribute('data-size', 'small');
  await expect(root).toHaveAttribute('data-layout', 'scroll');
});

test('BoardRow does not leak a canceled summary activation into controlled updates', async ({ page }) => {
  await openHtmlRoute(page, {
    path: '/components/board-row/',
    heading: 'BoardRow',
  });
  const demo = page.locator('[data-component-demo="board-row"]');
  const controlled = demo.locator('[data-board-row-sample="controlled"]');
  await controlled.evaluate((element) => {
    element.addEventListener('click', (event) => event.preventDefault(), {
      once: true,
    });
  });

  await controlled.locator(':scope > summary').click();
  await expect(controlled).not.toHaveAttribute('open');
  await expect(
    demo.getByText('제어 상태 변경: 0', { exact: true }),
  ).toBeVisible();

  await demo.getByLabel('제어된 행 열기', { exact: true }).check();
  await expect(controlled).toHaveAttribute('open', '');
  await expect(
    demo.getByText('제어 상태 변경: 0', { exact: true }),
  ).toBeVisible();
});

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
