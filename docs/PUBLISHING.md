# npm 공개 절차

현재 `@hds/react`와 `@hds/tokens`는 배포용 artifact를 만들고 검증하지만 `private: true`로 잠겨 있습니다.

## 로컬 검증

```bash
pnpm install --frozen-lockfile
pnpm pack:check
pnpm verify
```

`pack:check`는 React ESM·타입 선언·21개 CSS 파일과 token CSS·JSON·92개 WOFF2 subset이 tarball에 포함되는지 확인합니다.

## 첫 공개 전 확인

```bash
npm login
npm whoami
npm view @hds/tokens
npm view @hds/react
```

1. npm에서 `@hds` scope의 소유권과 공개 package 생성 권한을 확인합니다.
2. npm trusted publishing을 GitHub Actions에 연결합니다.
3. 별도 PR에서 두 package의 `private: true`와 private guardrail을 해제합니다.
4. `@hds/tokens`, `@hds/react` 순서로 `0.1.0`을 공개합니다.
5. 빈 소비자 프로젝트에서 두 tarball과 registry package를 각각 설치해 비교 검증합니다.
