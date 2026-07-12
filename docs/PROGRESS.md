# Design System v0.3 진행상황

마지막 갱신: 2026-07-12 (KST)

## 현재 기준점

- v0.2 완료 기준: `9281837` (`test: close form control verification gaps`)
- v0.3 구현 브랜치: `codex/tds-mobile-core-v0-3`
- 저장소: [maxxuxx/design-system](https://github.com/maxxuxx/design-system) (`PUBLIC`)
- Figma: [Design System v0.1](https://www.figma.com/design/hNlju4j556mzi0G515UDwE)
- v0.3 상태: 코드·문서·AI artifact·Figma library 구현과 macOS 전체 검증 완료, Windows Chromium visual baseline 승인 대기

## 완료된 범위

- `packages/tokens`: 118개 토큰(Primitive 91, Semantic 27)의 CSS·JSON 생성과 stale artifact 검증
  - `color/bg/scrim`
  - `motion/duration/fast`, `motion/duration/medium`, `motion/easing/standard`
- `packages/react`: 15개 컴포넌트
  - 기존 `Icon`, `Badge`, `Button`, `TextField`, `ScrollArea`, `Checkbox`, `RadioGroup`, `Switch`, `Textarea`, `Select`
  - 신규 `TextButton`, `IconButton`, `BoardRow`, `Tab`, `BottomSheet`
- `apps/docs`:
  - 25개 정적 HTML route
  - 생성된 manifest 순서와 동일한 `/components/` 카탈로그
  - AI용 `tokens.json`, `components.json`
  - Motion foundation과 신규 5개 컴포넌트 문서·interactive example
- Figma:
  - 6 collections, 116 Variables, 8 Text Styles, 2 Effect Styles
  - 22 managed pages
  - 5 owned Icon components와 14 component sets
  - 모든 component URL, variant 수, 축 순서, property, token binding, page screenshot digest를 live readback과 대조
  - `04.15 BottomSheet`는 4개 open-state variant, owned Close/Button, scrim·surface·radius·elevation binding을 독립 리뷰에서 승인
- Exact integration guardrails:
  - 118 tokens, 15 component contracts, 25 HTML routes
  - 6 collections, 116 Variables, 22 Figma pages, 14 component sets
  - 15 manifest Figma targets와 5 owned Icon targets를 합친 20개 distinct evidence targets
  - 신규 token·route·manifest·prop·Figma record·ordered axis·screenshot을 삭제하거나 변형하는 negative tests
  - 15개 component slice × mobile/desktop = 30개 Windows visual target 선언을 누락·재정렬하면 실패

## 마지막 검증

`codex/tds-mobile-core-v0-3`의 macOS 작업 환경에서 2026-07-12에 root `pnpm verify`가 성공했다.

- TypeScript와 Astro: 오류 0개, 경고 0개; 기존 Zod URL API deprecation hint 1개
- Tokens: 25 tests passed
- React: 201 tests passed
- Docs unit: 31 tests passed
- Guardrail/artifact: 37 tests passed
- Static docs: 25 pages built
- Browser: 426 passed, 156개의 명시적 platform/viewport-owned skip
- Focused 기능·접근성 묶음: 297 passed, 84개의 명시적 skip
- Generated artifacts: current
- Repository guardrails: 3 private workspaces, primitive color leak 0, Windows component-slice target 30개
- Figma evidence: artifact verifier와 컴포넌트별 독립 live review 통과

현재 환경에서 skip된 항목은 다른 viewport가 소유한 assertion과 Windows Chromium visual comparison입니다. 저장소에는 v0.1 컴포넌트 5개의 mobile/desktop baseline 10개가 있습니다. v0.2 form control 5개와 v0.3 신규 5개의 baseline은 각각 10개씩, 총 20개가 아직 Windows에서 생성·육안 검토·재비교되어야 합니다. macOS 결과를 Windows baseline 승인으로 간주하지 않습니다.

## 다음 세션 시작 방법

```bash
git switch codex/tds-mobile-core-v0-3
pnpm install --frozen-lockfile
pnpm verify
```

Windows Chromium baseline 승인:

```powershell
pnpm --filter @maxxuxx/docs exec playwright test tests/e2e/component-slices.visual.spec.ts --update-snapshots
pnpm --filter @maxxuxx/docs exec playwright test tests/e2e/component-slices.visual.spec.ts
```

주요 기준 파일:

- v0.3 설계: `docs/superpowers/specs/2026-07-12-tds-mobile-core-v0.3-design.md`
- v0.3 실행 계획: `docs/superpowers/plans/2026-07-12-tds-mobile-core-v0.3.md`
- Figma 상태 증거: `figma/verification.json`
- Figma token projection: `figma/token-map.json`
- 전체 검증 명령: root `package.json`의 `verify`

## 남은 후속 범위

- Windows Chromium component-slice baseline 20개 승인과 branch CI 확인
- Figma Code Connect
- Svelte와 React Native 구현
- 컴포넌트 `preview`에서 `stable`로 승격
- npm 배포, 외부 문서 호스팅, release automation
