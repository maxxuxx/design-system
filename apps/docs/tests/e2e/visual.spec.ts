import { test } from '@playwright/test';
import brand from '../../src/config/brand.json' with { type: 'json' };
import { assertNoHorizontalOverflow, openHtmlRoute } from './support/routes';
import { expectPageScreenshot } from './support/visual';

test.skip(process.platform !== 'win32', 'Visual baselines are approved only on Windows Chromium.');

const cases = [
  { name: 'home', path: '/', heading: brand.headline },
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
