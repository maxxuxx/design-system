import { test } from '@playwright/test';
import { PLATFORM_HTML_ROUTES, assertNoHorizontalOverflow, openHtmlRoute } from './support/routes';
for (const route of PLATFORM_HTML_ROUTES) test(`[platform] ${route.path} renders with no horizontal overflow`, async ({ page }) => { await openHtmlRoute(page, route); await assertNoHorizontalOverflow(page); });
