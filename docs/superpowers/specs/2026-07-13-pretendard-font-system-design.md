# Pretendard Font System Design

## Goal

Replace the design system's IBM Plex Sans KR-first system stack with a
self-hosted Pretendard Variable setup that stays consistent across the web
packages, documentation site, generated AI-readable artifacts, and the linked
Figma library.

## Upstream and licensing

- Vendor the official Pretendard v1.3.9 variable dynamic subset webfont files.
- Preserve the upstream font family names and files without modification.
- Include the SIL Open Font License 1.1 and upstream attribution alongside the
  vendored assets.
- Do not make runtime requests to a CDN or other external font host.

Upstream references:

- <https://github.com/orioncactus/pretendard>
- <https://github.com/orioncactus/pretendard/blob/main/LICENSE>

## Package architecture

`@maxxuxx/tokens` owns the font assets because it already owns the typography
tokens consumed by the documentation site and React components.

The package exposes two independent CSS entrypoints:

- `@maxxuxx/tokens/tokens.css` contains only generated design-token variables.
- `@maxxuxx/tokens/fonts.css` contains local `@font-face` declarations for the
  Pretendard Variable dynamic subsets.

The font entrypoint references only WOFF2 files stored inside the package. Its
faces use the official variable weight range and `font-display: swap`. Keeping
the entrypoints separate lets applications opt into the font payload while
still sharing the same tokens.

The documentation layout imports `fonts.css` once before its global styles.
React components continue to reference `--ds-font-family-sans`; they do not
load fonts themselves.

## Token model

The existing `font/family/sans` primitive remains the single public family
token. Its value becomes this stack:

```css
"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont,
"Segoe UI", "Noto Sans KR", sans-serif
```

The current size, line-height, and weight tokens remain unchanged. The current
400, 500, 600, and 700 weight values all fall within the Pretendard Variable
weight axis.

Changing the source primitive regenerates:

- `packages/tokens/dist/tokens.css`
- `packages/tokens/dist/tokens.json`
- `apps/docs/public/design-system/tokens.json`

The typography documentation changes from describing a system-only stack to
documenting the self-hosted Pretendard entrypoint, fallback behavior, and
consumer import syntax.

## Figma synchronization

The linked Figma library changes in the same delivery so code and design do not
diverge.

- Update the existing `font/family/sans` variable value to the Pretendard stack.
- Update all eight existing text styles from IBM Plex Sans KR to Pretendard.
- Preserve all Variable IDs and Text Style IDs.
- Verify that Button, Badge, TextField, documentation specimens, and other
  style-bound text inherit the updated styles.
- Find and update relevant text nodes that still specify IBM Plex Sans KR
  directly.
- Read back the final Figma state and update `figma/verification.json` so its
  token-values digest matches the generated code artifact.
- Keep `figma/token-map.json` stable unless readback proves that metadata needs
  synchronization; existing IDs must not be replaced.

If Pretendard is unavailable in the Figma file context, the migration must stop
instead of silently saving a fallback family.

## Verification

Automated checks cover these contracts:

- The package exports `fonts.css` and the referenced font assets.
- Every font URL is local and resolves to a vendored WOFF2 file.
- No font stylesheet contains a CDN or other external runtime URL.
- `font-display: swap`, the variable weight range, and the Pretendard family
  name are present.
- The generated CSS and JSON contain the exact new family stack.
- The documentation build emits usable font CSS and WOFF2 assets.
- Browser tests confirm both `document.fonts.check()` and the computed family
  on representative typography and component examples.
- Figma readback confirms the variable, eight text styles, and relevant
  components use Pretendard while retaining their IDs.
- Code and Figma token digests match.
- Unit tests, type checks, token generation checks, guardrails, build checks,
  and E2E tests pass through the repository verification command.

Font-metric changes are expected to alter visual baselines. Any affected
screenshots are regenerated only after browser font-loading checks pass, then
reviewed as an intentional typography change.

## Failure and fallback behavior

On the web, a font-loading failure falls through to the declared platform and
Korean sans-serif stack. Missing WOFF2 files, missing license attribution,
external font URLs, stale generated artifacts, changed Figma IDs, or a Figma
fallback family are build or verification failures rather than accepted states.

## Completion criteria

The migration is complete only when the repository imports and serves local
Pretendard assets, all generated artifacts and documentation describe the new
stack, the linked Figma system uses Pretendard without changing stable IDs, and
the complete verification suite passes with reviewed visual baselines.
