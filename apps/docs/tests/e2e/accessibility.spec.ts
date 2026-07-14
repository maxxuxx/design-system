import { expect, test } from '@playwright/test';
import {
  assertNoAxeViolations,
  expectTabSequence,
  expectVisibleFocus,
  tabTo,
} from './support/accessibility';
import { CANONICAL_HTML_ROUTES, openHtmlRoute } from './support/routes';

for (const route of CANONICAL_HTML_ROUTES) {
  test(`${route.path} has zero automatic axe violations`, async ({ page }) => {
    await openHtmlRoute(page, route);
    await assertNoAxeViolations(page);
  });
}

test('header and responsive navigation have logical visible keyboard focus', async ({ page }) => {
  await openHtmlRoute(page, CANONICAL_HTML_ROUTES[0]!);
  const skipLink = page.getByRole('link', { name: '본문으로 건너뛰기' });
  const brand = page.getByRole('link', { name: 'Haru Design System 홈' });
  await expectTabSequence(page, [skipLink, brand]);

  if (page.viewportSize()!.width < 960) {
    const summary = page.getByText('메뉴', { exact: true });
    await page.keyboard.press('Tab');
    await expectVisibleFocus(summary);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('navigation', { name: '모바일 문서 탐색' })).toBeVisible();
    await tabTo(page, page.getByRole('navigation', { name: '모바일 문서 탐색' })
      .getByRole('link', { name: '소개', exact: true }));
  } else {
    await tabTo(page, page.locator('aside').getByRole('link', { name: '소개', exact: true }));
  }
});

test('Button demo is keyboard reachable with visible focus', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/button/', heading: 'Button' });
  await tabTo(page, page.locator('[data-component-demo="button"] button').first());
});

test('TextButton route has zero axe violations and a keyboard-visible focus', async ({ page }) => {
  await openHtmlRoute(page, {
    path: '/components/text-button/',
    heading: 'TextButton',
  });
  await assertNoAxeViolations(page);
  await tabTo(
    page,
    page.locator(
      '[data-component-demo="text-button"] [data-text-button-sample="interactive"] .hds-text-button',
    ),
  );
});

test('IconButton route has zero axe violations and a keyboard-visible focus', async ({ page }) => {
  await openHtmlRoute(page, {
    path: '/components/icon-button/',
    heading: 'IconButton',
  });
  await assertNoAxeViolations(page);
  await tabTo(
    page,
    page.locator(
      '[data-component-demo="icon-button"] [data-icon-button-sample="interactive"]',
    ),
  );
});

test('BoardRow route has zero axe violations and a keyboard-visible native summary', async ({ page }) => {
  await openHtmlRoute(page, {
    path: '/components/board-row/',
    heading: 'BoardRow',
  });
  await assertNoAxeViolations(page);
  await tabTo(
    page,
    page.locator(
      '[data-component-demo="board-row"] [data-board-row-sample="uncontrolled"] > summary',
    ),
  );
});

test('Tab route has zero axe violations and a keyboard-visible active tab', async ({ page }) => {
  await openHtmlRoute(page, {
    path: '/components/tab/',
    heading: 'Tab',
  });
  await assertNoAxeViolations(page);
  await tabTo(
    page,
    page.locator(
      '[data-component-demo="tab"] [data-tab-sample="interactive"] [role="tab"][aria-selected="true"]',
    ),
  );
});

test('Dialog open variants have zero axe violations with owned initial focus', async ({ page }) => {
  await openHtmlRoute(page, {
    path: '/components/dialog/',
    heading: 'Dialog',
  });

  await page.getByRole('button', { name: '알림 열기' }).click();
  const alertDialog = page.getByRole('alertdialog', { name: '저장되었습니다.' });
  const alertAction = alertDialog.getByRole('button', { name: '확인' });
  await expect(alertAction).toBeFocused();
  await expect(alertDialog.locator('.hds-dialog__surface'))
    .toHaveCSS('opacity', '1');
  await assertNoAxeViolations(page);
  await alertDialog.getByRole('button', { name: '확인' }).click();

  await page.getByRole('button', { name: '확인 대화상자 열기' }).click();
  const confirmDialog = page.getByRole('dialog', { name: '삭제할까요?' });
  await expect(confirmDialog.getByRole('button', { name: '취소' })).toBeFocused();
  await expect(confirmDialog.locator('.hds-dialog__surface'))
    .toHaveCSS('opacity', '1');
  await assertNoAxeViolations(page);
  await confirmDialog.getByRole('button', { name: '취소' }).click();
});

test('Toast live feedback has zero axe violations and preserves trigger focus', async ({ page }) => {
  await openHtmlRoute(page, {
    path: '/components/toast/',
    heading: 'Toast',
  });
  const trigger = page.getByRole('button', { name: '실행 취소 알림' });
  await trigger.focus();
  await trigger.click();

  await expect(trigger).toBeFocused();
  await expect(page.getByRole('status')).toContainText('작업을 실행했습니다.');
  await assertNoAxeViolations(page);
  await tabTo(page, page.getByRole('button', { name: '되돌리기' }));
});

test('SearchField clear control is keyboard reachable, restores input focus, and has zero axe violations', async ({ page }) => {
  await openHtmlRoute(page, {
    path: '/components/search-field/',
    heading: 'SearchField',
  });
  const demo = page.locator('[data-component-demo="search-field"]');
  const input = demo.getByRole('searchbox', { name: '상품 검색' });

  await tabTo(page, input);
  await input.fill('토스');
  const clear = demo.getByRole('button', { name: '상품 검색어 지우기' });
  await tabTo(page, clear);
  await expectVisibleFocus(clear);
  await page.keyboard.press('Enter');
  await expect(input).toBeFocused();
  await assertNoAxeViolations(page);
});

test('ListRow action branches are keyboard reachable and the static trailing Switch stays exposed', async ({ page }) => {
  await openHtmlRoute(page, {
    path: '/components/list-row/',
    heading: 'ListRow',
  });
  const demo = page.locator('[data-component-demo="list-row"]');
  const staticSwitch = demo.getByRole('switch', { name: '배송 알림' });
  const button = demo.locator('[data-list-row-sample="button"]');

  await expect(staticSwitch).toBeVisible();
  await tabTo(page, button);
  await expectVisibleFocus(button);
  await assertNoAxeViolations(page);
});

test('BottomCTA Double actions follow secondary-primary keyboard order with zero axe violations', async ({ page }) => {
  await openHtmlRoute(page, {
    path: '/components/bottom-cta/',
    heading: 'BottomCTA',
  });
  const double = page.locator('[data-bottom-cta-sample="double"]');
  const secondary = double.getByRole('button', { name: '취소' });
  const primary = double.getByRole('button', { name: '확인' });

  await tabTo(page, secondary);
  await expectVisibleFocus(secondary);
  await page.keyboard.press('Tab');
  await expect(primary).toBeFocused();
  await expectVisibleFocus(primary);
  await assertNoAxeViolations(page);
});

test('TextField demo input is keyboard reachable with visible focus', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/text-field/', heading: 'TextField' });
  await tabTo(page, page.locator('[data-component-demo="text-field"] .hds-text-field__input').first());
});

test('Checkbox demo keeps native Space activation and visible focus', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/checkbox/', heading: 'Checkbox' });
  const input = page.locator('[data-component-demo="checkbox"] .hds-checkbox__input').first();

  await tabTo(page, input);
  await page.keyboard.press('Space');
  await expect(input).toBeChecked();
});

test('RadioGroup demo keeps native arrow-key selection and visible focus', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/radio-group/', heading: 'RadioGroup' });
  const group = page.locator('[data-component-demo="radio-group"] .hds-radio-group').first();
  const standard = group.getByRole('radio', { name: '일반 배송' });
  const express = group.getByRole('radio', { name: '빠른 배송' });

  await tabTo(page, standard);
  await page.keyboard.press('ArrowDown');
  await expect(express).toBeChecked();
  await expect(express).toBeFocused();
});

test('Switch demo keeps native Space activation and visible focus', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/switch/', heading: 'Switch' });
  const input = page.locator('[data-component-demo="switch"] .hds-switch__input').first();

  await tabTo(page, input);
  await page.keyboard.press('Space');
  await expect(input).toBeChecked();
});

test('Textarea demo is keyboard reachable with visible focus', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/textarea/', heading: 'Textarea' });
  await tabTo(page, page.locator('[data-component-demo="textarea"] .hds-textarea__control').first());
});

test('Select demo is keyboard reachable with visible focus', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/select/', heading: 'Select' });
  const select = page.locator('[data-component-demo="select"] .hds-select__control').first();

  await tabTo(page, select);
});
