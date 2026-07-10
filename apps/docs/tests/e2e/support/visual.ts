import { expect, type Page, type TestInfo } from '@playwright/test';
import { fileURLToPath } from 'node:url';
const screenshotStylePath = fileURLToPath(new URL('./screenshot.css', import.meta.url));
export async function prepareVisualPage(page: Page): Promise<void> { await page.emulateMedia({ reducedMotion: 'reduce' }); await page.evaluate(async () => { await document.fonts.ready; }); }
export async function expectPageScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> { await prepareVisualPage(page); await expect(page).toHaveScreenshot(`${name}-${testInfo.project.name}.png`, { animations: 'disabled', caret: 'hide', fullPage: true, maxDiffPixelRatio: 0.01, stylePath: screenshotStylePath }); }
