# AI-Readable Design System v0.1 실행 로드맵

> **For agentic workers:** 이 문서는 실행 순서와 승인 게이트를 정의하는 상위 로드맵이다. 파일별 코드, 테스트, 명령은 아래 5개 실행 계획이 유일한 기준이다. 구현할 때는 `superpowers:subagent-driven-development` 또는 각 문서가 지정한 실행 스킬을 사용한다.

**Goal:** 모바일 우선 Figma Foundations, React 파일럿 컴포넌트 4개, Astro 정적 문서, AI용 JSON 산출물을 하나의 검증 가능한 로컬 디자인 시스템 v0.1로 만든다.

**Architecture:** `packages/tokens`가 디자인 값의 코드 원본이고, Figma는 같은 계약을 따르는 시각 구현체다. `packages/react`는 의미 토큰만 소비하며, `apps/docs`는 Astro 정적 HTML·MDX와 필요한 React island를 제공한다. MDX frontmatter에서 AI용 component manifest를 생성하고, Playwright와 기계 판독 가능한 Figma 증거로 전체 결과를 검증한다.

**Tech Stack:** Node.js 24, pnpm workspace, TypeScript, Astro, React, Vitest, Testing Library, Playwright, axe-core, Figma Variables·Styles·Components.

## 현재 상태와 안전 게이트

- 기준 설계서: `docs/superpowers/specs/2026-07-10-ai-readable-design-system-v0.1-design.md`
- 기준 저장소: `C:\Github\design-system`
- 원격: `maxxuxx/design-system`
- 계획 작성 시점 원격 visibility: `PUBLIC`
- 로컬 작업과 커밋은 가능하지만 원격이 `PRIVATE`로 확인되기 전에는 push하지 않는다.
- npm 배포, registry, 외부 호스팅은 v0.1 범위가 아니다.
- Svelte와 React Native는 `planned`; 코드 폴더를 미리 만들지 않는다.
- 컴포넌트 상태는 v0.1에서 모두 `preview`; `stable` 승격은 후속 작업이다.
- Figma 쓰기는 비공개 Figma Design 파일에서만 수행하고, 새 파일 생성 전에는 Figma 실행 계획의 사전 승인 게이트를 통과한다.

## 실행 계획

| 순서 | 실행 계획 | 핵심 산출물 | 완료 게이트 |
|---:|---|---|---|
| 01 | [Foundations와 workspace](./2026-07-10-ai-readable-design-system-v0.1-01-foundations.md) | pnpm workspace, 토큰 원본·generator·검증, CSS·JSON | `tokens:generate`, token tests, generated check 통과 |
| 02 | [Astro 문서 플랫폼](./2026-07-10-ai-readable-design-system-v0.1-02-docs.md) | 정적 문서 shell, content schema, manifest pipeline, Playwright 기반 | content·manifest tests와 Astro build 통과 |
| 03 | [React 파일럿 컴포넌트](./2026-07-10-ai-readable-design-system-v0.1-03-components.md) | Icon, Badge, Button, TextField, MDX, interaction·a11y tests | 컴포넌트별 contract·test·manifest·build·viewport QA 통과 |
| 04 | [Figma 라이브러리](./2026-07-10-ai-readable-design-system-v0.1-04-figma.md) | Variables, Styles, Foundations, 4개 component set, QA ledger | 구조 readback, 모든 페이지 screenshot, `figma/verification.json` |
| 05 | [통합 검증](./2026-07-10-ai-readable-design-system-v0.1-05-integration.md) | guardrails, artifact verifier, root `verify` | fresh 전체 검증과 GitHub Private readback 통과 |

상위 로드맵의 예전 Task 설명과 하위 계획이 충돌할 경우, 번호가 붙은 하위 실행 계획을 우선한다. 하위 계획은 실제 파일 내용, 실패 테스트, 최소 구현, 검증 명령을 포함한다.

## 잠긴 설계 결정

### 저장소와 패키지 경계

```text
apps/docs
packages/tokens
packages/react
figma
tooling/verification
```

- 모든 workspace package는 `private: true`다.
- token source와 생성 스크립트만 직접 수정한다. `dist` 및 문서 공개 JSON은 generator가 만든다.
- React와 문서 CSS는 primitive 색상 변수를 직접 참조하지 않고 semantic 색상 변수만 사용한다.
- 문서의 component manifest는 MDX와 별도로 손으로 관리하지 않고 검증된 frontmatter에서 생성한다.
- Figma URL·node ID는 메타데이터이며 저장할 수 있지만, PAT·배포 토큰·Figma access token은 저장하지 않는다.

### 콘텐츠와 URL

- 컴포넌트 이름은 Figma, React export, MDX `name`, manifest `name`에서 동일하다.
- 파일 ID, slug, manifest ID, URL `/components/{id}/`는 동일한 kebab-case 규칙을 사용한다.
- 각 컴포넌트 문서는 목적, 사용 시점, 사용 금지, anatomy, sizes, variants, states, 접근성, React API, 토큰, Figma URL, framework 상태를 가진다.
- AI 산출물은 `/design-system/tokens.json`과 `/design-system/components.json`으로 정적 build에 포함한다.

### 컴포넌트 계약

- 순서: `Icon → Badge → Button → TextField`.
- Icon은 장식용일 때 `aria-hidden`, 의미가 있을 때 이름을 갖는 이미지 역할을 컴포넌트가 소유한다. 호출자가 충돌하는 ARIA props를 덮어쓰지 못하게 한다.
- Button의 leading/trailing icon은 Icon 계약을 재사용하고 Figma에서는 instance swap으로 대응한다.
- Button loading·disabled는 상호작용을 막고, loading은 busy 상태와 시각적 진행 상태를 함께 제공한다.
- TextField 상태 우선순위는 `Disabled > Error > Focus > Default`다. error는 invalid 상태를 강제하며 생성된 description/error ID 뒤에 호출자 `aria-describedby`를 이어 붙인다.
- 모바일 최소 터치 영역은 44px이고, 데스크톱은 `focus-visible`을 명확히 제공한다.

## 실제 실행 순서

### Gate 0 — 저장소 격리

1. 현재 변경 범위를 확인한다.
2. 계획 문서를 로컬 기준점으로 보존한다.
3. `superpowers:using-git-worktrees`에 따라 `codex/design-system-v0.1` 격리 worktree를 만든다.
4. `gh repo view maxxuxx/design-system --json visibility,isPrivate` 결과가 Private가 아니면 push 금지를 유지한다.

### Gate 1 — 코드 Foundations

계획 01을 끝까지 실행한다. workspace와 token pipeline이 fresh checkout에서 재현되고 생성물이 최신이어야 한다.

### Gate 2 — 문서 플랫폼 뼈대

계획 02의 Astro shell, content schema, manifest generator, Playwright web server 기반을 만든다. 아직 존재하지 않는 파일럿 페이지를 성공한 것처럼 표시하지 않는다.

### Gate 3 — Figma Foundations 승인

계획 04의 Phase 0–2를 실행한다.

1. 기존 라이브러리와 대상 파일을 읽기 전용으로 조사한다.
2. 비공개 Figma Design 파일을 확정한다.
3. 코드 token JSON에서 Variables·Text Styles·Effect Styles를 만든다.
4. Foundation 문서 페이지를 screenshot으로 검토한다.
5. 색상과 타이포그래피 승인을 받은 뒤 컴포넌트 루프로 넘어간다.

승인에서 값이 바뀌면 계획 01의 token source를 먼저 수정하고 생성물과 Figma를 다시 동기화한다.

### Gate 4 — 컴포넌트 수직 슬라이스

아래 루프를 Icon, Badge, Button, TextField 순서로 반복한다.

```text
계획 03에서 목적·사용·금지·API·상태 계약 고정
→ 실패하는 unit/interaction/a11y test 작성
→ React 최소 구현과 MDX 작성
→ manifest 생성·검증, package tests, Astro build
→ 390x844 및 1440x900 실제 브라우저 검토
→ 계획 04에서 같은 계약의 Figma 컴포넌트 생성·readback·screenshot 승인
→ 실제 Figma node URL을 해당 MDX에 반영하고 manifest·build 재검증
→ 다음 컴포넌트
```

각 슬라이스에서 manifest를 다시 쓰고 확인한 뒤 build한다. Icon과 Badge도 마지막에 몰아 검토하지 않고 각자 모바일·데스크톱 시각 검증을 통과한다.

### Gate 5 — Figma 최종 QA

계획 04 Phase 4를 실행해 11개 페이지, 변수·스타일, variant/property 수, token binding, 접근성 표시, component URLs를 readback한다. 실제 readback만으로 `figma/verification.json`을 만든다.

그다음 계획 02 Task 5로 돌아가 12개 정적 HTML route, 두 AI JSON route, same-origin link, browser axe, keyboard focus, 세 viewport overflow, 12개 full-page baseline을 검증한다. 계획 03의 8개 component-slice baseline과 중복되지 않으며 둘 다 유지한다.

### Gate 6 — 전체 통합 검증

계획 05를 실행한다.

```text
token tests·generate·generated check
→ React tests
→ content·manifest tests와 manifest write/check
→ Astro check·build
→ Playwright route·link·a11y·viewport 검증
→ primitive color 및 workspace guardrails
→ 정적 artifact와 Figma evidence 검증
→ git diff·status 확인
→ GitHub Private readback
```

어떤 단계도 이전 단계의 실패를 숨기기 위해 건너뛰지 않는다.

## 최종 완료 기준

- 소개, 시작하기, 5개 Foundations, 4개 컴포넌트 문서가 정적 HTML로 생성된다.
- Icon, Badge, Button, TextField가 React와 Figma에 같은 이름·속성 의미로 존재한다.
- 네 컴포넌트 모두 unit, interaction, component-level axe smoke, browser axe, 모바일·데스크톱 시각 검토를 통과한다.
- token CSS·JSON과 component manifest가 원본에서 재현 가능하고 stale artifact가 없다.
- `/design-system/tokens.json`과 `/design-system/components.json`을 AI가 직접 읽을 수 있다.
- Figma Foundations 및 component QA 증거가 machine-readable JSON으로 남는다.
- Svelte와 React Native는 문서에서 `planned`로만 표시된다.
- npm 배포나 외부 호스팅 없이 로컬 build에서 전체 시스템을 탐색할 수 있다.
- 원격이 Private로 확인되기 전에는 push하지 않는다.

## 공식 구현 참고

- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Astro React integration](https://docs.astro.build/en/guides/integrations-guide/react/)
- [Astro MDX integration](https://docs.astro.build/en/guides/integrations-guide/mdx/)
- [Astro framework components and islands](https://docs.astro.build/en/guides/framework-components/)
- [Playwright web server](https://playwright.dev/docs/test-webserver)
- [Playwright screenshot testing](https://playwright.dev/docs/test-snapshots)
- [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing)

## 실행 선택

- **Subagent-Driven Development (권장):** 현재 세션에서 계획별 작업을 병렬화하되 공유 파일은 순차적으로 통합하고 각 task 후 검토한다.
- **Inline Execution:** 현재 세션에서 한 계획씩 순서대로 직접 실행한다.

두 방식 모두 위 Gate 순서, Figma 승인, Private push 금지를 동일하게 따른다.
