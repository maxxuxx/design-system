# Design System v0.4 진행상황

마지막 갱신: 2026-07-14 (KST)

## 현재 기준점

- v0.3 완료 기준: `fa0ed09` (`docs: add durable v0.3 progress ledger`)
- v0.4 구현 브랜치: `codex/tds-mobile-core-v0-4`
- 저장소: [maxxuxx/design-system](https://github.com/maxxuxx/design-system) (`PUBLIC`)
- Figma: [Design System](https://www.figma.com/design/hNlju4j556mzi0G515UDwE)
- v0.4 상태: 코드·문서·AI artifact·Figma library 구현과 macOS 전체 검증 완료, Windows Chromium visual baseline 승인 대기

## 완료된 범위

- `packages/tokens`: 118개 토큰(Primitive 91, Semantic 27)의 CSS·JSON 생성과 stale artifact 검증
  - self-hosted Pretendard Variable subset과 SIL OFL license
  - `font/family/sans`의 Pretendard 기반 한국어 fallback stack
  - `color/bg/scrim`, motion duration·easing, safe-area 대응 토큰
- `packages/react`: 20개 컴포넌트
  - v0.1~v0.3: `Icon`, `Badge`, `Button`, `TextField`, `ScrollArea`, `Checkbox`, `RadioGroup`, `Switch`, `Textarea`, `Select`, `TextButton`, `IconButton`, `BoardRow`, `Tab`, `BottomSheet`
  - v0.4: `Dialog`, `SearchField`, `ListRow`, `Toast`, `BottomCTA`
- `apps/docs`:
  - 30개 정적 HTML route
  - 생성된 manifest 순서와 동일한 `/components/` 카탈로그
  - AI용 `tokens.json`, `components.json`
  - 20개 컴포넌트 문서·interactive example과 v0.4 버전 표기
- Figma:
  - 6 collections, 116 Variables, 8 Text Styles, 2 Effect Styles
  - 27 managed pages
  - 5 owned Icon components와 19 component sets
  - 모든 component URL, variant 수, 축 순서, property, token binding, page screenshot digest를 live readback과 대조
  - `04.16 Dialog`부터 `04.20 BottomCTA`까지 React 공개 계약과 variant/property parity 검증
- Exact integration guardrails:
  - 118 tokens, 20 component contracts, 30 HTML routes
  - 6 collections, 116 Variables, 27 Figma pages, 19 component sets
  - 20 manifest Figma targets와 5 owned Icon targets를 합친 25개 distinct evidence targets
  - token·route·manifest·prop·Figma record·ordered axis·screenshot을 삭제하거나 변형하는 negative tests
  - 20개 component slice × mobile/desktop = 40개 Windows visual target 선언을 누락·재정렬하면 실패

## 마지막 검증

`codex/tds-mobile-core-v0-4`의 macOS 작업 환경에서 2026-07-14에 root `pnpm verify`가 성공했다.

- TypeScript와 Astro: 오류 0개, 경고 0개; 기존 Zod URL API deprecation hint 1개
- Tokens: 26 tests passed
- React: 301 tests passed
- Docs unit: 36 tests passed
- Guardrail/artifact: 39 tests passed
- Static docs: 30 pages built
- Browser: 580 passed, 197개의 명시적 platform/viewport-owned skip
- Generated artifacts: current
- Repository guardrails: 3 private workspaces, primitive color leak 0, Windows component-slice target 40개
- Figma evidence: 27 managed pages와 20개 component contract artifact verifier 통과

현재 환경에서 skip된 항목은 다른 viewport가 소유한 assertion과 Windows Chromium visual comparison입니다. 저장소에는 v0.1 컴포넌트 5개의 mobile/desktop baseline 10개가 있습니다. v0.2, v0.3, v0.4의 15개 컴포넌트 baseline 30개는 Windows에서 생성·육안 검토·재비교되어야 합니다. macOS 결과를 Windows baseline 승인으로 간주하지 않습니다.

## 재검증 방법

```bash
pnpm install --frozen-lockfile
pnpm verify
```

Windows Chromium baseline 승인:

```powershell
pnpm --filter @maxxuxx/docs exec playwright test tests/e2e/component-slices.visual.spec.ts --update-snapshots
pnpm --filter @maxxuxx/docs exec playwright test tests/e2e/component-slices.visual.spec.ts
```

주요 기준 파일:

- v0.4 설계: `docs/superpowers/specs/2026-07-12-tds-mobile-workflows-v0.4-design.md`
- v0.4 실행 계획: `docs/superpowers/plans/2026-07-12-tds-mobile-workflows-v0.4.md`
- Figma 상태 증거: `figma/verification.json`
- Figma token projection: `figma/token-map.json`
- 전체 검증 명령: root `package.json`의 `verify`

## 남은 후속 범위

- Windows Chromium component-slice baseline 30개 승인과 branch CI 확인
- Haru Design System(HDS) 이름·package scope·문서 metadata 전환
- Vercel preview와 production 문서 배포
- Figma Code Connect
- Svelte와 React Native 구현
- 컴포넌트 `preview`에서 `stable`로 승격
- npm 배포와 release automation
