# Design System 진행상황

마지막 갱신: 2026-07-12 (KST)

## 현재 기준점

- 기준 브랜치: `main`
- v0.1 병합 기준: `d958bd7` (`Merge PR #1`)
- 저장소: [maxxuxx/design-system](https://github.com/maxxuxx/design-system) (`PUBLIC`)
- 병합 PR: [#1 Complete public AI-readable design system v0.1](https://github.com/maxxuxx/design-system/pull/1)
- Figma: [Design System v0.1](https://www.figma.com/design/hNlju4j556mzi0G515UDwE)
- Figma ScrollArea: [component set](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=115-6)

새 작업은 최신 `main`을 가져온 뒤, 필요한 경우 그 지점에서 새 기능 브랜치를 만들어 시작한다.

## 완료된 범위

- `packages/tokens`: 107개 토큰의 CSS·JSON 생성 및 stale artifact 검증
- `packages/react`: `Icon`, `Badge`, `Button`, `TextField`, `ScrollArea`
- `apps/docs`: 13개 정적 문서 route와 AI용 `tokens.json`, `components.json`
- Figma: Foundations, Variables, Styles, 5개 컴포넌트 문서와 variant/component set
- ScrollArea:
  - 우측 기본 scrollbar를 시각적으로 숨기고 native wheel·touch·keyboard scrolling 유지
  - 이동 가능한 위·아래 방향에만 44px navigation button 활성화
  - `color/bg/surface` 36% directional tint와 `blur/subtle` 8px background blur 적용
  - `No overflow`, `Start`, `Middle`, `End` 상태를 코드와 Figma에서 동일하게 관리
- 검증: 토큰·React·문서·접근성·artifact·Figma evidence·Windows visual baseline을 root `pnpm verify`와 GitHub Actions에서 확인

## 마지막 검증

- 병합된 `main`에서 `pnpm verify`: 성공
  - React 61 tests
  - Tokens 14 tests
  - Docs unit 17 tests
  - Guardrail/artifact 30 tests
  - Browser 143 passed, 70 platform-owned skipped
  - Static docs 13 routes
- GitHub Actions: [main Verify run 29157275723](https://github.com/maxxuxx/design-system/actions/runs/29157275723)
  - Ubuntu: 성공
  - Windows: 성공
  - Windows browser: 168 passed, 45 platform-owned skipped

## 다음 세션 시작 방법

```bash
git switch main
git pull --ff-only origin main
pnpm install --frozen-lockfile
pnpm verify
```

변경 작업용 브랜치가 필요하면 최신 `main`에서 생성한다.

```bash
git switch -c codex/<task-name>
```

문서 개발 서버:

```bash
pnpm --filter @maxxuxx/docs dev
```

주요 기준 파일:

- 상위 로드맵: `docs/superpowers/plans/2026-07-10-ai-readable-design-system-v0.1.md`
- ScrollArea 설계: `docs/superpowers/specs/2026-07-11-scroll-area-design.md`
- ScrollArea 실행 계획: `docs/superpowers/plans/2026-07-11-scroll-area.md`
- Figma 상태 증거: `figma/verification.json`
- 전체 검증 명령: root `package.json`의 `verify`

## 남은 후속 범위

아래 항목은 v0.1 미완료가 아니라 의도적으로 후속으로 남긴 범위다.

- Figma Code Connect
- Svelte와 React Native 구현
- 컴포넌트 `preview`에서 `stable`로 승격
- npm 배포, 외부 문서 호스팅, release automation
