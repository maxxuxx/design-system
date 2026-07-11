# Design System v0.2 진행상황

마지막 갱신: 2026-07-12 (KST)

## 현재 기준점

- 기준 브랜치: `main`
- v0.1 병합 기준: `d958bd7` (`Merge PR #1`)
- v0.2 구현 브랜치: `codex/form-controls-v0-2`
- 저장소: [maxxuxx/design-system](https://github.com/maxxuxx/design-system) (`PUBLIC`)
- Figma: [Design System v0.1](https://www.figma.com/design/hNlju4j556mzi0G515UDwE)
- v0.2 상태: 코드·문서·AI artifact·Figma library 구현과 macOS 검증 완료, Windows Chromium 신규 visual baseline 승인 대기

## 완료된 범위

- `packages/tokens`: 113개 토큰(Primitive 87, Semantic 26)의 CSS·JSON 생성 및 stale artifact 검증
- `packages/react`: `Icon`, `Badge`, `Button`, `TextField`, `ScrollArea`, `Checkbox`, `RadioGroup`, `Switch`, `Textarea`, `Select`
- `apps/docs`: 18개 정적 HTML route와 AI용 `tokens.json`, `components.json`
- Figma:
  - 5 collections, 111 Variables, 8 Text Styles, 2 Effect Styles
  - 17 managed pages
  - 5 owned Icon components와 9 component sets
  - 모든 component URL, variant 수, property, token binding, page screenshot digest를 live readback과 대조
- Form controls v0.2:
  - `Checkbox`: native checked/indeterminate, form value, 오류·비활성 우선순위, 20/24px indicator
  - `RadioGroup`: native same-name selection, controlled/uncontrolled value, required와 option-disabled 처리
  - `Switch`: native checkbox form semantics와 `role="switch"`, 36×20/44×24px track
  - `Textarea`: native typing/form value, 48/56px minimum tier, `vertical`/`none` resize
  - `Select`: native single-select/optgroup/placeholder/form value, 48/56px tier, owned ChevronRight icon
- Exact integration guardrails:
  - 113 tokens, 10 component contracts, 18 HTML routes
  - 17 Figma pages, 111 Variables, 8 Text Styles, 2 Effect Styles, 9 component sets
  - 신규 route·manifest·prop·token·Figma record를 삭제하거나 변형하는 negative tests

## 마지막 검증

`codex/form-controls-v0-2`의 macOS 작업 환경에서 2026-07-12에 root `pnpm verify`가 성공했다.

- TypeScript와 Astro: 오류 0개
- Tokens: 15 tests passed
- React: 124 tests passed
- Docs unit: 22 tests passed
- Guardrail/artifact: 35 tests passed
- Static docs: 18 pages built
- Browser: 256 passed, 113 platform-owned skipped
- Generated artifacts: current
- Repository guardrails: 3 private workspaces, primitive color leak 0
- Figma evidence: artifact verifier와 컴포넌트별 독립 review 통과

현재 환경에서 skip된 항목에는 Windows Chromium이 소유하는 visual comparison이 포함된다. 신규 5개 컴포넌트의 mobile/desktop component-slice PNG 10개는 Windows에서 생성·육안 검토·재비교한 뒤 승인해야 한다. macOS 결과를 Windows baseline 승인으로 간주하지 않는다.

## 다음 세션 시작 방법

```bash
git switch codex/form-controls-v0-2
pnpm install --frozen-lockfile
pnpm verify
```

Windows Chromium baseline 승인:

```powershell
pnpm --filter @maxxuxx/docs exec playwright test tests/e2e/component-slices.visual.spec.ts --update-snapshots
pnpm --filter @maxxuxx/docs exec playwright test tests/e2e/component-slices.visual.spec.ts
```

주요 기준 파일:

- v0.2 설계: `docs/superpowers/specs/2026-07-12-form-controls-v0.2-design.md`
- v0.2 실행 계획: `docs/superpowers/plans/2026-07-12-form-controls-v0.2.md`
- Figma 상태 증거: `figma/verification.json`
- Figma token projection: `figma/token-map.json`
- 전체 검증 명령: root `package.json`의 `verify`

## 남은 후속 범위

- Windows Chromium 신규 component-slice baseline 10개 승인과 branch CI 확인
- Figma Code Connect
- Svelte와 React Native 구현
- 컴포넌트 `preview`에서 `stable`로 승격
- npm 배포, 외부 문서 호스팅, release automation
