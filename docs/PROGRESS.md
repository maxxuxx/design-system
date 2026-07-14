# HDS v0.1.0 진행 상황

마지막 갱신: 2026-07-14 (KST)

## 릴리스 기준

- 정식명: `Haru Design System`
- 약칭: `HDS`
- 버전: `0.1.0`
- 작업 브랜치: `codex/hds-rebrand-v0-1`
- 저장소: [maxxuxx/design-system](https://github.com/maxxuxx/design-system)
- 문서: [hds.haru-dev.com](https://hds.haru-dev.com)
- Figma: [Haru Design System](https://www.figma.com/design/hNlju4j556mzi0G515UDwE)

## 구현 범위

- `@hds/tokens`
  - Primitive 91개와 Semantic 27개, 총 118개 token
  - CSS namespace `--hds-*`
  - self-hosted Pretendard Variable과 SIL OFL license
  - CSS·JSON 생성 및 stale artifact 검증
- `@hds/react`
  - React 컴포넌트 20개
  - class namespace `.hds-*`와 자동 접근성 ID `hds-*`
  - 컴포넌트명·props·exports·접근성 계약 유지
- `@hds/docs`
  - 30개 정적 HTML route
  - HDS 중앙 브랜드 설정, canonical, Open Graph, Twitter metadata
  - favicon, 180×180 touch icon, 1200×630 Open Graph image
  - `/design-system/tokens.json`, `/design-system/components.json`
  - manifest에서 계산하는 118개 token과 20개 component 수
- Figma
  - 같은 file key와 기존 Variable·Style·Component ID 유지
  - 6 collections, 116 Variables, 8 Text Styles, 2 Effect Styles
  - 27 pages, 5 owned Icon components, 19 component sets
  - 118개 token mapping(116개 Variable WEB syntax와 2개 Effect Style)을 HDS 기준으로 동기화
- guardrail
  - HDS v0.1.0 package graph과 `private: true` 검증
  - 현재 source·package·artifact·Figma evidence에서 폐기된 브랜드와 namespace 차단
  - `docs/superpowers/**`는 과거 실행 기록으로 검사에서 제외
  - 20개 component slice × mobile/desktop = Windows visual target 40개 고정

## 컴포넌트 상태

`Icon`, `Badge`, `Button`, `TextField`, `ScrollArea`, `Checkbox`, `RadioGroup`, `Switch`, `Textarea`, `Select`, `TextButton`, `IconButton`, `BoardRow`, `Tab`, `BottomSheet`, `Dialog`, `SearchField`, `ListRow`, `Toast`, `BottomCTA`는 모두 `preview`입니다.

## 검증 기준

```bash
pnpm install --frozen-lockfile
pnpm verify
```

HDS 전환 후 macOS 전체 검증 결과는 다음과 같습니다.

- Tokens: 26 tests
- React: 301 tests
- Docs unit: 38 tests
- Guardrail/artifact: 43 tests
- Static docs: 30 pages
- Browser: 586 passed, 197 platform/viewport-owned skips

Windows Chromium baseline workflow [run 29319319388](https://github.com/maxxuxx/design-system/actions/runs/29319319388)에서 다음 기준 이미지를 생성하고 대표 화면을 검토했습니다.

- Component slice: 40개(20 components × mobile/desktop)
- Full page: 15개(5 routes × mobile/tablet/desktop)

## 릴리스 체크리스트

- [x] package와 token namespace 전환
- [x] React class와 자동 ID namespace 전환
- [x] 문서 브랜드·metadata·asset 전환
- [x] HDS 브랜드 guardrail 추가
- [x] Figma 페이지 문구·118개 token mapping live 동기화와 readback
- [x] macOS `pnpm verify` 통과
- [ ] Figma 파일 제목을 `Haru Design System`으로 변경
- [x] Windows Chromium 누락 baseline 30개 생성·검토
- [ ] Windows Chromium component slice 40개와 full-page 15개 PR 재비교
- [ ] Linux·Windows CI와 Vercel Preview 통과
- [ ] Vercel 프로젝트명을 `haru-design-system`으로 변경
- [ ] `main` 병합 후 Production과 `hds.haru-dev.com` 최종 점검

## 후속 범위

- Figma Code Connect
- Svelte와 React Native 구현
- 컴포넌트 `stable` 승격
- npm scope 소유권 확인과 공개 release automation
