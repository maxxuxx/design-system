import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import { fileURLToPath } from 'node:url';
const screenshotStylePath = fileURLToPath(new URL('./screenshot.css', import.meta.url));
export async function prepareVisualPage(page: Page): Promise<void> { await page.emulateMedia({ reducedMotion: 'reduce' }); await page.evaluate(async () => { await document.fonts.ready; }); }
export async function expectPageScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string,
  target?: Locator,
): Promise<void> {
  await prepareVisualPage(page);
  const snapshotName = `${name}-${testInfo.project.name}.png`;
  const options = {
    animations: 'disabled' as const,
    caret: 'hide' as const,
    maxDiffPixels: 100,
    stylePath: screenshotStylePath,
  };
  if (target) {
    await expect(target).toHaveScreenshot(snapshotName, options);
    return;
  }
  await expect(page).toHaveScreenshot(snapshotName, { ...options, fullPage: true });
}
