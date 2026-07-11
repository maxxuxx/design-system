import { expect, test } from '@playwright/test';
import { assertNoAxeViolations } from './support/accessibility';
import { expectPageScreenshot } from './support/visual';

const slices = [
  { name: 'Icon', slug: 'icon' },
  { name: 'Badge', slug: 'badge' },
  { name: 'Button', slug: 'button' },
  { name: 'TextField', slug: 'text-field' },
] as const;

for (const slice of slices) {
  test(`${slice.name} component slice`, async ({ page }, testInfo) => {
    test.skip(process.platform !== 'win32', 'Visual baselines are Windows Chromium only.');
    test.skip(testInfo.project.name === 'tablet-chromium', 'Plan 02 owns tablet responsive coverage.');

    await page.goto(`/components/${slice.slug}/`);
    await expect(page.getByRole('heading', { level: 1, name: slice.name })).toBeVisible();
    await expect(page.locator(`[data-component-demo="${slice.slug}"]`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expectPageScreenshot(page, testInfo, slice.slug);
  });
}

test('Badge component slice has no real-browser accessibility violations', async ({ page }) => {
  await page.goto('/components/badge/');
  await assertNoAxeViolations(page);
});

test('Badge demo uses multiple columns on desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop owns the multi-column layout contract.');

  await page.goto('/components/badge/');
  const items = page.locator('[data-component-demo="badge"] .component-demo__item');
  await expect(items).toHaveCount(16);

  const firstRowItemCount = await items.evaluateAll((elements) => {
    const firstTop = elements[0]?.getBoundingClientRect().top;
    return elements.filter((element) => element.getBoundingClientRect().top === firstTop).length;
  });
  expect(firstRowItemCount).toBeGreaterThan(1);
});

test('Button icon slots inherit the Button foreground color', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/components/button/');
  const demo = page.locator('[data-component-demo="button"]');
  const button = demo.getByRole('button', { name: '주문 확인' });
  const icon = button.locator('.ds-icon');
  const label = button.locator('.ds-button__label');
  await expect(icon).toBeVisible();

  const labelColor = await label.evaluate((element) => getComputedStyle(element).color);
  const iconColor = await icon.evaluate((element) => getComputedStyle(element).color);
  expect(iconColor).toBe(labelColor);

  await demo.getByLabel('disabled', { exact: true }).check();
  await expect(button).toBeDisabled();
  const disabledLabelColor = await label.evaluate((element) => getComputedStyle(element).color);
  const disabledIconColor = await icon.evaluate((element) => getComputedStyle(element).color);
  expect(disabledIconColor).toBe(disabledLabelColor);
});

test('Button demo includes a full-width mobile sample', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile owns the full-width sample contract.');

  await page.goto('/components/button/');
  const sample = page.locator('[data-button-sample="full-width"]');
  const button = sample.getByRole('button', { name: 'full width' });
  await expect(button).toBeVisible();
  await expect(button).toHaveAttribute('data-width', 'full');

  const widths = await sample.evaluate((element) => {
    const buttonElement = element.querySelector<HTMLButtonElement>('.ds-button')!;
    const sampleStyle = getComputedStyle(element);
    const sampleContentWidth = element.getBoundingClientRect().width
      - Number.parseFloat(sampleStyle.paddingLeft)
      - Number.parseFloat(sampleStyle.paddingRight);
    return { button: buttonElement.getBoundingClientRect().width, sampleContent: sampleContentWidth };
  });
  expect(Math.abs(widths.button - widths.sampleContent)).toBeLessThanOrEqual(0.5);
});

test('TextField demo shows full-width mobile states at both control heights', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile owns the TextField layout contract.');

  await page.goto('/components/text-field/');
  const demo = page.locator('[data-component-demo="text-field"]');
  const stage = demo.locator('.component-demo__stage');
  const stack = stage.locator('.component-demo__stack');
  const fields = stack.locator('.ds-text-field__input');
  await expect(fields).toHaveCount(4);
  await expect(stack.getByText('기본 도움말')).toBeVisible();
  await expect(stack.getByText('필수 항목입니다.')).toBeVisible();

  const layout = await stage.evaluate((element) => {
    const stackElement = element.querySelector<HTMLElement>('.component-demo__stack')!;
    const inputs = [...stackElement.querySelectorAll<HTMLInputElement>('.ds-text-field__input')];
    const feedback = [...stackElement.querySelectorAll<HTMLElement>(
      '.ds-text-field__description, .ds-text-field__error',
    )];
    const stageStyle = getComputedStyle(element);
    const stageContentWidth = element.getBoundingClientRect().width
      - Number.parseFloat(stageStyle.paddingLeft)
      - Number.parseFloat(stageStyle.paddingRight)
      - Number.parseFloat(stageStyle.borderLeftWidth)
      - Number.parseFloat(stageStyle.borderRightWidth);

    return {
      feedbackFits: feedback.every((item) =>
        item.scrollWidth <= item.clientWidth && item.scrollHeight <= item.clientHeight),
      heights: inputs.map((input) => input.getBoundingClientRect().height),
      inputWidths: inputs.map((input) => input.getBoundingClientRect().width),
      noPageOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      stackWidth: stackElement.getBoundingClientRect().width,
      stageContentWidth,
      states: inputs.map((input) => input.dataset.state),
    };
  });

  expect(Math.abs(layout.stackWidth - layout.stageContentWidth)).toBeLessThanOrEqual(0.5);
  expect(layout.inputWidths.every((width) => Math.abs(width - layout.stackWidth) <= 0.5)).toBe(true);
  expect([...new Set(layout.heights)].sort((left, right) => left - right)).toEqual([48, 56]);
  expect(layout.states).toEqual(['default', 'default', 'error', 'disabled']);
  expect(layout.feedbackFits).toBe(true);
  expect(layout.noPageOverflow).toBe(true);
});
