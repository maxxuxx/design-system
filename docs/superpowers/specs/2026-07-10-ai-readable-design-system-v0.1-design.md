# AI-Readable Design System v0.1 설계서

- 상태: 사용자 검토 요청
- 작성일: 2026-07-10
- 저장소: `maxxuxx/design-system`
- 기준 경로: `C:\github\design-system`

## 1. 목표

v0.1은 npm 배포용 완성 라이브러리가 아니라, 사람과 AI가 디자인 규칙을 이해하고 참고할 수 있는 디자인 시스템의 첫 번째 동작 가능한 버전이다.

다음 세 가지를 하나의 체계로 제공한다.

1. Figma Foundations와 파일럿 컴포넌트
2. Toss Design System 문서처럼 탐색 가능한 정적 웹사이트
3. AI가 직접 읽을 수 있는 MDX, 디자인 토큰 JSON, 컴포넌트 manifest

v0.1에서 React는 인터랙티브 예제를 구현하기 위한 첫 프레임워크다. Svelte와 React Native는 같은 컴포넌트 계약을 기반으로 후속 버전에서 구현한다.

## 2. 대상 사용자

- Figma에서 제품 화면을 설계하는 디자이너
- React로 웹 또는 Electron 화면을 만드는 개발자
- 디자인 시스템의 규칙을 검색하고 적용하는 AI 에이전트
- 향후 Svelte 및 React Native 구현을 담당할 개발자

## 3. v0.1 범위

### 3.1 포함

- 모바일 우선 반응형 정적 문서 사이트
- 디자인 원칙 및 Getting Started
- Color, Typography, Spacing, Radius, Elevation Foundations
- Primitive 및 Semantic 디자인 토큰
- React 기반 파일럿 컴포넌트
  - Icon
  - Badge
  - Button
  - TextField
- 각 컴포넌트의 목적, 사용법, 상태, 접근성, API, 토큰 문서
- Figma 페이지 및 변수 구조 정의
- AI용 `tokens.json`과 `components.json`
- 원본 MDX 콘텐츠
- 모바일 및 데스크톱 viewport 검증

### 3.2 제외

- npm 또는 Private Registry 배포
- Svelte 컴포넌트 구현
- React Native 컴포넌트 구현
- Figma Code Connect 자동 게시
- Dark Mode
- 다중 브랜드
- 로그인 및 권한 시스템
- 문서 사이트의 외부 호스팅
- 자동 릴리스와 마이그레이션 자동화

Svelte와 React Native는 문서에서 `planned` 상태로 표시하며, v0.1의 공통 API를 검증한 뒤 별도 구현 단계로 진행한다.

## 4. 핵심 설계 결정

### 4.1 문서 사이트: Astro

문서 사이트는 Astro로 만든다.

선정 이유:

- 문서를 기본적으로 정적 HTML로 생성해 사람과 웹 크롤러가 읽기 쉽다.
- React 컴포넌트를 인터랙티브 island로 삽입할 수 있다.
- 후속 단계에서 Svelte 컴포넌트도 같은 사이트에 삽입할 수 있다.
- Markdown 및 MDX 콘텐츠와 파일 기반 URL을 사용할 수 있다.
- 문서에 필요하지 않은 JavaScript를 기본적으로 전송하지 않는다.

Astro는 문서의 호스트일 뿐 디자인 시스템의 소비자용 UI 프레임워크로 취급하지 않는다.

### 4.2 콘텐츠 원본: MDX

사람에게 보이는 컴포넌트 설명은 MDX로 관리한다. 각 MDX 파일의 frontmatter는 빌드 시 검증한다.

```text
src/content/components/button.mdx
src/content/components/badge.mdx
```

각 문서는 다음 정보를 가진다.

```yaml
name: Button
description: 사용자가 주요 행동을 실행할 때 사용합니다.
status: preview
figmaUrl: ""
frameworks:
  react: preview
  svelte: planned
  reactNative: planned
```

`figmaUrl`은 Figma 파일이 생성되기 전까지 빈 문자열을 허용한다. Figma 컴포넌트가 만들어진 컴포넌트는 배포 빌드 전에 URL이 반드시 존재해야 한다.

### 4.3 AI용 원본

AI는 시각적 페이지를 해석하지 않아도 다음 파일을 직접 읽을 수 있어야 한다.

```text
/design-system/tokens.json
/design-system/components.json
/components/button/
/components/badge/
```

`tokens.json`은 토큰 이름, 값, 타입, 설명을 포함한다. `components.json`은 컴포넌트 이름, 목적, 지원 상태, variants, sizes, states, 접근성 요약, 문서 URL을 포함한다.

MDX, JSON, URL은 같은 이름을 사용한다. 예를 들어 Figma `Button`, React `Button`, 문서 `/components/button/`, manifest `Button`은 동일한 개념을 가리킨다.

### 4.4 패키지 경계 유지

npm에 배포하지 않더라도 코드는 나중에 추출할 수 있는 경계로 작성한다.

```text
apps/docs              Astro 문서 사이트
packages/tokens        토큰 원본과 변환 스크립트
packages/react         React 파일럿 컴포넌트
```

v0.1에서 `packages/svelte`와 `packages/react-native`는 만들지 않는다.

## 5. 저장소 구조

```text
design-system/
├─ apps/
│  └─ docs/
│     ├─ public/
│     │  └─ design-system/
│     └─ src/
│        ├─ components/
│        ├─ content/
│        │  ├─ foundations/
│        │  └─ components/
│        ├─ layouts/
│        ├─ pages/
│        └─ styles/
├─ packages/
│  ├─ tokens/
│  │  ├─ src/
│  │  ├─ scripts/
│  │  └─ tests/
│  └─ react/
│     └─ src/
│        ├─ icon/
│        ├─ badge/
│        ├─ button/
│        └─ text-field/
├─ figma/
│  └─ README.md
├─ docs/
│  ├─ decisions/
│  └─ superpowers/
│     ├─ specs/
│     └─ plans/
├─ package.json
├─ pnpm-workspace.yaml
└─ tsconfig.base.json
```

## 6. 디자인 방향

- 모바일 화면에서 즉시 이해되는 위계를 우선한다.
- 넉넉한 여백, 높은 본문 가독성, 절제된 강조색을 사용한다.
- 한 화면의 주 행동은 하나로 명확하게 만든다.
- 카드와 구획은 정보 그룹을 설명할 때만 사용한다.
- 그림자와 border는 콘텐츠 계층을 설명하는 최소 수준으로 사용한다.
- Toss의 로고, 일러스트레이션, 화면, 토큰 값을 복제하지 않는다.

실제 색상 및 타이포그래피 값은 Figma Foundation 시각 검토에서 승인한 뒤 컴포넌트 구현을 시작한다. 별도 브랜드 글꼴이 제공되지 않으면 v0.1은 시스템 글꼴 스택을 사용한다.

## 7. 토큰 모델

### 7.1 Primitive

```text
color/neutral/*
color/blue/*
color/red/*
color/green/*
space/*
radius/*
font/size/*
font/weight/*
font/line-height/*
elevation/*
```

### 7.2 Semantic

```text
color/bg/canvas
color/bg/surface
color/bg/subtle
color/text/primary
color/text/secondary
color/text/disabled
color/border/default
color/action/primary
color/action/primary-pressed
color/status/danger
color/status/success
```

Semantic 토큰은 Primitive 토큰을 alias한다. React 컴포넌트와 문서 사이트는 Primitive 색상 값을 직접 사용하지 않는다.

### 7.3 생성 결과

토큰 원본에서 다음을 생성한다.

- `packages/tokens/dist/tokens.css`
- `packages/tokens/dist/tokens.json`
- `apps/docs/public/design-system/tokens.json`

생성 파일은 직접 수정하지 않는다.

## 8. Figma 구조

```text
00 Cover
01 Principles
02 Getting Started
03 Foundations
   ├─ Colors
   ├─ Typography
   ├─ Spacing
   ├─ Radius
   └─ Elevation
04 Components
   ├─ Icon
   ├─ Badge
   ├─ Button
   └─ TextField
90 Native Differences
99 Deprecated
```

Figma Variables는 `Primitives`, `Semantic Color`, `Spacing`, `Typography`, `Radius` collection으로 구성한다. Semantic Color는 Primitive를 alias한다.

React와 Svelte는 같은 웹 디자인을 사용하므로 프레임워크별 Figma 컴포넌트를 만들지 않는다. React Native에서 실제 시각 또는 동작 차이가 발생할 때만 Native 차이를 기록한다.

## 9. 파일럿 컴포넌트 순서

```text
Icon → Badge → Button → TextField
```

각 컴포넌트는 다음 순서로 완성한다.

1. 목적과 사용 및 금지 사례 정의
2. 공통 속성, 상태, 접근성 계약 정의
3. Figma 컴포넌트 설계
4. React 구현
5. Unit, interaction, 접근성 테스트
6. 모바일 및 데스크톱 시각 검증
7. MDX 문서와 manifest 생성

다음 컴포넌트는 이전 컴포넌트의 미검증된 API에 의존하지 않는다.

## 10. 컴포넌트 문서 템플릿

모든 컴포넌트 페이지는 같은 순서를 따른다.

1. 이름과 한 줄 목적
2. 인터랙티브 예제
3. 사용해야 할 때
4. 사용하지 말아야 할 때
5. Anatomy
6. Sizes와 Variants
7. States와 동작
8. 모바일 및 데스크톱 차이
9. 접근성
10. React 코드 예제
11. API
12. 사용 토큰
13. Figma 링크
14. 프레임워크별 지원 상태

## 11. 테스트 및 검증

### 11.1 토큰

- JSON 구조 검증
- 토큰 이름 중복 검사
- 존재하지 않는 alias 검사
- alias 순환 참조 검사
- CSS 및 JSON 생성 결과 snapshot 검사

### 11.2 React 컴포넌트

- Props와 기본 상태 Unit 테스트
- 클릭, 입력, disabled, loading interaction 테스트
- 키보드 탐색 테스트
- 자동 접근성 검사
- 모바일 및 데스크톱 viewport 시각 검증

### 11.3 문서 사이트

- production build 성공
- 모든 MDX frontmatter schema 검증
- 모든 컴포넌트 페이지 정적 생성
- `tokens.json` 및 `components.json` 생성
- 내부 링크 검사
- 모바일, 태블릿, 데스크톱 브라우저 검증

### 11.4 Figma

- 모든 시각 값의 Variable binding 확인
- 컴포넌트 속성과 React props 이름 비교
- 컴포넌트별 screenshot 검토
- 하드코딩된 fill, stroke, spacing, radius 검사

## 12. 실패 정책

- 토큰 검증 실패 시 문서 사이트 빌드를 중단한다.
- MDX frontmatter가 schema와 다르면 해당 페이지를 생성하지 않고 빌드를 실패시킨다.
- 컴포넌트 manifest와 실제 MDX 페이지가 다르면 빌드를 실패시킨다.
- 접근성 기본 동작이 검증되지 않은 컴포넌트는 `stable`로 표시하지 않는다.
- Figma가 없는 컴포넌트는 `figmaUrl`을 비워 둘 수 있지만 상태를 `stable`로 표시할 수 없다.
- 자동 생성된 JSON과 CSS는 원본 토큰 또는 생성 스크립트를 통해서만 수정한다.

## 13. 공개 범위와 AI 접근

- Git 저장소는 Private 운영을 기본으로 한다.
- 문서 사이트는 v0.1에서 로컬 build까지만 검증한다.
- 저장소에 접근 가능한 AI는 MDX, JSON, TypeScript를 직접 읽을 수 있다.
- 웹 탐색만 가능한 AI가 Private 문서에 접근하려면 인증된 브라우저 또는 연결 도구가 필요하다.
- Private Figma는 해당 사용자 권한을 가진 Figma 연결을 통해 접근한다.
- GitHub PAT, 배포 토큰, Figma access token 같은 인증 정보는 저장소에 커밋하지 않는다.
- 디자인 토큰 JSON과 컴포넌트 manifest는 제품 산출물이므로 저장소에서 버전 관리한다.

현재 원격 저장소가 Public이면 첫 프로젝트 작업을 push하기 전에 Private로 변경해야 한다.

## 14. v0.1 완료 조건

- 문서 사이트가 정적 production build를 생성한다.
- 소개, Getting Started, Foundations, 파일럿 컴포넌트 페이지가 존재한다.
- 파일럿 네 컴포넌트가 Figma와 React에 존재한다.
- 모든 React 컴포넌트가 모바일 및 데스크톱에서 검증된다.
- `tokens.json`과 `components.json`이 빌드 결과에 포함된다.
- AI가 컴포넌트의 목적, 속성, 상태, 접근성, 토큰을 JSON 또는 MDX에서 확인할 수 있다.
- Svelte와 React Native의 후속 구현 상태가 문서에 표시된다.
- npm 배포 없이 로컬 문서 사이트에서 전체 시스템을 탐색할 수 있다.

## 15. 후속 단계

v0.1 검증 후 다음 순서로 확장한다.

1. React 파일럿 API 안정화
2. Svelte 파일럿 구현
3. React Native 파일럿 구현
4. 실제 소비 프로젝트 통합
5. Private Registry 필요성 재평가
6. Code Connect 및 배포 자동화 검토

## 16. 참고 자료

- [Toss Design System Mobile](https://tossmini-docs.toss.im/tds-mobile/)
- [Astro Front-end Framework Integrations](https://docs.astro.build/en/guides/framework-components/)
- [Astro Components](https://docs.astro.build/en/basics/astro-components/)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Design Tokens Community Group](https://www.designtokens.org/)
- [Figma Variables](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)
- [WCAG 2 Overview](https://www.w3.org/WAI/standards-guidelines/wcag/)
