import { expect, type APIRequestContext, type Page } from '@playwright/test';
export interface HtmlRoute { path: string; heading: string }
export const PLATFORM_HTML_ROUTES: readonly HtmlRoute[] = [
  { path: '/', heading: '사람과 AI가 함께 읽는 디자인 시스템' }, { path: '/principles/', heading: '원칙' }, { path: '/getting-started/', heading: 'Getting Started' },
  { path: '/foundations/colors/', heading: '색상' }, { path: '/foundations/typography/', heading: '타이포그래피' }, { path: '/foundations/spacing/', heading: '간격' },
  { path: '/foundations/radius/', heading: '모서리 반경' }, { path: '/foundations/elevation/', heading: '고도' },
  { path: '/foundations/motion/', heading: '모션' },
];
export const COMPONENT_CATALOG_ROUTE: HtmlRoute = { path: '/components/', heading: 'Components' };
export const COMPONENT_HTML_ROUTES: readonly (HtmlRoute & { slug: string })[] = [
  { path: '/components/icon/', heading: 'Icon', slug: 'icon' }, { path: '/components/badge/', heading: 'Badge', slug: 'badge' },
  { path: '/components/button/', heading: 'Button', slug: 'button' }, { path: '/components/text-field/', heading: 'TextField', slug: 'text-field' },
  { path: '/components/scroll-area/', heading: 'ScrollArea', slug: 'scroll-area' },
  { path: '/components/checkbox/', heading: 'Checkbox', slug: 'checkbox' },
  { path: '/components/radio-group/', heading: 'RadioGroup', slug: 'radio-group' },
  { path: '/components/switch/', heading: 'Switch', slug: 'switch' },
  { path: '/components/textarea/', heading: 'Textarea', slug: 'textarea' },
  { path: '/components/select/', heading: 'Select', slug: 'select' },
  { path: '/components/text-button/', heading: 'TextButton', slug: 'text-button' },
  { path: '/components/icon-button/', heading: 'IconButton', slug: 'icon-button' },
  { path: '/components/board-row/', heading: 'BoardRow', slug: 'board-row' },
  { path: '/components/tab/', heading: 'Tab', slug: 'tab' },
  { path: '/components/bottom-sheet/', heading: 'BottomSheet', slug: 'bottom-sheet' },
  { path: '/components/dialog/', heading: 'Dialog', slug: 'dialog' },
];
export const CANONICAL_HTML_ROUTES = [
  ...PLATFORM_HTML_ROUTES,
  COMPONENT_CATALOG_ROUTE,
  ...COMPONENT_HTML_ROUTES,
] as const;
export async function openHtmlRoute(page: Page, route: HtmlRoute): Promise<void> { const response = await page.goto(route.path, { waitUntil: 'networkidle' }); expect(response).not.toBeNull(); expect(response!.status()).toBe(200); await expect(page.getByRole('heading', { level: 1, name: route.heading, exact: true })).toBeVisible(); }
export async function assertNoHorizontalOverflow(page: Page): Promise<void> { const d = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth })); expect(d.scrollWidth).toBeLessThanOrEqual(d.clientWidth); }
export async function assertSameOriginLinks(page: Page, request: APIRequestContext): Promise<void> { const current = new URL(page.url()); const hrefs = await page.locator('a[href]').evaluateAll(a => a.map(x => (x as HTMLAnchorElement).href)); const links = [...new Set(hrefs.map(h => new URL(h, current)).filter(u => ['http:', 'https:'].includes(u.protocol) && u.origin === current.origin).map(u => u.href))].sort(); for (const href of links) { const url = new URL(href); const withoutFragment = `${url.origin}${url.pathname}${url.search}`; const response = await request.get(withoutFragment); expect(response.ok(), `${href} returned ${response.status()}`).toBe(true); if (url.hash) { const p = await page.context().newPage(); await p.goto(withoutFragment); const id = decodeURIComponent(url.hash.slice(1)); expect(await p.evaluate(v => document.getElementById(v) !== null, id)).toBe(true); await p.close(); } } }
