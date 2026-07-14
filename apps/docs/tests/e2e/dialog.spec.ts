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
  path: '/components/dialog/',
  heading: 'Dialog',
};

test('AlertDialog reports its owned action and restores focus', async ({ page }) => {
  await openHtmlRoute(page, route);
  const trigger = page.getByRole('button', { name: '알림 열기' });
  await trigger.click();
  const dialog = page.getByRole('alertdialog', { name: '저장되었습니다.' });
  const alertAction = dialog.getByRole('button', { name: '확인' });

  await expect(dialog).toBeVisible();
  await expect(alertAction).toBeFocused();
  await expect(dialog.getByRole('button')).toHaveCount(1);
  await alertAction.click();

  await expect(dialog).not.toBeAttached();
  await expect(trigger).toBeFocused();
  await expect(page.getByText('알림 종료 사유: alert-button')).toBeVisible();
});

test('ConfirmDialog reports cancel and confirm in exact order and restores focus', async ({ page }) => {
  await openHtmlRoute(page, route);
  const trigger = page.getByRole('button', { name: '확인 대화상자 열기' });

  await trigger.click();
  let dialog = page.getByRole('dialog', { name: '삭제할까요?' });
  await expect(dialog).toBeVisible();
  const actions = dialog.getByRole('button');
  await expect(actions).toHaveCount(2);
  await expect(actions.nth(0)).toHaveText('취소');
  await expect(actions.nth(1)).toHaveText('삭제');
  await expect(actions.nth(0)).toBeFocused();

  await actions.nth(0).click();
  await expect(dialog).not.toBeAttached();
  await expect(trigger).toBeFocused();
  await expect(page.getByText('확인 종료 사유: cancel-button')).toBeVisible();

  await trigger.click();
  dialog = page.getByRole('dialog', { name: '삭제할까요?' });
  await dialog.getByRole('button', { name: '삭제' }).click();
  await expect(dialog).not.toBeAttached();
  await expect(trigger).toBeFocused();
  await expect(page.getByText('확인 종료 사유: confirm-button')).toBeVisible();
});

test('Dialog reports Escape and backdrop and honors nondismissible mode', async ({ page }) => {
  await openHtmlRoute(page, route);
  const trigger = page.getByRole('button', { name: '확인 대화상자 열기' });

  await trigger.click();
  let dialog = page.getByRole('dialog', { name: '삭제할까요?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: '취소' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeAttached();
  await expect(page.getByText('확인 종료 사유: escape')).toBeVisible();

  await trigger.click();
  dialog = page.getByRole('dialog', { name: '삭제할까요?' });
  await expect(dialog).toBeVisible();
  const dialogBox = await dialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  await page.mouse.click(dialogBox!.x + 2, dialogBox!.y + 2);
  await expect(dialog).not.toBeAttached();
  await expect(page.getByText('확인 종료 사유: backdrop')).toBeVisible();

  await page.getByLabel('Escape·배경으로 닫기').uncheck();
  await trigger.click();
  dialog = page.getByRole('dialog', { name: '삭제할까요?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: '취소' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  const nondismissibleBox = await dialog.boundingBox();
  expect(nondismissibleBox).not.toBeNull();
  await page.mouse.click(
    nondismissibleBox!.x + 2,
    nondismissibleBox!.y + 2,
  );
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '취소' }).click();
  await expect(dialog).not.toBeAttached();
});

test('Dialog contains Tab focus within both owned Confirm actions', async ({ page }) => {
  await openHtmlRoute(page, route);
  await page.getByRole('button', { name: '확인 대화상자 열기' }).click();
  const dialog = page.getByRole('dialog', { name: '삭제할까요?' });
  const cancel = dialog.getByRole('button', { name: '취소' });
  const confirm = dialog.getByRole('button', { name: '삭제' });

  await expect(cancel).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(confirm).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(cancel).toBeFocused();
  await cancel.click();
});

test('Dialog keeps long copy internally scrollable and contained at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openHtmlRoute(page, route);
  await page.getByLabel('긴 설명').check();
  await page.getByRole('button', { name: '확인 대화상자 열기' }).click();
  const dialog = page.getByRole('dialog', { name: '삭제할까요?' });
  const surface = dialog.locator('.hds-dialog__surface');
  const body = dialog.locator('.hds-dialog__body');
  const actions = dialog.locator('.hds-dialog__actions');
  const viewport = page.viewportSize()!;
  const surfaceBox = await surface.boundingBox();

  expect(surfaceBox).not.toBeNull();
  expect(surfaceBox!.x).toBeGreaterThanOrEqual(0);
  expect(surfaceBox!.x + surfaceBox!.width).toBeLessThanOrEqual(
    viewport.width + 1,
  );
  expect(surfaceBox!.height).toBeLessThanOrEqual(viewport.height - 48 + 1);
  expect(await body.evaluate((element) =>
    element.scrollHeight > element.clientHeight)).toBe(true);
  await expect(actions).toBeVisible();
  await assertNoHorizontalOverflow(page);
  await dialog.getByRole('button', { name: '취소' }).click();
});

test('Dialog keeps wrapped copy and actions visible at 200% text zoom in a 320px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openHtmlRoute(page, route);
  await page.addStyleTag({
    content: `
      .hds-dialog {
        font-size: 200% !important;
      }

      .hds-dialog :is(
        .hds-dialog__title,
        .hds-dialog__description,
        .hds-button,
        .hds-text-button
      ) {
        font-size: inherit !important;
        line-height: 1.5 !important;
      }
    `,
  });
  await page.getByLabel('긴 설명').check();
  await page.getByRole('button', { name: '확인 대화상자 열기' }).click();
  const dialog = page.getByRole('dialog', { name: '삭제할까요?' });
  await expect(dialog).toBeVisible();
  await dialog.evaluate((element) => {
    element.querySelector<HTMLElement>('.hds-dialog__title')!.textContent =
      '정말 이 항목과 연결된 모든 기록을 영구적으로 삭제할까요?';
    element.querySelector<HTMLElement>('.hds-text-button__label')!.textContent =
      '변경 사항을 유지하고 이전 화면으로 돌아가기';
    element.querySelector<HTMLElement>('.hds-button__label')!.textContent =
      '모든 변경 사항을 삭제하고 계속하기';
  });

  const metrics = await dialog.evaluate((element) => {
    const surface = element.querySelector<HTMLElement>('.hds-dialog__surface')!;
    const title = element.querySelector<HTMLElement>('.hds-dialog__title')!;
    const description = element.querySelector<HTMLElement>(
      '.hds-dialog__description',
    )!;
    const actions = element.querySelector<HTMLElement>('.hds-dialog__actions')!;
    const buttons = Array.from(
      actions.querySelectorAll<HTMLElement>('button'),
    );
    const labels = buttons.map((button) =>
      button.querySelector<HTMLElement>(
        '.hds-button__label, .hds-text-button__label',
      )!);
    const surfaceRect = surface.getBoundingClientRect();
    const actionsRect = actions.getBoundingClientRect();
    const isWrapped = (node: HTMLElement) => {
      const lineHeight = Number.parseFloat(getComputedStyle(node).lineHeight);
      return node.getBoundingClientRect().height > lineHeight * 1.5;
    };
    const labelContained = labels.every((label, index) => {
      const labelRect = label.getBoundingClientRect();
      const buttonRect = buttons[index]!.getBoundingClientRect();
      return labelRect.left >= buttonRect.left - 0.5
        && labelRect.right <= buttonRect.right + 0.5;
    });

    return {
      actionsContained:
        actionsRect.left >= surfaceRect.left - 0.5
        && actionsRect.right <= surfaceRect.right + 0.5
        && actionsRect.bottom <= surfaceRect.bottom + 0.5,
      actionsVisible: actionsRect.width > 0 && actionsRect.height > 0,
      actionsWrapped: labels.every(isWrapped),
      descriptionWrapped: isWrapped(description),
      dialogContained: element.scrollWidth <= element.clientWidth + 0.5,
      labelContained,
      pageContained:
        document.documentElement.scrollWidth
        <= document.documentElement.clientWidth + 0.5,
      surfaceContained:
        surfaceRect.left >= -0.5
        && surfaceRect.right <= innerWidth + 0.5
        && surfaceRect.top >= -0.5
        && surfaceRect.bottom <= innerHeight + 0.5,
      surfaceHasNoHorizontalOverflow:
        surface.scrollWidth <= surface.clientWidth + 0.5,
      titleWrapped: isWrapped(title),
    };
  });

  expect(metrics).toEqual({
    actionsContained: true,
    actionsVisible: true,
    actionsWrapped: true,
    descriptionWrapped: true,
    dialogContained: true,
    labelContained: true,
    pageContained: true,
    surfaceContained: true,
    surfaceHasNoHorizontalOverflow: true,
    titleWrapped: true,
  });
  await dialog.getByRole('button', { name: /이전 화면으로 돌아가기/ }).click();
  await expect(dialog).not.toBeAttached();
});

test('Dialog is legible in forced colors, closes immediately for reduced motion, and has zero axe violations', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-chromium',
    'Desktop owns Dialog platform-state coverage.',
  );
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await openHtmlRoute(page, route);
  const palette = await page.evaluate(() => {
    const probe = document.createElement('span');
    document.body.append(probe);
    const read = (value: string) => {
      probe.style.color = value;
      return getComputedStyle(probe).color;
    };
    const colors = {
      buttonFace: read('ButtonFace'),
      buttonText: read('ButtonText'),
      canvas: read('Canvas'),
      canvasText: read('CanvasText'),
      highlight: read('Highlight'),
    };
    probe.remove();
    return colors;
  });

  await page.getByRole('button', { name: '알림 열기' }).click();
  const alertDialog = page.getByRole('alertdialog', { name: '저장되었습니다.' });
  const alertSurface = alertDialog.locator('.hds-dialog__surface');
  const alertAction = alertDialog.getByRole('button', { name: '확인' });
  await expect(alertDialog).toBeVisible();
  await page.keyboard.press('Tab');
  await expectVisibleFocus(alertAction);

  expect(await alertSurface.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      color: style.color,
      forcedColorAdjust: style.forcedColorAdjust,
      transitionDuration: style.transitionDuration,
    };
  })).toEqual({
    backgroundColor: palette.canvas,
    color: palette.canvasText,
    forcedColorAdjust: 'auto',
    transitionDuration: '0s',
  });
  expect(await alertAction.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      color: style.color,
      forcedColorAdjust: style.forcedColorAdjust,
      outlineColor: style.outlineColor,
    };
  })).toEqual({
    backgroundColor: palette.buttonFace,
    color: palette.buttonText,
    forcedColorAdjust: 'auto',
    outlineColor: palette.highlight,
  });
  await assertNoAxeViolations(page);
  await alertAction.click();
  await expect(alertDialog).not.toBeAttached();

  await page.getByRole('button', { name: '확인 대화상자 열기' }).click();
  const dialog = page.getByRole('dialog', { name: '삭제할까요?' });
  const cancel = dialog.getByRole('button', { name: '취소' });
  const confirm = dialog.getByRole('button', { name: '삭제' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Shift+Tab');
  await expectVisibleFocus(confirm);
  expect(await confirm.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      color: style.color,
      forcedColorAdjust: style.forcedColorAdjust,
      outlineColor: style.outlineColor,
    };
  })).toEqual({
    backgroundColor: palette.buttonFace,
    color: palette.buttonText,
    forcedColorAdjust: 'auto',
    outlineColor: palette.highlight,
  });
  await page.keyboard.press('Tab');
  await expectVisibleFocus(cancel);
  expect(await cancel.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      color: style.color,
      forcedColorAdjust: style.forcedColorAdjust,
      outlineColor: style.outlineColor,
    };
  })).toEqual({
    backgroundColor: palette.buttonFace,
    color: palette.buttonText,
    forcedColorAdjust: 'auto',
    outlineColor: palette.highlight,
  });
  await assertNoAxeViolations(page);
  await cancel.click();
  await expect(dialog).not.toBeAttached();
});
