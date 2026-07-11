import { test } from '@playwright/test';
import {
  CANONICAL_HTML_ROUTES,
  assertNoHorizontalOverflow,
  assertSameOriginLinks,
  openHtmlRoute,
} from './support/routes';

for (const route of CANONICAL_HTML_ROUTES) {
  test(`${route.path} renders, fits, and has valid same-origin links`, async ({ page, request }) => {
    await openHtmlRoute(page, route);
    await assertNoHorizontalOverflow(page);
    await assertSameOriginLinks(page, request);
  });
}
