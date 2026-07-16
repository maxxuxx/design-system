import { expect, test } from '@playwright/test';
import { assertNoAxeViolations } from './support/accessibility';
import { assertNoHorizontalOverflow, openHtmlRoute } from './support/routes';

test.beforeEach(async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/toast/', heading: 'Toast' });
});

test('announces neutral, success, and danger tones with the correct live roles', async ({ page }) => {
  await page.getByRole('button', { name: '중립 알림' }).click();
  await expect(page.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  await expect(page.getByRole('status')).toHaveAttribute('aria-atomic', 'true');
  await expect(page.getByRole('status')).toHaveAttribute('data-tone', 'neutral');

  await page.getByRole('button', { name: '성공 알림' }).click();
  await expect(page.getByRole('status')).toHaveAttribute('data-tone', 'success');

  await page.getByRole('button', { name: '위험 알림' }).click();
  await expect(page.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  await expect(page.getByRole('alert')).toHaveAttribute('aria-atomic', 'true');
  await expect(page.getByRole('alert')).toHaveAttribute('data-tone', 'danger');
  await assertNoAxeViolations(page);
});

test('keeps FIFO order, advances through native actions, and preserves focus', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'FIFO 3개 알림' });
  await trigger.click();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('status')).toContainText('FIFO 첫 번째');
  await expect(page.getByRole('status')).toHaveCount(1);

  await page.getByRole('button', { name: '다음 알림' }).click();
  await expect(page.getByRole('status')).toContainText('FIFO 두 번째');
  await page.getByRole('button', { name: '다음 알림' }).click();
  await expect(page.getByRole('alert')).toContainText('FIFO 세 번째');
  await expect(page.getByRole('alert').getByRole('button')).toHaveCount(0);
});

test('invokes a bottom action and advances without moving focus on show', async ({ page }) => {
  const trigger = page.getByRole('button', { name: '실행 취소 알림' });
  await trigger.click();
  await expect(trigger).toBeFocused();
  const action = page.getByRole('button', { name: '되돌리기' });
  await expect(action).toBeVisible();
  const toast = page.getByRole('status');
  const toastColor = await toast.evaluate((element) => getComputedStyle(element).color);
  await expect.poll(
    () => action.evaluate((element) => getComputedStyle(element).color),
  ).toBe(toastColor);
  await action.hover();
  await expect.poll(
    () => action.evaluate((element) => getComputedStyle(element).color),
  ).toBe(toastColor);
  await action.click();
  await expect(page.getByText('최근 이벤트: 되돌리기 실행')).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('renders a top Toast without an action', async ({ page }) => {
  await page.getByRole('button', { name: '상단 알림' }).click();
  const toast = page.getByRole('status');
  await expect(toast).toHaveAttribute('data-position', 'top');
  await expect(toast.getByRole('button')).toHaveCount(0);
  const box = await toast.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeLessThan(page.viewportSize()!.height / 2);
});

test('pauses its remaining duration while pointer-hovered', async ({ page }) => {
  await page.getByRole('button', { name: '일시정지 확인' }).click();
  const toast = page.getByRole('status');
  await toast.hover();
  await page.waitForTimeout(1100);
  await expect(toast).toBeVisible();

  await page.getByRole('heading', { level: 1, name: 'Toast' }).hover();
  await expect(toast).toBeHidden({ timeout: 1500 });
});

test('contains long copy at 320px and honors reduced motion and forced colors', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.getByRole('button', { name: '긴 메시지 알림' }).click();
  const toast = page.getByRole('status');
  const styles = await toast.evaluate((element) => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return {
      boxShadow: style.boxShadow,
      left: box.left,
      right: box.right,
      transform: style.transform,
      transitionDuration: style.transitionDuration,
    };
  });

  expect(styles.left).toBeGreaterThanOrEqual(0);
  expect(styles.right).toBeLessThanOrEqual(320);
  expect(styles.transform).toBe('none');
  expect(styles.transitionDuration).toMatch(/^0s(?:, 0s)?$/);
  expect(styles.boxShadow).toBe('none');
  await assertNoHorizontalOverflow(page);
});
