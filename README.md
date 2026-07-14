# Haru Design System

Haru Design System(HDS)은 Haru의 제품 경험을 일관되게 만드는 디자인 시스템입니다.

토큰, 접근 가능한 React 컴포넌트, Figma 라이브러리와 AI용 메타데이터를 하나의 계약으로 연결합니다.

- 버전: `0.1.0`
- 문서: [hds.haru-dev.com](https://hds.haru-dev.com)
- Figma: [Haru Design System](https://www.figma.com/design/hNlju4j556mzi0G515UDwE)
- 저장소: [maxxuxx/design-system](https://github.com/maxxuxx/design-system)
- 공개 상태: 모든 workspace package는 `private: true`이며 npm에는 배포하지 않습니다.

## Packages

| Package | 역할 |
| --- | --- |
| `@hds/workspace` | monorepo 명령과 검증 진입점 |
| `@hds/tokens` | 118개 token의 CSS·JSON과 self-hosted Pretendard |
| `@hds/react` | 접근 가능한 React 컴포넌트 20개 |
| `@hds/docs` | Astro 기반 정적 문서와 interactive example |

컴포넌트 API와 논리 token 이름은 유지되며, 기술 namespace는 `@hds/*`, `--hds-*`, `.hds-*`, `hds-*`를 사용합니다.

## 시작하기

Node.js 24 이상과 Corepack이 필요합니다.

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

전체 계약은 다음 명령으로 검증합니다.

```bash
corepack pnpm verify
```

## 공개 artifact

문서 배포에는 사람이 읽는 페이지와 AI가 읽는 JSON을 함께 포함합니다.

- `/design-system/tokens.json`
- `/design-system/components.json`

20개 컴포넌트는 HDS v0.1.0에서 모두 `preview` 상태입니다. npm 공개, `stable` 승격, Code Connect, Svelte와 React Native 구현은 후속 범위입니다.
