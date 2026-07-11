import { test } from '@playwright/test';
import { assertNoHorizontalOverflow, openHtmlRoute } from './support/routes';
import { expectPageScreenshot } from './support/visual';

test.skip(process.platform !== 'win32', 'Visual baselines are approved only on Windows Chromium.');

const cases = [
  { name: 'home', path: '/', heading: '사람과 AI가 함께 읽는 디자인 시스템' },
  { name: 'foundations-colors', path: '/foundations/colors/', heading: '색상' },
  { name: 'button', path: '/components/button/', heading: 'Button' },
  { name: 'text-field', path: '/components/text-field/', heading: 'TextField' },
  { name: 'scroll-area', path: '/components/scroll-area/', heading: 'ScrollArea' },
] as const;

for (const visualCase of cases) {
  test(`${visualCase.name} matches the reviewed full-page baseline`, async ({ page }, testInfo) => {
    await openHtmlRoute(page, visualCase);
    await assertNoHorizontalOverflow(page);
    await expectPageScreenshot(page, testInfo, visualCase.name);
  });
}
