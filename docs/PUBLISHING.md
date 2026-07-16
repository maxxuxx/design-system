# npm 공개 절차

현재 `@hds/react`와 `@hds/tokens`는 배포용 artifact를 만들고 검증하지만 `private: true`로 잠겨 있습니다.

## 로컬 검증

```bash
pnpm install --frozen-lockfile
pnpm pack:check
pnpm verify
```

`pack:check`는 React ESM·타입 선언·21개 CSS 파일과 token CSS·JSON·92개 WOFF2 subset이 tarball에 포함되는지 확인합니다.

## 첫 공개

```bash
npm login
npm whoami
npm view @hds/tokens
npm view @hds/react
```

1. npm 계정의 2FA를 활성화하고 `@hds` scope에 공개 package를 생성할 권한이 있는지 확인합니다.
2. 별도 PR에서 두 package의 `private: true`와 private guardrail을 해제하고 전체 검증을 통과시킵니다.
3. 깨끗한 `main`에서 `@hds/tokens`, `@hds/react` 순서로 처음 공개합니다.

```bash
npm publish ./packages/tokens --access public
npm publish ./packages/react --access public
```

4. 빈 소비자 프로젝트에서 registry package를 설치해 runtime·type·CSS import를 다시 확인합니다.

처음 공개된 version은 다시 사용할 수 없으므로 각 publish 전에 package 이름, version, tarball 내용을 확인합니다.

## 후속 자동화

npm trusted publisher는 package가 registry에 처음 공개된 뒤 package별로 설정합니다.

1. `@hds/tokens`와 `@hds/react`의 npm 설정에서 이 저장소와 release workflow를 trusted publisher로 연결합니다.
2. release workflow는 GitHub-hosted runner, Node 22.14 이상, npm 11.5.1 이상과 `id-token: write` 권한을 사용합니다.
3. 다음 version부터 workflow로 publish하고 registry 소비자 검증을 release checklist에 포함합니다.
