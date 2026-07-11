# Workspace Foundations and Token Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 고정된 pnpm workspace를 만들고, 106개 후보 디자인 토큰을 검증해 CSS와 두 개의 동일한 AI용 JSON 산출물로 재현하는 foundation pipeline을 완성한다.

**Architecture:** `packages/tokens/src/primitives.tokens.json`과 `packages/tokens/src/semantic.tokens.json`만 사람이 수정하는 토큰 원본이며, 순수 함수가 schema·중복·alias·cycle을 검증하고 입력 순서대로 값을 해석한다. 하나의 CLI가 메모리에서 CSS와 JSON을 만든 뒤 `--write`에서만 세 산출물을 쓰고 `--check`에서는 byte 비교만 수행한다. 이 계획은 workspace와 token pipeline만 소유하며 Astro 구현, React 구현, Figma 쓰기, 배포는 후속 계획에 넘긴다.

**Tech Stack:** Node.js 24.15.0, pnpm 11.11.0, TypeScript 7.0.2, Vitest 4.1.10, tsx 4.23.0, Zod 4.4.3, PowerShell on Windows.

## Global Constraints

- 기준 설계서는 `docs/superpowers/specs/2026-07-10-ai-readable-design-system-v0.1-design.md`이고 상위 실행 순서는 `docs/superpowers/plans/2026-07-10-ai-readable-design-system-v0.1.md`다.
- 설계서와 계획서가 아직 untracked라면 base checkout에서 계획 문서만 `docs: add design system v0.1 plan`으로 로컬 커밋한 뒤 `superpowers:using-git-worktrees`로 `codex/design-system-v0.1` worktree를 만든다. 이 bootstrap 단계에서는 push하지 않고 branch push/integration을 상위 로드맵에 남긴다.
- `maxxuxx/design-system` 원격은 의도적으로 `PUBLIC`이다. `gh repo view maxxuxx/design-system --json visibility,isPrivate`의 예상 결과 `{"isPrivate":false,"visibility":"PUBLIC"}`는 유효하며 로컬 수정, 커밋, 상위 로드맵의 push, v0.1 완료를 막지 않는다.
- 루트와 `@maxxuxx/tokens`, `@maxxuxx/react`, `@maxxuxx/docs`는 모두 `"private": true`다. `npm publish`, registry 설정, Changesets, release workflow, 외부 호스팅을 추가하지 않는다.
- pnpm workspace package 경계는 `apps/docs`, `packages/tokens`, `packages/react` 세 개뿐이다. `packages/svelte`와 `packages/react-native`는 만들지 않는다.
- 이 계획에서는 `apps/docs/package.json`과 `packages/react/package.json`만 후속 계획의 설치 경계로 만든다. Astro/React source, Figma metadata, `tooling/verification`은 만들지 않는다.
- 토큰 이름, 값, 타입, 설명은 원본 JSON에 있고 생성된 `packages/tokens/dist/tokens.css`, `packages/tokens/dist/tokens.json`, `apps/docs/public/design-system/tokens.json`은 직접 수정하지 않는다.
- semantic 토큰은 primitive 토큰을 alias한다. React와 문서 source는 primitive 색상 변수 `--ds-color-neutral-`, `--ds-color-blue-`, `--ds-color-red-`, `--ds-color-green-`을 Foundation 시각화 밖에서 참조하지 않는다.
- CSS 변수 이름은 정확히 `--ds-${name.replaceAll('/', '-')}`이고 alias 문법은 정확히 `{color/neutral/50}`다.
- JSON 산출물은 `{"schemaVersion":1,"tokens":ResolvedToken[]}` 계약을 따르며 원본 `value`와 최종 `resolvedValue`를 함께 보존한다.
- 모든 hand-authored JSON/TypeScript와 generator 출력은 UTF-8이다. generator 출력은 LF와 마지막 newline을 강제해 Windows checkout 위치와 무관하게 같은 bytes를 만든다.
- Candidate Foundation 값은 이 계획에서 코드 원본으로 먼저 커밋한다. Figma Foundation 승인에서 값이 바뀌면 반드시 source JSON을 먼저 수정하고 세 산출물을 다시 생성한다.
- 이 계획의 완료 게이트는 token package의 test, check, generate, stale check다. 아직 구현되지 않은 docs manifest와 React harness를 호출하는 루트 `verify`는 계획 05 전까지 전체 성공 조건으로 사용하지 않는다.

---

## File Map

### Workspace scaffold

- Create: `.gitignore` — 설치물, site build, test report, local secret 제외.
- Create: `.node-version` — Node.js 24.15.0 고정.
- Create: `package.json` — private workspace 이름과 상위 명령 고정.
- Create: `pnpm-workspace.yaml` — `apps/*`와 `packages/*`만 탐색.
- Create: `tsconfig.base.json` — strict, no-emit TypeScript 공통값.
- Generate: `pnpm-lock.yaml` — pnpm 11.11.0이 exact manifest에서 생성하며 직접 작성하지 않음.
- Create: `packages/react/package.json` — 계획 03이 사용할 private package 경계.
- Create: `apps/docs/package.json` — 계획 02가 사용할 private package 경계.

### Token package

- Create: `packages/tokens/package.json` — token package exports와 명령.
- Create: `packages/tokens/tsconfig.json` — token source, CLI, test type-check 범위.
- Create: `packages/tokens/vitest.config.ts` — Node 환경 token test 수집.
- Create: `packages/tokens/src/types.ts` — `TokenDefinition`과 `ResolvedToken` 계약.
- Create: `packages/tokens/src/primitives.tokens.json` — primitive 후보 80개.
- Create: `packages/tokens/src/semantic.tokens.json` — semantic alias 26개.
- Create: `packages/tokens/src/validate.ts` — shape, value type, duplicate, alias, cycle 검증.
- Create: `packages/tokens/src/generate.ts` — deterministic resolution, CSS/JSON rendering.
- Create: `packages/tokens/scripts/tokens.ts` — `--write`와 read-only `--check` CLI.
- Create: `packages/tokens/tests/validate.test.ts` — validation TDD.
- Create: `packages/tokens/tests/generate.test.ts` — rendering snapshots, public JSON parity, semantic-color guard.
- Generate and commit: `packages/tokens/dist/tokens.css` — 106개 CSS custom property.
- Generate and commit: `packages/tokens/dist/tokens.json` — AI token JSON.
- Generate and commit: `apps/docs/public/design-system/tokens.json` — dist JSON과 byte-identical public copy.

## Locked Interfaces

```ts
export type TokenType =
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontWeight'
  | 'shadow';

export interface TokenDefinition {
  name: string;
  type: TokenType;
  kind: 'primitive' | 'semantic';
  value: string | number;
  description: string;
}

export interface ResolvedToken extends TokenDefinition {
  cssVariable: `--ds-${string}`;
  resolvedValue: string | number;
}
```

- `validateTokens(tokens: TokenDefinition[]): Map<string, TokenDefinition>`
- `resolveTokens(tokens: TokenDefinition[]): ResolvedToken[]`
- `renderCss(tokens: ResolvedToken[]): string`
- `renderJson(tokens: ResolvedToken[]): string`
- `@maxxuxx/tokens/tokens.css` resolves to `packages/tokens/dist/tokens.css`.
- `@maxxuxx/tokens/tokens.json` resolves to `packages/tokens/dist/tokens.json`.
- Dimension values are numbers in JSON and `px` in CSS; font weights remain unitless; aliases render as computed `var(--ds-token-name)` references in CSS.
- `resolvedValue` recursively resolves to the final primitive value while `value` keeps the original alias string.

### Task 1: Create the private pnpm workspace

**Files:**
- Create: `.gitignore`
- Create: `.node-version`
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `packages/tokens/package.json`
- Create: `packages/react/package.json`
- Create: `apps/docs/package.json`
- Generate: `pnpm-lock.yaml`

**Interfaces:**
- Produces: workspace names `@maxxuxx/design-system-workspace`, `@maxxuxx/tokens`, `@maxxuxx/react`, `@maxxuxx/docs`.
- Produces: root commands `dev`, `build`, `check`, `test`, `test:e2e`, `generated:check`, `verify`.
- Produces: package-manager and dependency versions consumed unchanged by plans 02 and 03.

- [ ] **Step 1: Confirm the isolated branch and public repository readback**

Run from the worktree root:

```powershell
git rev-parse --show-toplevel
git rev-parse --git-dir
git rev-parse --git-common-dir
git branch --show-current
gh repo view maxxuxx/design-system --json visibility,isPrivate
```

Expected:

- `git rev-parse --show-toplevel` is the isolated worktree, not the base checkout.
- `git rev-parse --git-dir` and `git rev-parse --git-common-dir` differ, proving it is a linked worktree.
- branch output is exactly `codex/design-system-v0.1`.
- GitHub output is `{"isPrivate":false,"visibility":"PUBLIC"}`. This is the expected, valid state and does not block push or local commits.

If the branch or worktree assertions fail, stop before creating files. Public visibility is intentional; do not change it from this plan.

- [ ] **Step 2: Create the exact root files**

Create `.gitignore` with this complete content:

```gitignore
node_modules/
.astro/
apps/docs/dist/
coverage/
playwright-report/
test-results/
*.local
.env
.env.*
!.env.example
figma/.state/
```

Create `.node-version` with this complete content:

```text
24.15.0
```

Create root `package.json` with this complete content:

```json
{
  "name": "@maxxuxx/design-system-workspace",
  "private": true,
  "version": "0.0.0",
  "packageManager": "pnpm@11.11.0",
  "engines": {
    "node": ">=24.0.0"
  },
  "scripts": {
    "dev": "pnpm --filter @maxxuxx/docs dev",
    "build": "pnpm --filter @maxxuxx/docs build",
    "check": "pnpm -r --if-present check",
    "test": "pnpm -r --if-present test",
    "test:e2e": "pnpm --filter @maxxuxx/docs test:e2e",
    "generated:check": "pnpm --filter @maxxuxx/tokens generated:check && pnpm --filter @maxxuxx/docs manifest:check",
    "verify": "pnpm run check && pnpm run test && pnpm run generated:check && pnpm run build && pnpm run test:e2e"
  }
}
```

Create `pnpm-workspace.yaml` with this complete content:

```yaml
packages:
  - apps/*
  - packages/*
```

Create `tsconfig.base.json` with this complete content:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

- [ ] **Step 3: Create the exact workspace package manifests**

Create `packages/tokens/package.json` with this complete content:

```json
{
  "name": "@maxxuxx/tokens",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "exports": {
    "./tokens.css": "./dist/tokens.css",
    "./tokens.json": "./dist/tokens.json"
  },
  "scripts": {
    "tokens:generate": "tsx scripts/tokens.ts --write",
    "generated:check": "tsx scripts/tokens.ts --check",
    "check": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "@types/node": "26.1.1",
    "tsx": "4.23.0",
    "typescript": "7.0.2",
    "vitest": "4.1.10",
    "zod": "4.4.3"
  }
}
```

Create `packages/react/package.json` with this complete content:

```json
{
  "name": "@maxxuxx/react",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "sideEffects": ["./src/styles.css"],
  "exports": {
    ".": "./src/index.ts",
    "./styles.css": "./src/styles.css"
  },
  "scripts": {
    "check": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "peerDependencies": {
    "react": ">=19.2.0 <20",
    "react-dom": ">=19.2.0 <20"
  },
  "devDependencies": {
    "@testing-library/dom": "10.4.1",
    "@testing-library/jest-dom": "6.9.1",
    "@testing-library/react": "16.3.2",
    "@testing-library/user-event": "14.6.1",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "axe-core": "4.12.1",
    "jsdom": "29.1.1",
    "react": "19.2.7",
    "react-dom": "19.2.7",
    "typescript": "7.0.2",
    "vitest": "4.1.10"
  }
}
```

Create `apps/docs/package.json` with this complete content:

```json
{
  "name": "@maxxuxx/docs",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "pnpm --filter @maxxuxx/tokens tokens:generate && astro dev",
    "check": "astro check",
    "test": "vitest run",
    "test:unit": "vitest run",
    "manifest:write": "tsx scripts/component-manifest.ts --write",
    "manifest:check": "tsx scripts/component-manifest.ts --check",
    "manifest:release-check": "tsx scripts/component-manifest.ts --check --require-figma",
    "build": "pnpm --filter @maxxuxx/tokens generated:check && pnpm manifest:check && astro check && astro build",
    "preview": "astro preview",
    "preview:e2e": "pnpm run build && astro preview --host 127.0.0.1 --port 4173",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@astrojs/mdx": "7.0.2",
    "@astrojs/react": "6.0.1",
    "@maxxuxx/react": "workspace:*",
    "@maxxuxx/tokens": "workspace:*",
    "astro": "7.0.7",
    "gray-matter": "4.0.3",
    "react": "19.2.7",
    "react-dom": "19.2.7"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.9",
    "@axe-core/playwright": "4.12.1",
    "@playwright/test": "1.61.1",
    "@types/node": "26.1.1",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "tsx": "4.23.0",
    "typescript": "7.0.2",
    "vitest": "4.1.10"
  }
}
```

- [ ] **Step 4: Install from the exact manifests**

Run:

```powershell
corepack pnpm install
corepack pnpm --filter @maxxuxx/docs exec playwright install chromium
```

Expected:

- pnpm reports version `11.11.0` from the root `packageManager` field.
- `pnpm-lock.yaml` is generated at the repository root.
- installation exits 0 with no unresolved peer dependency warning.
- one Chromium binary is installed in Playwright's user cache; no browser binary is added to Git.

`pnpm-lock.yaml` is a generated resolver artifact. Do not paste or hand-edit it; its complete content must come from this exact `pnpm@11.11.0` install against the eight exact dependency blocks above.

- [ ] **Step 5: Verify workspace and privacy guardrails**

Run:

```powershell
corepack pnpm list -r --depth -1
$manifests = @(
  'package.json',
  'packages/tokens/package.json',
  'packages/react/package.json',
  'apps/docs/package.json'
)
$invalid = $manifests | Where-Object {
  -not ((Get-Content -Raw -Encoding UTF8 $_ | ConvertFrom-Json).private)
}
if ($invalid.Count -ne 0) {
  throw "Non-private manifests: $($invalid -join ', ')"
}
```

Expected: `pnpm list` shows the root plus exactly `@maxxuxx/tokens`, `@maxxuxx/react`, and `@maxxuxx/docs`; the PowerShell guard emits no output and exits 0.

- [ ] **Step 6: Commit the workspace scaffold locally**

Run:

```powershell
git add .gitignore .node-version package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json apps/docs/package.json packages/tokens/package.json packages/react/package.json
git diff --cached --check
git commit -m "chore: scaffold private design system workspace"
```

Expected: `git diff --cached --check` emits no output and the Conventional Commit succeeds. Do not push.

### Task 2: Build schema, alias, and cycle validation with TDD

**Files:**
- Create: `packages/tokens/tsconfig.json`
- Create: `packages/tokens/vitest.config.ts`
- Create: `packages/tokens/src/types.ts`
- Create: `packages/tokens/tests/validate.test.ts`
- Create: `packages/tokens/src/validate.ts`

**Interfaces:**
- Produces: the exact `TokenType`, `TokenDefinition`, and `ResolvedToken` contracts in “Locked Interfaces.”
- Produces: `validateTokens(tokens: TokenDefinition[]): Map<string, TokenDefinition>`.
- Enforces: strict object shape, non-empty description, value type, duplicate names, semantic aliases, existing targets, equal alias types, and full-path cycle errors.

- [ ] **Step 1: Add the token test configuration and public types**

Create `packages/tokens/tsconfig.json` with this complete content:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["node"]
  },
  "include": [
    "src/**/*.ts",
    "scripts/**/*.ts",
    "tests/**/*.ts"
  ]
}
```

Create `packages/tokens/vitest.config.ts` with this complete content:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

Create `packages/tokens/src/types.ts` with this complete content:

```ts
export type TokenType =
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontWeight'
  | 'shadow';

export interface TokenDefinition {
  name: string;
  type: TokenType;
  kind: 'primitive' | 'semantic';
  value: string | number;
  description: string;
}

export interface ResolvedToken extends TokenDefinition {
  cssVariable: `--ds-${string}`;
  resolvedValue: string | number;
}
```

- [ ] **Step 2: Write the complete failing validation tests**

Create `packages/tokens/tests/validate.test.ts` with this complete content:

```ts
import { describe, expect, it } from 'vitest';

import type { TokenDefinition, TokenType } from '../src/types.js';
import { validateTokens } from '../src/validate.js';

function token(
  name: string,
  type: TokenType,
  kind: TokenDefinition['kind'],
  value: string | number,
  description = '검증 동작을 확인하는 테스트 토큰입니다.',
): TokenDefinition {
  return { name, type, kind, value, description };
}

describe('validateTokens', () => {
  it('accepts a valid primitive and semantic alias pair', () => {
    const tokens = [
      token('color/blue/600', 'color', 'primitive', '#245BE0'),
      token(
        'color/action/primary',
        'color',
        'semantic',
        '{color/blue/600}',
      ),
    ];

    const result = validateTokens(tokens);

    expect([...result.keys()]).toEqual([
      'color/blue/600',
      'color/action/primary',
    ]);
  });

  it('rejects duplicate names', () => {
    const tokens = [
      token('color/blue/600', 'color', 'primitive', '#245BE0'),
      token('color/blue/600', 'color', 'primitive', '#245BE0'),
    ];

    expect(() => validateTokens(tokens)).toThrow(
      'Duplicate token name: color/blue/600',
    );
  });

  it('rejects an alias whose target does not exist', () => {
    const tokens = [
      token(
        'color/action/primary',
        'color',
        'semantic',
        '{color/blue/600}',
      ),
    ];

    expect(() => validateTokens(tokens)).toThrow(
      'Unknown alias target "color/blue/600" referenced by "color/action/primary".',
    );
  });

  it('rejects aliases that change token type', () => {
    const tokens = [
      token('color/blue/600', 'color', 'primitive', '#245BE0'),
      token('space/action', 'dimension', 'semantic', '{color/blue/600}'),
    ];

    expect(() => validateTokens(tokens)).toThrow(
      'Alias type mismatch: "space/action" (dimension) references "color/blue/600" (color).',
    );
  });

  it('rejects a raw semantic color', () => {
    const tokens = [
      token('color/action/primary', 'color', 'semantic', '#245BE0'),
    ];

    expect(() => validateTokens(tokens)).toThrow(
      'Semantic color token "color/action/primary" must use an alias.',
    );
  });

  it('rejects an alias cycle with the full path', () => {
    const tokens = [
      token('a', 'color', 'semantic', '{b}'),
      token('b', 'color', 'semantic', '{a}'),
    ];

    expect(() => validateTokens(tokens)).toThrow(
      'Alias cycle: a -> b -> a',
    );
  });

  it('rejects an empty description', () => {
    const tokens = [
      token('color/blue/600', 'color', 'primitive', '#245BE0', '   '),
    ];

    expect(() => validateTokens(tokens)).toThrow();
  });
});
```

- [ ] **Step 3: Run the validation tests and observe RED**

Run:

```powershell
corepack pnpm --filter @maxxuxx/tokens test -- validate.test.ts
```

Expected: exit 1; Vitest reports that `../src/validate.js` cannot be resolved. A passing or zero-test result is not acceptable.

- [ ] **Step 4: Implement the minimum complete validator**

Create `packages/tokens/src/validate.ts` with this complete content:

```ts
import { z } from 'zod';

import type { TokenDefinition } from './types.js';

const aliasPattern = /^\{([^{}]+)\}$/;
const namePattern = /^[a-z0-9]+(?:[/-][a-z0-9]+)*$/;

const tokenDefinitionSchema = z
  .object({
    name: z.string().regex(namePattern),
    type: z.enum([
      'color',
      'dimension',
      'fontFamily',
      'fontWeight',
      'shadow',
    ]),
    kind: z.enum(['primitive', 'semantic']),
    value: z.union([z.string(), z.number()]),
    description: z.string().trim().min(1),
  })
  .strict();

const tokenArraySchema = z.array(tokenDefinitionSchema);

function aliasTarget(value: string | number): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  return aliasPattern.exec(value)?.[1] ?? null;
}

function validatePrimitiveValue(token: TokenDefinition): void {
  if (aliasTarget(token.value) !== null) {
    throw new Error(
      `Primitive token "${token.name}" must contain a raw value.`,
    );
  }

  const expectsNumber =
    token.type === 'dimension' || token.type === 'fontWeight';

  if (expectsNumber && typeof token.value !== 'number') {
    throw new Error(
      `Primitive token "${token.name}" of type ${token.type} must be numeric.`,
    );
  }

  if (!expectsNumber && typeof token.value !== 'string') {
    throw new Error(
      `Primitive token "${token.name}" of type ${token.type} must be a string.`,
    );
  }
}

export function validateTokens(
  tokens: TokenDefinition[],
): Map<string, TokenDefinition> {
  const parsedTokens: TokenDefinition[] = tokenArraySchema.parse(tokens);
  const byName = new Map<string, TokenDefinition>();

  for (const token of parsedTokens) {
    if (byName.has(token.name)) {
      throw new Error(`Duplicate token name: ${token.name}`);
    }

    byName.set(token.name, token);
  }

  for (const token of byName.values()) {
    const targetName = aliasTarget(token.value);

    if (token.kind === 'primitive') {
      validatePrimitiveValue(token);
      continue;
    }

    if (targetName === null) {
      const label = token.type === 'color' ? 'Semantic color token' : 'Semantic token';
      throw new Error(`${label} "${token.name}" must use an alias.`);
    }

    const target = byName.get(targetName);
    if (target === undefined) {
      throw new Error(
        `Unknown alias target "${targetName}" referenced by "${token.name}".`,
      );
    }

    if (target.type !== token.type) {
      throw new Error(
        `Alias type mismatch: "${token.name}" (${token.type}) references "${target.name}" (${target.type}).`,
      );
    }
  }

  const state = new Map<string, 'visiting' | 'visited'>();
  const stack: string[] = [];

  const visit = (name: string): void => {
    const currentState = state.get(name);
    if (currentState === 'visited') {
      return;
    }

    if (currentState === 'visiting') {
      const cycleStart = stack.indexOf(name);
      const cycle = [...stack.slice(cycleStart), name];
      throw new Error(`Alias cycle: ${cycle.join(' -> ')}`);
    }

    state.set(name, 'visiting');
    stack.push(name);

    const token = byName.get(name);
    if (token === undefined) {
      throw new Error(`Token disappeared during validation: ${name}`);
    }

    const targetName = aliasTarget(token.value);
    if (targetName !== null) {
      visit(targetName);
    }

    stack.pop();
    state.set(name, 'visited');
  };

  for (const name of byName.keys()) {
    visit(name);
  }

  return byName;
}
```

- [ ] **Step 5: Run validation tests and observe GREEN**

Run:

```powershell
corepack pnpm --filter @maxxuxx/tokens test -- validate.test.ts
```

Expected: one test file and seven tests pass; exit 0.

### Task 3: Add the exact candidate sources and deterministic artifacts with TDD

**Files:**
- Create: `packages/tokens/src/primitives.tokens.json`
- Create: `packages/tokens/src/semantic.tokens.json`
- Create: `packages/tokens/tests/generate.test.ts`
- Create: `packages/tokens/src/generate.ts`
- Create: `packages/tokens/scripts/tokens.ts`
- Generate: `packages/tokens/dist/tokens.css`
- Generate: `packages/tokens/dist/tokens.json`
- Generate: `apps/docs/public/design-system/tokens.json`

**Interfaces:**
- Consumes: `validateTokens` and the two exact ordered token arrays.
- Produces: `resolveTokens`, `renderCss`, `renderJson` and `tsx scripts/tokens.ts --write|--check`.
- Produces: 106 resolved tokens in source order, 106 CSS declarations, and byte-identical dist/public JSON.

- [ ] **Step 1: Add all 80 primitive candidate tokens**

Create `packages/tokens/src/primitives.tokens.json` with this complete content:

```json
[
  { "name": "color/neutral/0", "type": "color", "kind": "primitive", "value": "#FFFFFF", "description": "기본 흰색 표면과 반전 텍스트에 사용하는 가장 밝은 중립색입니다." },
  { "name": "color/neutral/50", "type": "color", "kind": "primitive", "value": "#F8F9FB", "description": "앱 canvas와 넓은 저강도 배경에 사용하는 중립색입니다." },
  { "name": "color/neutral/100", "type": "color", "kind": "primitive", "value": "#F0F2F5", "description": "보조 배경과 약한 상태 면에 사용하는 중립색입니다." },
  { "name": "color/neutral/200", "type": "color", "kind": "primitive", "value": "#E2E6EC", "description": "기본 구분선과 입력 경계에 사용하는 중립색입니다." },
  { "name": "color/neutral/300", "type": "color", "kind": "primitive", "value": "#CDD3DC", "description": "강한 구분선과 강조 경계에 사용하는 중립색입니다." },
  { "name": "color/neutral/400", "type": "color", "kind": "primitive", "value": "#AAB3BF", "description": "비활성 텍스트와 낮은 대비 아이콘에 사용하는 중립색입니다." },
  { "name": "color/neutral/500", "type": "color", "kind": "primitive", "value": "#84909F", "description": "중간 강도의 보조 정보에 사용하는 중립색입니다." },
  { "name": "color/neutral/600", "type": "color", "kind": "primitive", "value": "#667281", "description": "읽기 가능한 보조 본문과 메타데이터에 사용하는 중립색입니다." },
  { "name": "color/neutral/700", "type": "color", "kind": "primitive", "value": "#485463", "description": "강한 보조 텍스트와 중립 상태 면에 사용하는 중립색입니다." },
  { "name": "color/neutral/800", "type": "color", "kind": "primitive", "value": "#2F3945", "description": "높은 대비가 필요한 제목과 아이콘에 사용하는 중립색입니다." },
  { "name": "color/neutral/900", "type": "color", "kind": "primitive", "value": "#171D24", "description": "기본 본문과 핵심 제목에 사용하는 가장 어두운 중립색입니다." },
  { "name": "color/blue/50", "type": "color", "kind": "primitive", "value": "#EEF4FF", "description": "파란 약한 action 배경에 사용하는 가장 밝은 파란색입니다." },
  { "name": "color/blue/100", "type": "color", "kind": "primitive", "value": "#DCE8FF", "description": "파란 약한 hover 배경에 사용하는 파란색입니다." },
  { "name": "color/blue/200", "type": "color", "kind": "primitive", "value": "#B8D0FF", "description": "키보드 focus ring에 사용하는 밝은 파란색입니다." },
  { "name": "color/blue/300", "type": "color", "kind": "primitive", "value": "#8BB1FF", "description": "보조 파란 강조와 시각화에 사용하는 파란색입니다." },
  { "name": "color/blue/400", "type": "color", "kind": "primitive", "value": "#5E91FF", "description": "중간 강도의 파란 강조에 사용하는 파란색입니다." },
  { "name": "color/blue/500", "type": "color", "kind": "primitive", "value": "#366FFF", "description": "focus 경계와 선택 강조에 사용하는 파란색입니다." },
  { "name": "color/blue/600", "type": "color", "kind": "primitive", "value": "#245BE0", "description": "기본 주요 action 면에 사용하는 파란색입니다." },
  { "name": "color/blue/700", "type": "color", "kind": "primitive", "value": "#1C47B4", "description": "주요 action hover와 약한 action 텍스트에 사용하는 파란색입니다." },
  { "name": "color/blue/800", "type": "color", "kind": "primitive", "value": "#193C8F", "description": "주요 action pressed 상태에 사용하는 파란색입니다." },
  { "name": "color/blue/900", "type": "color", "kind": "primitive", "value": "#183575", "description": "가장 강한 파란 텍스트와 고대비 강조에 사용하는 파란색입니다." },
  { "name": "color/red/50", "type": "color", "kind": "primitive", "value": "#FFF1F2", "description": "오류와 위험의 약한 배경에 사용하는 밝은 빨간색입니다." },
  { "name": "color/red/100", "type": "color", "kind": "primitive", "value": "#FFE0E3", "description": "오류 상태의 보조 배경과 경계에 사용하는 빨간색입니다." },
  { "name": "color/red/500", "type": "color", "kind": "primitive", "value": "#E5484D", "description": "중간 강도의 오류 강조에 사용하는 빨간색입니다." },
  { "name": "color/red/600", "type": "color", "kind": "primitive", "value": "#D13438", "description": "기본 위험 상태와 오류 action에 사용하는 빨간색입니다." },
  { "name": "color/red/700", "type": "color", "kind": "primitive", "value": "#B42329", "description": "위험 상태 hover와 강한 오류 텍스트에 사용하는 빨간색입니다." },
  { "name": "color/green/50", "type": "color", "kind": "primitive", "value": "#EDFCF2", "description": "성공 상태의 약한 배경에 사용하는 밝은 초록색입니다." },
  { "name": "color/green/100", "type": "color", "kind": "primitive", "value": "#D5F5E1", "description": "성공 상태의 보조 배경과 경계에 사용하는 초록색입니다." },
  { "name": "color/green/500", "type": "color", "kind": "primitive", "value": "#20A464", "description": "중간 강도의 성공 강조에 사용하는 초록색입니다." },
  { "name": "color/green/600", "type": "color", "kind": "primitive", "value": "#178650", "description": "기본 성공 상태와 확인 action에 사용하는 초록색입니다." },
  { "name": "color/green/700", "type": "color", "kind": "primitive", "value": "#126B42", "description": "성공 상태 hover와 강한 성공 텍스트에 사용하는 초록색입니다." },
  { "name": "space/0", "type": "dimension", "kind": "primitive", "value": 0, "description": "간격을 제거할 때 사용하는 0px 값입니다." },
  { "name": "space/2", "type": "dimension", "kind": "primitive", "value": 2, "description": "미세한 시각 보정에 사용하는 2px 간격입니다." },
  { "name": "space/4", "type": "dimension", "kind": "primitive", "value": 4, "description": "아이콘 내부와 밀집 요소에 사용하는 4px 간격입니다." },
  { "name": "space/8", "type": "dimension", "kind": "primitive", "value": 8, "description": "관련된 작은 요소 사이에 사용하는 8px 간격입니다." },
  { "name": "space/12", "type": "dimension", "kind": "primitive", "value": 12, "description": "control 내부와 보조 그룹에 사용하는 12px 간격입니다." },
  { "name": "space/16", "type": "dimension", "kind": "primitive", "value": 16, "description": "모바일 기본 여백과 일반 그룹에 사용하는 16px 간격입니다." },
  { "name": "space/20", "type": "dimension", "kind": "primitive", "value": 20, "description": "중간 크기 control과 섹션 내부에 사용하는 20px 간격입니다." },
  { "name": "space/24", "type": "dimension", "kind": "primitive", "value": 24, "description": "콘텐츠 그룹과 카드 내부에 사용하는 24px 간격입니다." },
  { "name": "space/32", "type": "dimension", "kind": "primitive", "value": 32, "description": "작은 섹션 사이를 구분하는 32px 간격입니다." },
  { "name": "space/40", "type": "dimension", "kind": "primitive", "value": 40, "description": "큰 콘텐츠 블록 사이에 사용하는 40px 간격입니다." },
  { "name": "space/48", "type": "dimension", "kind": "primitive", "value": 48, "description": "페이지 섹션 사이에 사용하는 48px 간격입니다." },
  { "name": "space/64", "type": "dimension", "kind": "primitive", "value": 64, "description": "최상위 페이지 구획에 사용하는 64px 간격입니다." },
  { "name": "size/icon/small", "type": "dimension", "kind": "primitive", "value": 16, "description": "밀집된 문맥과 작은 label에 사용하는 아이콘 크기입니다." },
  { "name": "size/icon/medium", "type": "dimension", "kind": "primitive", "value": 20, "description": "일반 control 내부에 사용하는 아이콘 크기입니다." },
  { "name": "size/icon/large", "type": "dimension", "kind": "primitive", "value": 24, "description": "독립 아이콘과 큰 control에 사용하는 아이콘 크기입니다." },
  { "name": "size/badge/small", "type": "dimension", "kind": "primitive", "value": 20, "description": "작은 Badge의 전체 높이에 사용하는 크기입니다." },
  { "name": "size/badge/medium", "type": "dimension", "kind": "primitive", "value": 24, "description": "기본 Badge의 전체 높이에 사용하는 크기입니다." },
  { "name": "size/control/small", "type": "dimension", "kind": "primitive", "value": 44, "description": "최소 모바일 터치 영역을 만족하는 작은 control 높이입니다." },
  { "name": "size/control/medium", "type": "dimension", "kind": "primitive", "value": 48, "description": "Button과 TextField의 기본 control 높이입니다." },
  { "name": "size/control/large", "type": "dimension", "kind": "primitive", "value": 56, "description": "강조된 Button과 TextField에 사용하는 큰 control 높이입니다." },
  { "name": "radius/none", "type": "dimension", "kind": "primitive", "value": 0, "description": "모서리 곡률을 제거할 때 사용하는 radius입니다." },
  { "name": "radius/sm", "type": "dimension", "kind": "primitive", "value": 6, "description": "작은 요소와 밀집된 surface에 사용하는 radius입니다." },
  { "name": "radius/md", "type": "dimension", "kind": "primitive", "value": 10, "description": "기본 control과 작은 카드에 사용하는 radius입니다." },
  { "name": "radius/lg", "type": "dimension", "kind": "primitive", "value": 14, "description": "큰 control과 일반 카드에 사용하는 radius입니다." },
  { "name": "radius/xl", "type": "dimension", "kind": "primitive", "value": 20, "description": "강조 surface와 큰 패널에 사용하는 radius입니다." },
  { "name": "radius/full", "type": "dimension", "kind": "primitive", "value": 9999, "description": "Badge와 원형 control을 완전히 둥글게 만드는 radius입니다." },
  { "name": "font/size/caption", "type": "dimension", "kind": "primitive", "value": 12, "description": "caption과 밀집된 상태 label에 사용하는 글자 크기입니다." },
  { "name": "font/size/body-sm", "type": "dimension", "kind": "primitive", "value": 14, "description": "보조 본문과 compact control에 사용하는 글자 크기입니다." },
  { "name": "font/size/body", "type": "dimension", "kind": "primitive", "value": 16, "description": "기본 본문과 control label에 사용하는 글자 크기입니다." },
  { "name": "font/size/body-lg", "type": "dimension", "kind": "primitive", "value": 18, "description": "강조 본문과 큰 control에 사용하는 글자 크기입니다." },
  { "name": "font/size/title-sm", "type": "dimension", "kind": "primitive", "value": 20, "description": "작은 섹션 제목에 사용하는 글자 크기입니다." },
  { "name": "font/size/title", "type": "dimension", "kind": "primitive", "value": 24, "description": "기본 페이지 하위 제목에 사용하는 글자 크기입니다." },
  { "name": "font/size/heading", "type": "dimension", "kind": "primitive", "value": 32, "description": "페이지 핵심 heading에 사용하는 글자 크기입니다." },
  { "name": "font/size/display", "type": "dimension", "kind": "primitive", "value": 40, "description": "소개 영역의 가장 큰 display 제목에 사용하는 글자 크기입니다." },
  { "name": "font/weight/regular", "type": "fontWeight", "kind": "primitive", "value": 400, "description": "긴 본문과 일반 설명에 사용하는 기본 굵기입니다." },
  { "name": "font/weight/medium", "type": "fontWeight", "kind": "primitive", "value": 500, "description": "control label과 가벼운 강조에 사용하는 굵기입니다." },
  { "name": "font/weight/semibold", "type": "fontWeight", "kind": "primitive", "value": 600, "description": "제목과 주요 action label에 사용하는 굵기입니다." },
  { "name": "font/weight/bold", "type": "fontWeight", "kind": "primitive", "value": 700, "description": "display와 매우 강한 강조에 사용하는 굵기입니다." },
  { "name": "font/line-height/caption", "type": "dimension", "kind": "primitive", "value": 16, "description": "caption 글자의 읽기 높이를 정하는 line-height입니다." },
  { "name": "font/line-height/body-sm", "type": "dimension", "kind": "primitive", "value": 20, "description": "작은 본문의 읽기 높이를 정하는 line-height입니다." },
  { "name": "font/line-height/body", "type": "dimension", "kind": "primitive", "value": 24, "description": "기본 본문의 읽기 높이를 정하는 line-height입니다." },
  { "name": "font/line-height/body-lg", "type": "dimension", "kind": "primitive", "value": 28, "description": "큰 본문의 읽기 높이를 정하는 line-height입니다." },
  { "name": "font/line-height/title-sm", "type": "dimension", "kind": "primitive", "value": 28, "description": "작은 제목의 행 높이를 정하는 line-height입니다." },
  { "name": "font/line-height/title", "type": "dimension", "kind": "primitive", "value": 32, "description": "기본 제목의 행 높이를 정하는 line-height입니다." },
  { "name": "font/line-height/heading", "type": "dimension", "kind": "primitive", "value": 40, "description": "큰 heading의 행 높이를 정하는 line-height입니다." },
  { "name": "font/line-height/display", "type": "dimension", "kind": "primitive", "value": 48, "description": "display 제목의 행 높이를 정하는 line-height입니다." },
  { "name": "font/family/sans", "type": "fontFamily", "kind": "primitive", "value": "\"IBM Plex Sans KR\", \"Noto Sans KR\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif", "description": "한국어와 시스템 fallback을 함께 제공하는 기본 sans-serif 글꼴 stack입니다." },
  { "name": "elevation/1", "type": "shadow", "kind": "primitive", "value": "0 1px 2px rgba(15, 23, 42, 0.06)", "description": "인접 surface를 미세하게 구분하는 낮은 elevation입니다." },
  { "name": "elevation/2", "type": "shadow", "kind": "primitive", "value": "0 8px 24px rgba(15, 23, 42, 0.10)", "description": "떠 있는 panel과 overlay를 구분하는 중간 elevation입니다." }
]
```

- [ ] **Step 2: Add all 26 semantic alias tokens**

Create `packages/tokens/src/semantic.tokens.json` with this complete content:

```json
[
  { "name": "color/bg/canvas", "type": "color", "kind": "semantic", "value": "{color/neutral/50}", "description": "앱과 문서 페이지의 가장 바깥 배경색입니다." },
  { "name": "color/bg/surface", "type": "color", "kind": "semantic", "value": "{color/neutral/0}", "description": "카드와 control이 놓이는 기본 surface 배경색입니다." },
  { "name": "color/bg/subtle", "type": "color", "kind": "semantic", "value": "{color/neutral/100}", "description": "보조 구획과 약한 상태를 구분하는 배경색입니다." },
  { "name": "color/text/primary", "type": "color", "kind": "semantic", "value": "{color/neutral/900}", "description": "본문과 핵심 제목에 사용하는 기본 텍스트 색상입니다." },
  { "name": "color/icon/primary", "type": "color", "kind": "semantic", "value": "{color/neutral/900}", "description": "기능 아이콘의 기본 전경색으로 사용하는 색상입니다." },
  { "name": "color/text/secondary", "type": "color", "kind": "semantic", "value": "{color/neutral/600}", "description": "설명과 메타데이터에 사용하는 보조 텍스트 색상입니다." },
  { "name": "color/text/disabled", "type": "color", "kind": "semantic", "value": "{color/neutral/400}", "description": "사용할 수 없는 control의 텍스트와 아이콘 색상입니다." },
  { "name": "color/text/inverse", "type": "color", "kind": "semantic", "value": "{color/neutral/0}", "description": "어두운 surface 위 텍스트와 아이콘에 사용하는 반전 색상입니다." },
  { "name": "color/border/default", "type": "color", "kind": "semantic", "value": "{color/neutral/500}", "description": "surface와 control의 기본 경계 색상입니다." },
  { "name": "color/border/strong", "type": "color", "kind": "semantic", "value": "{color/neutral/600}", "description": "강조가 필요한 구분선과 control 경계 색상입니다." },
  { "name": "color/border/focus", "type": "color", "kind": "semantic", "value": "{color/blue/500}", "description": "focus된 control의 직접 경계 색상입니다." },
  { "name": "color/action/primary", "type": "color", "kind": "semantic", "value": "{color/blue/600}", "description": "페이지의 주요 action 기본 배경색입니다." },
  { "name": "color/action/primary-hover", "type": "color", "kind": "semantic", "value": "{color/blue/700}", "description": "주요 action의 pointer hover 배경색입니다." },
  { "name": "color/action/primary-pressed", "type": "color", "kind": "semantic", "value": "{color/blue/800}", "description": "주요 action을 누르는 동안 사용하는 배경색입니다." },
  { "name": "color/action/on-primary", "type": "color", "kind": "semantic", "value": "{color/neutral/0}", "description": "주요 action 배경 위 label과 icon 색상입니다." },
  { "name": "color/action/weak", "type": "color", "kind": "semantic", "value": "{color/blue/50}", "description": "낮은 강도의 action 기본 배경색입니다." },
  { "name": "color/action/weak-hover", "type": "color", "kind": "semantic", "value": "{color/blue/100}", "description": "낮은 강도의 action hover 배경색입니다." },
  { "name": "color/action/on-weak", "type": "color", "kind": "semantic", "value": "{color/blue/700}", "description": "낮은 강도의 action 위 label과 icon 색상입니다." },
  { "name": "color/status/danger", "type": "color", "kind": "semantic", "value": "{color/red/700}", "description": "오류와 위험 상태의 기본 강조 색상입니다." },
  { "name": "color/status/danger-subtle", "type": "color", "kind": "semantic", "value": "{color/red/50}", "description": "오류와 위험 상태의 약한 배경색입니다." },
  { "name": "color/status/success", "type": "color", "kind": "semantic", "value": "{color/green/700}", "description": "성공과 완료 상태의 기본 강조 색상입니다." },
  { "name": "color/status/success-subtle", "type": "color", "kind": "semantic", "value": "{color/green/50}", "description": "성공과 완료 상태의 약한 배경색입니다." },
  { "name": "color/status/neutral", "type": "color", "kind": "semantic", "value": "{color/neutral/700}", "description": "중립 정보 상태의 기본 강조 색상입니다." },
  { "name": "color/status/neutral-subtle", "type": "color", "kind": "semantic", "value": "{color/neutral/100}", "description": "중립 정보 상태의 약한 배경색입니다." },
  { "name": "color/status/on-status", "type": "color", "kind": "semantic", "value": "{color/neutral/0}", "description": "강한 status 배경 위 label과 icon 색상입니다." },
  { "name": "color/focus/ring", "type": "color", "kind": "semantic", "value": "{color/blue/600}", "description": "키보드 focus-visible 외곽 ring 색상입니다." }
]
```

- [ ] **Step 3: Write the complete failing generation and guard tests**

Create `packages/tokens/tests/generate.test.ts` with this complete content:

```ts
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  renderCss,
  renderJson,
  resolveTokens,
} from '../src/generate.js';
import type { TokenDefinition } from '../src/types.js';

const primitiveUrl = new URL('../src/primitives.tokens.json', import.meta.url);
const semanticUrl = new URL('../src/semantic.tokens.json', import.meta.url);
const distCssUrl = new URL('../dist/tokens.css', import.meta.url);
const distJsonUrl = new URL('../dist/tokens.json', import.meta.url);
const docsJsonUrl = new URL(
  '../../../apps/docs/public/design-system/tokens.json',
  import.meta.url,
);
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const sourceRoots = [
  fileURLToPath(new URL('../../react/src/', import.meta.url)),
  fileURLToPath(new URL('../../../apps/docs/src/', import.meta.url)),
];
const sourceExtensions = new Set(['.astro', '.css', '.mdx', '.ts', '.tsx']);
const allowedFoundationSegments = [
  '/apps/docs/src/components/foundations/',
  '/apps/docs/src/content/foundations/',
];

async function loadDefinitions(): Promise<TokenDefinition[]> {
  const primitive = JSON.parse(
    await readFile(primitiveUrl, 'utf8'),
  ) as TokenDefinition[];
  const semantic = JSON.parse(
    await readFile(semanticUrl, 'utf8'),
  ) as TokenDefinition[];

  return [...primitive, ...semantic];
}

async function collectSourceFiles(directory: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const files: string[] = [];
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(path)));
    } else if (sourceExtensions.has(extname(entry.name))) {
      files.push(path);
    }
  }

  return files;
}

describe('token generation', () => {
  it('preserves source order and resolves aliases without losing them', async () => {
    const definitions = await loadDefinitions();
    const resolved = resolveTokens(definitions);

    expect(resolved).toHaveLength(106);
    expect(resolved.map((token) => token.name)).toEqual(
      definitions.map((token) => token.name),
    );
    expect(
      resolved.find((token) => token.name === 'color/action/primary'),
    ).toMatchObject({
      value: '{color/blue/600}',
      cssVariable: '--ds-color-action-primary',
      resolvedValue: '#245BE0',
    });
  });

  it('renders deterministic CSS units, aliases, and JSON fields', async () => {
    const definitions = await loadDefinitions();
    const first = resolveTokens(definitions);
    const second = resolveTokens(definitions);
    const css = renderCss(first);
    const json = renderJson(first);

    expect(renderCss(second)).toBe(css);
    expect(renderJson(second)).toBe(json);
    expect(css).toContain('  --ds-space-16: 16px;');
    expect(css).toContain('  --ds-font-weight-semibold: 600;');
    expect(css).toContain(
      '  --ds-color-action-primary: var(--ds-color-blue-600);',
    );
    expect(css).toContain(
      '  --ds-font-family-sans: "IBM Plex Sans KR", "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
    );
    expect(css.endsWith('\n')).toBe(true);

    const parsed = JSON.parse(json) as {
      schemaVersion: number;
      tokens: Array<Record<string, unknown>>;
    };
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.tokens).toHaveLength(106);
    expect(Object.keys(parsed.tokens[0] ?? {})).toEqual([
      'name',
      'type',
      'kind',
      'value',
      'description',
      'cssVariable',
      'resolvedValue',
    ]);
    expect(json.endsWith('\n')).toBe(true);
  });

  it('uses committed CSS and JSON files as byte snapshots', async () => {
    const resolved = resolveTokens(await loadDefinitions());
    const [distCss, distJson, docsJson] = await Promise.all([
      readFile(distCssUrl, 'utf8'),
      readFile(distJsonUrl, 'utf8'),
      readFile(docsJsonUrl, 'utf8'),
    ]);

    expect(distCss).toBe(renderCss(resolved));
    expect(distJson).toBe(renderJson(resolved));
    expect(docsJson).toBe(distJson);
  });

  it('rejects primitive color CSS variables outside Foundation visualizers', async () => {
    const files = (
      await Promise.all(sourceRoots.map((root) => collectSourceFiles(root)))
    ).flat();
    const violations: string[] = [];

    for (const file of files) {
      const normalized = file.split(sep).join('/');
      if (
        allowedFoundationSegments.some((segment) =>
          normalized.includes(segment),
        )
      ) {
        continue;
      }

      const source = await readFile(file, 'utf8');
      for (const match of source.matchAll(
        /--ds-color-(?:neutral|blue|red|green)-/g,
      )) {
        const line = source.slice(0, match.index).split('\n').length;
        violations.push(
          `${relative(repoRoot, file).split(sep).join('/')}:${line}`,
        );
      }
    }

    expect(violations).toEqual([]);
  });
});
```

- [ ] **Step 4: Run generation tests and observe RED**

Run:

```powershell
corepack pnpm --filter @maxxuxx/tokens test -- generate.test.ts
```

Expected: exit 1; Vitest reports that `../src/generate.js` cannot be resolved. A zero-test result is not acceptable.

- [ ] **Step 5: Implement deterministic resolution and rendering**

Create `packages/tokens/src/generate.ts` with this complete content:

```ts
import type { ResolvedToken, TokenDefinition } from './types.js';
import { validateTokens } from './validate.js';

const aliasPattern = /^\{([^{}]+)\}$/;

function aliasTarget(value: string | number): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  return aliasPattern.exec(value)?.[1] ?? null;
}

export function toCssVariable(name: string): `--ds-${string}` {
  return `--ds-${name.replaceAll('/', '-')}`;
}

export function resolveTokens(
  tokens: TokenDefinition[],
): ResolvedToken[] {
  const byName = validateTokens(tokens);
  const cache = new Map<string, string | number>();

  const resolveValue = (name: string): string | number => {
    const cached = cache.get(name);
    if (cached !== undefined) {
      return cached;
    }

    const token = byName.get(name);
    if (token === undefined) {
      throw new Error(`Cannot resolve unknown token: ${name}`);
    }

    const targetName = aliasTarget(token.value);
    const resolved =
      targetName === null ? token.value : resolveValue(targetName);
    cache.set(name, resolved);
    return resolved;
  };

  return [...byName.values()].map((token) => ({
    ...token,
    cssVariable: toCssVariable(token.name),
    resolvedValue: resolveValue(token.name),
  }));
}

function renderCssValue(token: ResolvedToken): string {
  const targetName = aliasTarget(token.value);
  if (targetName !== null) {
    return `var(${toCssVariable(targetName)})`;
  }

  switch (token.type) {
    case 'dimension':
      return `${token.value}px`;
    case 'fontWeight':
      return String(token.value);
    case 'color':
    case 'fontFamily':
    case 'shadow':
      return String(token.value);
  }
}

export function renderCss(tokens: ResolvedToken[]): string {
  const declarations = tokens.map(
    (token) => `  ${token.cssVariable}: ${renderCssValue(token)};`,
  );

  return [':root {', ...declarations, '}', ''].join('\n');
}

export function renderJson(tokens: ResolvedToken[]): string {
  return `${JSON.stringify({ schemaVersion: 1, tokens }, null, 2)}\n`;
}
```

- [ ] **Step 6: Implement the write/check CLI with URL-relative paths**

Create `packages/tokens/scripts/tokens.ts` with this complete content:

```ts
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderCss, renderJson, resolveTokens } from '../src/generate.js';
import type { TokenDefinition } from '../src/types.js';

interface Artifact {
  path: string;
  content: string;
}

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const primitivePath = fileURLToPath(
  new URL('../src/primitives.tokens.json', import.meta.url),
);
const semanticPath = fileURLToPath(
  new URL('../src/semantic.tokens.json', import.meta.url),
);
const distCssPath = fileURLToPath(
  new URL('../dist/tokens.css', import.meta.url),
);
const distJsonPath = fileURLToPath(
  new URL('../dist/tokens.json', import.meta.url),
);
const docsJsonPath = fileURLToPath(
  new URL(
    '../../../apps/docs/public/design-system/tokens.json',
    import.meta.url,
  ),
);

function displayPath(path: string): string {
  return relative(repoRoot, path).split(sep).join('/');
}

async function readDefinitions(path: string): Promise<TokenDefinition[]> {
  return JSON.parse(await readFile(path, 'utf8')) as TokenDefinition[];
}

async function buildArtifacts(): Promise<Artifact[]> {
  const [primitive, semantic] = await Promise.all([
    readDefinitions(primitivePath),
    readDefinitions(semanticPath),
  ]);
  const resolved = resolveTokens([...primitive, ...semantic]);
  const css = renderCss(resolved);
  const json = renderJson(resolved);

  return [
    { path: distCssPath, content: css },
    { path: distJsonPath, content: json },
    { path: docsJsonPath, content: json },
  ];
}

async function writeArtifacts(artifacts: Artifact[]): Promise<void> {
  for (const artifact of artifacts) {
    await mkdir(dirname(artifact.path), { recursive: true });
    await writeFile(artifact.path, artifact.content, 'utf8');
    console.log(`Wrote ${displayPath(artifact.path)}`);
  }
}

async function checkArtifacts(artifacts: Artifact[]): Promise<boolean> {
  const stale: string[] = [];

  for (const artifact of artifacts) {
    let actual: string | null = null;
    try {
      actual = await readFile(artifact.path, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    if (actual !== artifact.content) {
      stale.push(displayPath(artifact.path));
    }
  }

  for (const path of stale) {
    console.error(`Stale generated artifact: ${path}`);
  }

  return stale.length === 0;
}

async function main(): Promise<void> {
  const [mode, extra] = process.argv.slice(2);
  if (
    extra !== undefined ||
    (mode !== '--write' && mode !== '--check')
  ) {
    console.error('Usage: tsx scripts/tokens.ts --write|--check');
    process.exitCode = 1;
    return;
  }

  const artifacts = await buildArtifacts();
  if (mode === '--write') {
    await writeArtifacts(artifacts);
    return;
  }

  if (!(await checkArtifacts(artifacts))) {
    process.exitCode = 1;
    return;
  }

  console.log('Generated artifacts are current.');
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
```

- [ ] **Step 7: Generate the committed snapshots before running GREEN**

Run:

```powershell
corepack pnpm --filter @maxxuxx/tokens tokens:generate
```

Expected exact relative-path messages:

```text
Wrote packages/tokens/dist/tokens.css
Wrote packages/tokens/dist/tokens.json
Wrote apps/docs/public/design-system/tokens.json
```

Generated artifact strategy:

- `packages/tokens/dist/tokens.css` and both JSON files are not hand-authored plan blocks. Their complete bytes are deterministically produced by the exact 106 source objects, `resolveTokens`, `renderCss`, and `renderJson` above.
- The two committed JSON files are written from the same in-memory `json` string, not copied or separately serialized.
- The committed CSS/JSON files are golden byte snapshots used by `generate.test.ts` and the read-only `--check` command.
- Regeneration is the only permitted repair for a stale artifact.

- [ ] **Step 8: Run all token tests and type checking**

Run:

```powershell
corepack pnpm --filter @maxxuxx/tokens test
corepack pnpm --filter @maxxuxx/tokens check
```

Expected: two test files and eleven tests pass; TypeScript exits 0 with no diagnostic.

- [ ] **Step 9: Prove stale checking is read-only and then restore by generation**

Run this exact PowerShell block:

```powershell
$artifact = 'packages/tokens/dist/tokens.css'
Add-Content -LiteralPath $artifact -Value 'stale-check'
$staleHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $artifact).Hash

try {
  corepack pnpm --filter @maxxuxx/tokens generated:check
  if ($LASTEXITCODE -eq 0) {
    throw 'generated:check unexpectedly passed for a stale artifact'
  }

  $afterCheckHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $artifact).Hash
  if ($afterCheckHash -ne $staleHash) {
    throw 'generated:check modified the stale artifact'
  }
} finally {
  corepack pnpm --filter @maxxuxx/tokens tokens:generate
}

corepack pnpm --filter @maxxuxx/tokens generated:check
```

Expected:

- the first check exits 1 and prints `Stale generated artifact: packages/tokens/dist/tokens.css`;
- its SHA-256 remains unchanged, proving `--check` did not write;
- the `finally` regeneration rewrites all three artifacts;
- the final check prints `Generated artifacts are current.` and exits 0.

- [ ] **Step 10: Verify counts, parity, line endings, and public handoff**

Run:

```powershell
$distJson = Get-Content -Raw -Encoding UTF8 'packages/tokens/dist/tokens.json' | ConvertFrom-Json
$docsJson = Get-Content -Raw -Encoding UTF8 'apps/docs/public/design-system/tokens.json' | ConvertFrom-Json
$cssDeclarationCount = (
  Select-String -Path 'packages/tokens/dist/tokens.css' -Pattern '^  --ds-'
).Count
$distHash = (Get-FileHash -Algorithm SHA256 'packages/tokens/dist/tokens.json').Hash
$docsHash = (Get-FileHash -Algorithm SHA256 'apps/docs/public/design-system/tokens.json').Hash
$generatedPaths = @(
  'packages/tokens/dist/tokens.css',
  'packages/tokens/dist/tokens.json',
  'apps/docs/public/design-system/tokens.json'
)
$lineEndingChecks = $generatedPaths | ForEach-Object {
  $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $_))
  [pscustomobject]@{
    Path = $_
    HasCarriageReturn = [Array]::IndexOf($bytes, [byte]13) -ge 0
    EndsWithLineFeed = $bytes[-1] -eq 10
  }
}

[pscustomobject]@{
  DistSchemaVersion = $distJson.schemaVersion
  DocsSchemaVersion = $docsJson.schemaVersion
  DistTokenCount = $distJson.tokens.Count
  DocsTokenCount = $docsJson.tokens.Count
  CssDeclarationCount = $cssDeclarationCount
  JsonHashesMatch = $distHash -eq $docsHash
}
$lineEndingChecks
```

Expected summary:

```text
DistSchemaVersion  : 1
DocsSchemaVersion  : 1
DistTokenCount     : 106
DocsTokenCount     : 106
CssDeclarationCount : 106
JsonHashesMatch    : True
```

Each line-ending row must show `HasCarriageReturn=False` and `EndsWithLineFeed=True`.

- [ ] **Step 11: Commit the validated token pipeline locally**

Run:

```powershell
git add packages/tokens apps/docs/public/design-system/tokens.json
git diff --cached --check
git commit -m "feat(tokens): add validated design token pipeline"
```

Expected: only token source/config/tests/generator plus the three generated artifacts are staged; `git diff --cached --check` emits no output; the Conventional Commit succeeds. Do not push.

### Task 4: Run the Plan 01 handoff checkpoint

**Files:**
- Verify only: `package.json`
- Verify only: `pnpm-lock.yaml`
- Verify only: `packages/tokens`
- Verify only: `apps/docs/public/design-system/tokens.json`

**Interfaces:**
- Produces for plan 02: `@maxxuxx/tokens/tokens.css` and `@maxxuxx/tokens/tokens.json` plus the public JSON copy.
- Produces for plan 03: semantic color variables, dimensions, radius, typography, and elevation variables named by the exact slash-to-hyphen rule.
- Produces for plan 04: JSON entries containing `name`, `type`, `kind`, `value`, `description`, `cssVariable`, `resolvedValue`.

- [ ] **Step 1: Run the fresh token-only acceptance sequence**

Run:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @maxxuxx/tokens tokens:generate
corepack pnpm --filter @maxxuxx/tokens test
corepack pnpm --filter @maxxuxx/tokens check
corepack pnpm --filter @maxxuxx/tokens generated:check
git diff --exit-code -- packages/tokens/dist/tokens.css packages/tokens/dist/tokens.json apps/docs/public/design-system/tokens.json
git status --short
```

Expected:

- frozen install exits 0 without changing `pnpm-lock.yaml`;
- generation emits the three exact `Wrote` lines;
- two Vitest files and eleven tests pass;
- TypeScript emits no diagnostic;
- generated check prints `Generated artifacts are current.`;
- `git diff --exit-code` exits 0, proving regeneration matches committed artifacts;
- `git status --short` contains no uncommitted Plan 01 implementation file. Changes owned by another concurrent plan must be reported and left untouched.

- [ ] **Step 2: Record the exact downstream token surface**

Plans 02–04 consume these facts without redefining them:

```text
CSS import: @maxxuxx/tokens/tokens.css
JSON import: @maxxuxx/tokens/tokens.json
Public JSON: apps/docs/public/design-system/tokens.json
JSON envelope: schemaVersion=1, tokens=106
Token fields: name,type,kind,value,description,cssVariable,resolvedValue
Semantic example: --ds-color-action-primary
Dimension examples: --ds-size-control-small, --ds-radius-full
Typography examples: --ds-font-size-body, --ds-font-line-height-body, --ds-font-weight-semibold
Generated repair: corepack pnpm --filter @maxxuxx/tokens tokens:generate
Generated assertion: corepack pnpm --filter @maxxuxx/tokens generated:check
```

- [ ] **Step 3: Re-read the Public repository state and stop at the plan ownership boundary**

Run:

```powershell
gh repo view maxxuxx/design-system --json visibility,isPrivate
```

Expected and valid: `{"isPrivate":false,"visibility":"PUBLIC"}`.

The Public readback above does not block parent-owned push or v0.1 completion. If either field differs, report `Repository visibility mismatch: expected PUBLIC.` and finish the local plan without changing visibility. This sub-plan always leaves branch push/integration to the parent roadmap; it does not push independently.

## Plan 01 Completion Evidence

- Local commit `chore: scaffold private design system workspace` exists.
- Local commit `feat(tokens): add validated design token pipeline` exists.
- pnpm 11.11.0 frozen install is reproducible.
- Exactly 106 source tokens validate; 80 are primitive and 26 are semantic aliases.
- Token tests and TypeScript checks pass.
- CSS has exactly 106 declarations.
- Dist and public JSON have schema version 1, 106 entries, and matching SHA-256 hashes.
- All generated files are LF-terminated, current, committed, and reproducible from source.
- No npm publication, external hosting, Figma mutation, React source, Astro source, Svelte package, or React Native package was added.
- No push occurred from plan 01; branch push/integration remains owned by the parent roadmap.
