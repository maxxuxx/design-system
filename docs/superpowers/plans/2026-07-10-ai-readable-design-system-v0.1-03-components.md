# AI-Readable Design System v0.1 React Pilot Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Icon → Badge → Button → TextField` 순서로 네 React 파일럿, 각 컴포넌트의 완전한 MDX 문서와 인터랙티브 데모, 누적 AI manifest, 모바일·데스크톱 브라우저 기준 이미지를 수직 완성한다.

**Architecture:** `packages/react`는 plan 01의 생성 토큰 CSS를 의미 토큰과 dimension 토큰으로만 소비하고, 각 컴포넌트 폴더가 구현·스타일·테스트·public export를 함께 소유한다. `apps/docs`의 MDX frontmatter가 plan 02 manifest 생성기의 단일 컴포넌트 메타데이터 원본이며, React island는 문서 예제만 hydrate한다. 각 slice는 `실패하는 단위 테스트 → 최소 구현 → MDX/manifest → Astro build → 390x844 및 1440x900 Playwright screenshot → commit`을 독립적으로 통과한다.

**Tech Stack:** React 19.2.7, TypeScript 7.0.2, Vitest 4.1.10, Testing Library 16.3.2, axe-core 4.12.1, Astro 7.0.7 MDX, Playwright 1.61.1, generated design-token CSS.

## Global Constraints

- 기준 설계서는 `docs/superpowers/specs/2026-07-10-ai-readable-design-system-v0.1-design.md`, master plan은 `docs/superpowers/plans/2026-07-10-ai-readable-design-system-v0.1.md`다.
- 이 계획은 plan 01의 token pipeline과 plan 02의 Astro/content/manifest/Playwright infrastructure가 완료된 뒤 실행한다. 두 선행 계획의 파일을 이 계획에서 다시 설계하거나 대체하지 않는다.
- 실행 worktree, 의도적인 Public repository 정책, pinned versions, private package 경계는 master plan의 Global Constraints를 그대로 따른다.
- 컴포넌트 순서는 반드시 `Icon → Badge → Button → TextField`다. 다음 slice는 이전 slice의 focused test, package check, manifest check, docs build, mobile/desktop screenshot comparison이 모두 통과한 뒤 시작한다.
- React와 docs product CSS는 primitive color 변수 `--ds-color-neutral-*`, `--ds-color-blue-*`, `--ds-color-red-*`, `--ds-color-green-*`를 참조하지 않는다. 의미 color 변수와 plan 01의 spacing/size/radius/type 변수만 사용한다.
- 접근성 목표는 WCAG 2.2 AA다. 네 컴포넌트 모두 native element를 유지하고, 단위 axe smoke 0건, 키보드 동작, 명시적 ARIA precedence, 44px 이상 Button touch target을 검증한다.
- status는 네 컴포넌트 모두 `preview`, frameworks는 React `preview`, Svelte `planned`, React Native `planned`다.
- 각 slice가 처음 작성될 때 현재 컴포넌트의 `figmaUrl`만 schema가 허용하는 정확한 값 `""`로 시작한다. plan 04가 직전 slice를 실제 Figma node URL로 reconcile한 뒤 다음 slice를 실행하므로 이전 컴포넌트 URL은 non-empty일 수 있다. 임시 URL, 가짜 node ID, 예시 URL을 쓰지 않는다.
- 이 계획은 Figma를 읽거나 변경하지 않는다. Figma plugin code, `use_figma`, `create_new_file`, node mutation을 추가하지 않는다.
- 브라우저 기준은 plan 02의 Windows Chromium projects 중 `mobile-chromium` (`390x844`)과 `desktop-chromium` (`1440x900`)이다. tablet project는 이 slice baseline에서 명시적으로 skip하고 plan 02의 responsive suite가 별도로 검증한다.
- Playwright baseline은 같은 Windows/Chromium build에서 생성·사람이 검토·커밋한다. 처음 생성한 이미지를 검토하지 않고 통과 처리하지 않는다.
- 모든 생성 파일은 generator로만 갱신한다. `apps/docs/public/design-system/components.json`을 손으로 편집하지 않는다.
- 각 commit은 아래에 적힌 exact path만 stage한다. 관련 없는 사용자 변경과 plan 01/02/04/05 파일은 stage하지 않는다.

---

## Prerequisite Contract from Plans 01 and 02

실행 전에 다음 명령을 그대로 실행한다.

```powershell
corepack pnpm --filter @maxxuxx/tokens test
corepack pnpm --filter @maxxuxx/tokens check
corepack pnpm --filter @maxxuxx/tokens generated:check
corepack pnpm --filter @maxxuxx/docs test:unit
corepack pnpm --filter @maxxuxx/docs manifest:check
corepack pnpm --filter @maxxuxx/docs build
```

Expected: 여섯 명령이 모두 exit `0`; plan 01 token suite는 11 tests passed이고 CSS 및 두 106-token JSON 산출물이 byte-current다. component collection은 비어 있어도 유효하고 docs static build가 성공한다. 하나라도 실패하면 이 계획을 시작하지 않고 해당 선행 계획으로 돌아간다.

이 계획이 소비하는 고정 interface는 다음과 같다.

- Token CSS import: `@maxxuxx/tokens/tokens.css`.
- React package stylesheet export: `@maxxuxx/react/styles.css`.
- MDX schema exports: `COMPONENT_NAMES`, `COMPONENT_SLUGS`, `COMPONENT_ORDER`, `componentSchema`, `ComponentMetadata`, `validateComponentMetadata` from `apps/docs/src/content/component-schema.ts`.
- Manifest commands: `manifest:write`, `manifest:check`, `manifest:release-check`.
- Manifest entries contain exactly `name`, `slug`, `description`, `status`, `figmaUrl`, `frameworks`, `variants`, `sizes`, `states`, `accessibility`, `props`, `tokens`, and generated `docsUrl`; order is `Icon, Badge, Button, TextField`.
- Component page route: `/components/<slug>/`; MDX lives only under `apps/docs/src/content/components`.
- Preview wrapper: `ComponentPreview.astro` with `{ title: string; description?: string }`, default stage slot, optional `controls` slot.
- Playwright projects: `mobile-chromium`, `tablet-chromium`, `desktop-chromium`.
- Snapshot template: `{testDir}/__snapshots__/{testFileBaseName}/{arg}{ext}`.
- Screenshot helper: `expectPageScreenshot(page, testInfo, name)` adds `-${testInfo.project.name}.png`.
- Stable demo selector: each React demo root owns `data-component-demo="<slug>"`.

Plan 02의 manifest exact outcomes를 red/green oracle로 사용한다.

- 새 MDX 뒤 `manifest:check`: exit non-zero with `Stale component manifest: <absolute path>. Run "pnpm manifest:write".`
- `manifest:write`: exit `0` and `Wrote <absolute path>`.
- current manifest의 `manifest:check`: silent exit `0`.
- Icon pre-Figma checkpoint의 `manifest:release-check`: `Release manifest is missing components: Badge, Button, TextField`.
- Badge pre-Figma checkpoint의 `manifest:release-check`: `Release manifest is missing components: Button, TextField`.
- Button pre-Figma checkpoint의 `manifest:release-check`: `Release manifest is missing components: TextField`.
- TextField pre-Figma checkpoint의 `manifest:release-check`: `Figma URLs are required for release: TextField`.
- plan 04가 TextField까지 실제 URL을 reconcile한 뒤 `manifest:release-check`: silent exit `0`.

`<absolute path>`는 오류 메시지가 실제 worktree 절대 경로를 출력한다는 표기이며 파일 내용이나 구현 값에 넣는 placeholder가 아니다.

## Interleaved Pre-Figma Checkpoint Contract

각 component commit 직후 plan 03을 멈추고 plan 04의 같은 이름 component task를 실행한다. 이 계획은 다음 input을 제공한다.

| Slice | Plan 04 input | Exact browser evidence | Pre-Figma release-check |
|---|---|---|---|
| Icon | `IconProps`, `ICON_PATHS`, `ICON_SVGS`, five-name/three-size MDX metadata | `icon-mobile-chromium.png`, `icon-desktop-chromium.png` | missing `Badge, Button, TextField` |
| Badge | `BadgeProps`, exact `2 × 2 × 4` metadata and semantic token list | `badge-mobile-chromium.png`, `badge-desktop-chromium.png` | missing `Button, TextField` |
| Button | `ButtonProps`, owned Icon slots, exact `3 × 3 × 3` Figma state contract | `button-mobile-chromium.png`, `button-desktop-chromium.png` | missing `TextField` |
| TextField | `TextFieldProps`, ARIA/state precedence, exact `2 × 4` contract | `text-field-mobile-chromium.png`, `text-field-desktop-chromium.png` | empty URL for `TextField` |

Plan 04의 required output은 actual private Figma node URL, expected variant/component count, property list, binding audit, reviewed Figma screenshot이다. Plan 04가 그 actual URL을 현재 MDX frontmatter에 기록하고 `manifest:write`/`manifest:check`를 실행한다. Plan 03에는 그 mutation code를 복제하지 않는다.

다음 slice를 시작하기 전 current component에 대해 해당 exact readback을 실행한다.

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:check
node -e "const fs=require('node:fs');const m=JSON.parse(fs.readFileSync('apps/docs/public/design-system/components.json','utf8'));const c=m.components.find((x)=>x.name==='Icon');if(!c||!c.figmaUrl.startsWith('https://www.figma.com/')){console.error('Missing reconciled Figma URL: Icon');process.exit(1)}"

corepack pnpm --filter @maxxuxx/docs manifest:check
node -e "const fs=require('node:fs');const m=JSON.parse(fs.readFileSync('apps/docs/public/design-system/components.json','utf8'));const c=m.components.find((x)=>x.name==='Badge');if(!c||!c.figmaUrl.startsWith('https://www.figma.com/')){console.error('Missing reconciled Figma URL: Badge');process.exit(1)}"

corepack pnpm --filter @maxxuxx/docs manifest:check
node -e "const fs=require('node:fs');const m=JSON.parse(fs.readFileSync('apps/docs/public/design-system/components.json','utf8'));const c=m.components.find((x)=>x.name==='Button');if(!c||!c.figmaUrl.startsWith('https://www.figma.com/')){console.error('Missing reconciled Figma URL: Button');process.exit(1)}"

corepack pnpm --filter @maxxuxx/docs manifest:check
node -e "const fs=require('node:fs');const m=JSON.parse(fs.readFileSync('apps/docs/public/design-system/components.json','utf8'));const c=m.components.find((x)=>x.name==='TextField');if(!c||!c.figmaUrl.startsWith('https://www.figma.com/')){console.error('Missing reconciled Figma URL: TextField');process.exit(1)}"
```

Expected after each plan 04 reconciliation: run only that component's two-command pair; both exit `0`. An unreconciled blank URL blocks the next plan 03 task.

## Exact API and ARIA Precedence

### Icon

1. `name`은 다섯 owned glyph 중 하나이고 `size` default는 `24`다. `size`가 caller의 SVG `width`와 `height`보다 우선한다.
2. component-owned `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, round cap/join이 caller SVG props보다 우선한다. `strokeWidth`는 caller가 바꿀 수 있고 default는 `2`다.
3. `label`을 trim한 결과가 비어 있지 않으면 component가 `role="img"`와 정확한 `aria-label={label}`을 강제하고 `aria-hidden`을 제거한다.
4. `label`이 없거나 whitespace-only면 component가 `aria-hidden="true"`를 강제하고 caller의 `role`과 `aria-label`을 제거한다. `focusable="false"`는 항상 component가 소유한다.
5. 위 고정 attribute를 제외한 SVG props와 ref는 전달된다. Icon selection은 Figma variant axis가 아니라 Button의 instance swap source다.

### Badge

1. defaults는 `size="medium"`, `variant="soft"`, `tone="neutral"`이다.
2. component는 native `<span>`이며 기본 `role`, live-region, keyboard behavior를 만들지 않는다. children이 읽히는 text다. tone만으로 의미를 전달하지 않는다.
3. caller의 native span/ARIA props는 그대로 전달한다. component-owned `data-size`, `data-variant`, `data-tone`은 caller와 충돌하면 component 값이 우선하고 caller class는 `ds-badge` 뒤에 합친다.

### Button

1. defaults는 `type="button"`, `size="medium"`, `variant="fill"`, `width="hug"`, `loading=false`다. caller가 명시한 native `type`은 default보다 우선한다.
2. effective disabled는 `Boolean(disabled || loading)`이고 native `disabled` attribute로 표현한다. 따라서 click, Enter, Space activation은 브라우저가 억제한다.
3. `loading=true`는 caller의 `aria-busy`보다 우선하여 `aria-busy="true"`를 강제한다. loading이 아니면 caller의 `aria-busy`를 보존한다.
4. loading 중 label과 icons는 DOM에 남아 accessible name과 layout width를 보존하되 시각적으로만 opacity `0`이 되고, `aria-hidden` spinner를 overlay한다.
5. component-owned `data-size`, `data-variant`, `data-width`, `data-loading`과 effective `disabled`가 caller 충돌보다 우선한다. 나머지 native button props와 ref는 전달한다.

### TextField

1. `label`은 required visible text다. caller `id`가 있으면 그것을 사용하고, 없으면 `useId()`로 stable input ID를 만든다. `<label htmlFor>`는 항상 최종 input ID를 가리킨다.
2. native accessible-name precedence를 보존한다: caller `aria-labelledby` > caller `aria-label` > visible `<label>`. visible label 자체는 어떤 경우에도 DOM에서 제거하지 않는다.
3. generated description ID, generated error ID, caller `aria-describedby` IDs 순서로 합치고 공백 단위 duplicate를 제거한다. description과 error가 함께 있으면 description ID가 반드시 먼저다.
4. `errorMessage` prop이 제공되면 caller `aria-invalid`보다 우선하여 `aria-invalid="true"`, generated `aria-errormessage`, `role="alert"`를 강제한다. error prop이 없으면 caller의 `aria-invalid`와 `aria-errormessage`를 보존한다.
5. visual state precedence는 `Disabled > Error > Focus > Default`다. CSS order와 selectors가 이 순서를 보장한다.
6. `size`는 design-system size prop이므로 numeric HTML input `size`는 API에서 제외한다. 나머지 native input props와 ref는 전달한다.

---

## File Map

### Shared React harness

- Create: `packages/react/tsconfig.json`
- Create: `packages/react/vitest.config.ts`
- Create: `packages/react/src/test/setup.ts`
- Create: `packages/react/src/test/accessibility.ts`
- Create and cumulatively modify: `packages/react/src/styles.css`
- Create and cumulatively modify: `packages/react/src/index.ts`
- Modify once: `apps/docs/src/layouts/BaseLayout.astro`
- Create once: `apps/docs/src/components/examples/examples.css`
- Create and cumulatively modify: `apps/docs/tests/e2e/component-slices.visual.spec.ts`

### Icon slice

- Create: `packages/react/src/icon/paths.ts`
- Create: `packages/react/src/icon/Icon.tsx`
- Create: `packages/react/src/icon/Icon.css`
- Create: `packages/react/src/icon/Icon.test.tsx`
- Create: `packages/react/src/icon/index.ts`
- Create: `apps/docs/src/components/examples/IconExample.tsx`
- Create: `apps/docs/src/content/components/icon.mdx`
- Generate: `apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/icon-mobile-chromium.png`
- Generate: `apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/icon-desktop-chromium.png`

### Badge slice

- Create: `packages/react/src/badge/Badge.tsx`
- Create: `packages/react/src/badge/Badge.css`
- Create: `packages/react/src/badge/Badge.test.tsx`
- Create: `packages/react/src/badge/index.ts`
- Create: `apps/docs/src/components/examples/BadgeExample.tsx`
- Create: `apps/docs/src/content/components/badge.mdx`
- Generate: `apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/badge-mobile-chromium.png`
- Generate: `apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/badge-desktop-chromium.png`

### Button slice

- Create: `packages/react/src/button/Button.tsx`
- Create: `packages/react/src/button/Button.css`
- Create: `packages/react/src/button/Button.test.tsx`
- Create: `packages/react/src/button/index.ts`
- Create: `apps/docs/src/components/examples/ButtonExample.tsx`
- Create: `apps/docs/src/content/components/button.mdx`
- Generate: `apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/button-mobile-chromium.png`
- Generate: `apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/button-desktop-chromium.png`

### TextField slice

- Create: `packages/react/src/text-field/TextField.tsx`
- Create: `packages/react/src/text-field/TextField.css`
- Create: `packages/react/src/text-field/TextField.test.tsx`
- Create: `packages/react/src/text-field/index.ts`
- Create: `apps/docs/src/components/examples/TextFieldExample.tsx`
- Create: `apps/docs/src/content/components/text-field.mdx`
- Generate: `apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/text-field-mobile-chromium.png`
- Generate: `apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/text-field-desktop-chromium.png`

### Generated manifest

- Generate and cumulatively modify after every MDX addition: `apps/docs/public/design-system/components.json`

---

### Task 1: Build the React harness and complete Icon

**Files:**
- Create: all shared React harness files listed above.
- Create: all Icon slice files listed above.
- Modify: `apps/docs/src/layouts/BaseLayout.astro`.
- Generate: Icon mobile/desktop screenshots and one-entry `components.json`.

**Interfaces:**
- Consumes: token variables `size/icon/small|medium|large` and `color/icon/primary`.
- Produces: `ICON_NAMES`, `ICON_PATHS`, `ICON_SVGS`, `Icon`, `IconName`, `IconSize`, `IconProps`.
- Produces: `expectNoAxeViolations(container)` for all later component tests.
- Produces: stable selector `[data-component-demo="icon"]` and route `/components/icon/`.

- [ ] **Step 1: Create the shared test harness and write the failing Icon test**

Create `packages/react/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "vitest.config.ts"]
}
```

Create `packages/react/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.tsx'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

Create `packages/react/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);
```

Create `packages/react/src/test/accessibility.ts`:

```ts
import axe from 'axe-core';
import { expect } from 'vitest';

export async function expectNoAxeViolations(container: Element): Promise<void> {
  const results = await axe.run(container);
  expect(results.violations).toEqual([]);
}
```

Create `packages/react/src/icon/Icon.test.tsx` before `Icon.tsx` exists:

```tsx
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../test/accessibility';
import { Icon } from './Icon';
import { ICON_NAMES, ICON_PATHS, ICON_SVGS } from './paths';

describe('Icon', () => {
  it('renders the default 24px decorative icon', () => {
    render(<Icon data-testid="icon" name="check" />);
    const icon = screen.getByTestId('icon');

    expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
    expect(icon).toHaveAttribute('width', '24');
    expect(icon).toHaveAttribute('height', '24');
    expect(icon).toHaveAttribute('fill', 'none');
    expect(icon).toHaveAttribute('stroke', 'currentColor');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('focusable', 'false');
    expect(icon).not.toHaveAttribute('role');
    expect(icon).not.toHaveAttribute('aria-label');
  });

  it('owns path data and complete SVG strings for all five names', () => {
    for (const name of ICON_NAMES) {
      const { container, unmount } = render(<Icon name={name} />);
      expect(container.querySelectorAll('path')).toHaveLength(ICON_PATHS[name].length);
      expect(ICON_SVGS[name]).toContain('<svg');
      for (const path of ICON_PATHS[name]) {
        expect(ICON_SVGS[name]).toContain(`d="${path}"`);
      }
      unmount();
    }
  });

  it('lets size win over forwarded width and height while forwarding other SVG props', () => {
    render(
      <Icon
        className="consumer-icon"
        data-testid="icon"
        name="search"
        size={16}
        strokeWidth={1.5}
        width={99}
        height={99}
      />,
    );
    const icon = screen.getByTestId('icon');

    expect(icon).toHaveClass('ds-icon', 'consumer-icon');
    expect(icon).toHaveAttribute('data-size', '16');
    expect(icon).toHaveAttribute('width', '16');
    expect(icon).toHaveAttribute('height', '16');
    expect(icon).toHaveAttribute('stroke-width', '1.5');
  });

  it('trims a non-empty label and emits labelled image semantics', () => {
    render(<Icon data-testid="icon" label="  검색  " name="search" />);
    const icon = screen.getByTestId('icon');

    expect(icon).toHaveAttribute('role', 'img');
    expect(icon).toHaveAttribute('aria-label', '검색');
    expect(icon).not.toHaveAttribute('aria-hidden');
  });

  it('forces whitespace-labelled icons back to decorative semantics', () => {
    render(<Icon data-testid="icon" label="   " name="info" />);
    const icon = screen.getByTestId('icon');

    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).not.toHaveAttribute('role');
    expect(icon).not.toHaveAttribute('aria-label');
  });

  it('forwards its SVG ref', () => {
    const ref = createRef<SVGSVGElement>();
    render(<Icon ref={ref} name="close" />);
    expect(ref.current).toBeInstanceOf(SVGSVGElement);
  });

  it('has no axe violations in decorative and labelled modes', async () => {
    const { container } = render(
      <div>
        <Icon name="check" />
        <Icon label="정보" name="info" />
      </div>,
    );
    await expectNoAxeViolations(container);
  });
});
```

- [ ] **Step 2: Run the Icon red test**

Run:

```powershell
corepack pnpm --filter @maxxuxx/react test -- Icon.test.tsx
```

Expected: exit non-zero; Vitest reports it cannot resolve `./Icon` and `./paths`. No test is allowed to pass before the production files exist.

- [ ] **Step 3: Implement the complete owned Icon source and package exports**

Create `packages/react/src/icon/paths.ts`:

```ts
export const ICON_NAMES = ['check', 'chevron-right', 'close', 'info', 'search'] as const;

export type IconName = (typeof ICON_NAMES)[number];

export const ICON_PATHS = {
  check: ['M5 12.5 9.5 17 19 7.5'],
  'chevron-right': ['M9 5 16 12 9 19'],
  close: ['M6 6 18 18', 'M18 6 6 18'],
  info: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 11v5', 'M12 8h.01'],
  search: ['M10.8 18a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4Z', 'M16 16 21 21'],
} as const satisfies Record<IconName, readonly string[]>;

function createSvg(paths: readonly string[]): string {
  const body = paths.map((path) => `<path d="${path}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

export const ICON_SVGS = Object.fromEntries(
  ICON_NAMES.map((name) => [name, createSvg(ICON_PATHS[name])]),
) as Record<IconName, string>;
```

Create `packages/react/src/icon/Icon.tsx`:

```tsx
import { forwardRef, type SVGProps } from 'react';
import { ICON_PATHS, type IconName } from './paths';

export type IconSize = 16 | 20 | 24;

export interface IconProps extends Omit<
  SVGProps<SVGSVGElement>,
  'children' | 'role' | 'aria-label' | 'aria-hidden'
> {
  name: IconName;
  size?: IconSize;
  label?: string;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { className, label, name, size = 24, strokeWidth = 2, ...svgProps },
  ref,
) {
  const accessibleLabel = typeof label === 'string' ? label.trim() : '';
  const isLabelled = accessibleLabel.length > 0;
  const classes = ['ds-icon', className].filter(Boolean).join(' ');

  return (
    <svg
      {...svgProps}
      ref={ref}
      aria-hidden={isLabelled ? undefined : true}
      aria-label={isLabelled ? accessibleLabel : undefined}
      className={classes}
      data-size={size}
      fill="none"
      focusable="false"
      height={size}
      role={isLabelled ? 'img' : undefined}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
    >
      {ICON_PATHS[name].map((path) => (
        <path d={path} key={path} />
      ))}
    </svg>
  );
});
```

Create `packages/react/src/icon/Icon.css`:

```css
.ds-icon {
  display: inline-block;
  flex: 0 0 auto;
  vertical-align: -0.125em;
}

.ds-icon[data-size='16'] {
  width: var(--ds-size-icon-small);
  height: var(--ds-size-icon-small);
}

.ds-icon[data-size='20'] {
  width: var(--ds-size-icon-medium);
  height: var(--ds-size-icon-medium);
}

.ds-icon[data-size='24'] {
  width: var(--ds-size-icon-large);
  height: var(--ds-size-icon-large);
}
```

Create `packages/react/src/icon/index.ts`:

```ts
export { Icon } from './Icon';
export type { IconProps, IconSize } from './Icon';
export { ICON_NAMES, ICON_PATHS, ICON_SVGS } from './paths';
export type { IconName } from './paths';
```

Create `packages/react/src/styles.css`:

```css
@import './icon/Icon.css';
```

Create `packages/react/src/index.ts`:

```ts
export * from './icon';
```

- [ ] **Step 4: Run the Icon green test and package check**

Run:

```powershell
corepack pnpm --filter @maxxuxx/react test -- Icon.test.tsx
corepack pnpm --filter @maxxuxx/react check
```

Expected: seven Icon tests pass; TypeScript exits `0` with no diagnostics.

- [ ] **Step 5: Add React CSS to the docs layout and create shared demo styling**

Replace `apps/docs/src/layouts/BaseLayout.astro` with the complete code shown in the plan 02 handoff plus this one additional package-style import. Use the exact complete body in the next code block; do not add a second token import or import component styles from individual MDX files.

```astro
---
import '@maxxuxx/tokens/tokens.css';
import '@maxxuxx/react/styles.css';
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
}

const { title, description = '사람과 AI가 함께 읽는 로컬 디자인 시스템 문서입니다.' } = Astro.props;
const documentTitle = title === 'AI-Readable Design System v0.1'
  ? title
  : `${title} | AI-Readable Design System v0.1`;
---

<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content={description} />
    <title>{documentTitle}</title>
  </head>
  <body>
    <a class="skip-link" href="#main-content">본문으로 건너뛰기</a>
    <slot />
  </body>
</html>
```

Create `apps/docs/src/components/examples/examples.css`:

```css
.component-demo {
  display: grid;
  min-width: 0;
  gap: var(--ds-space-24);
}

.component-demo__controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--ds-space-16);
}

.component-demo__control {
  display: grid;
  gap: var(--ds-space-8);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-body-sm);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-font-line-height-body-sm);
}

.component-demo__control select,
.component-demo__control input[type='text'] {
  box-sizing: border-box;
  width: 100%;
  min-height: var(--ds-size-control-small);
  padding-inline: var(--ds-space-12);
  color: var(--ds-color-text-primary);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  font: inherit;
}

.component-demo__control select:focus-visible,
.component-demo__control input[type='text']:focus-visible {
  border-color: var(--ds-color-border-focus);
  outline: none;
  box-shadow: 0 0 0 var(--ds-space-4) var(--ds-color-focus-ring);
}

.component-demo__toggle {
  display: inline-flex;
  min-height: var(--ds-size-control-small);
  align-items: center;
  gap: var(--ds-space-8);
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-body-sm);
  line-height: var(--ds-font-line-height-body-sm);
}

.component-demo__toggle input {
  width: var(--ds-size-icon-medium);
  height: var(--ds-size-icon-medium);
  accent-color: var(--ds-color-action-primary);
}

.component-demo__stage {
  display: grid;
  min-width: 0;
  min-height: 160px;
  place-items: center;
  gap: var(--ds-space-16);
  padding: var(--ds-space-24);
  color: var(--ds-color-text-primary);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
}

.component-demo__grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--ds-space-12);
}

.component-demo__item {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-8);
  padding: var(--ds-space-16);
  background: var(--ds-color-bg-subtle);
  border-radius: var(--ds-radius-md);
  color: var(--ds-color-text-primary);
  text-align: center;
}

.component-demo__item--stacked {
  flex-direction: column;
}

.component-demo__label {
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-caption);
  line-height: var(--ds-font-line-height-caption);
}

.component-demo__stack {
  display: grid;
  width: 100%;
  gap: var(--ds-space-16);
}

@media (max-width: 480px) {
  .component-demo__controls,
  .component-demo__grid {
    grid-template-columns: 1fr;
  }

  .component-demo__stage {
    padding: var(--ds-space-16);
  }
}
```

- [ ] **Step 6: Create the complete Icon demo and MDX source**

Create `apps/docs/src/components/examples/IconExample.tsx`:

```tsx
import { useState } from 'react';
import { ICON_NAMES, Icon, type IconName, type IconSize } from '@maxxuxx/react';
import './examples.css';

const ICON_SIZES: IconSize[] = [16, 20, 24];

export default function IconExample() {
  const [name, setName] = useState<IconName>('search');
  const [size, setSize] = useState<IconSize>(24);
  const [labelled, setLabelled] = useState(true);

  return (
    <div className="component-demo" data-component-demo="icon">
      <div className="component-demo__controls">
        <label className="component-demo__control">
          이름
          <select value={name} onChange={(event) => setName(event.target.value as IconName)}>
            {ICON_NAMES.map((iconName) => (
              <option key={iconName} value={iconName}>
                {iconName}
              </option>
            ))}
          </select>
        </label>
        <label className="component-demo__control">
          크기
          <select value={size} onChange={(event) => setSize(Number(event.target.value) as IconSize)}>
            {ICON_SIZES.map((iconSize) => (
              <option key={iconSize} value={iconSize}>
                {iconSize}px
              </option>
            ))}
          </select>
        </label>
        <label className="component-demo__toggle">
          <input
            checked={labelled}
            type="checkbox"
            onChange={(event) => setLabelled(event.target.checked)}
          />
          단독 아이콘 이름 제공
        </label>
      </div>

      <div className="component-demo__stage">
        <Icon label={labelled ? `선택한 ${name} 아이콘` : undefined} name={name} size={size} />
        <div className="component-demo__grid">
          {ICON_NAMES.map((iconName) => (
            <div className="component-demo__item component-demo__item--stacked" key={iconName}>
              <Icon name={iconName} size={size} />
              <span className="component-demo__label">{iconName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

Create `apps/docs/src/content/components/icon.mdx`:

````mdx
---
name: Icon
slug: icon
description: 익숙한 인터페이스 동작을 텍스트 중복 없이 전달하는 다섯 개의 owned stroke glyph입니다.
status: preview
figmaUrl: ""
frameworks:
  react: preview
  svelte: planned
  reactNative: planned
variants: [check, chevron-right, close, info, search]
sizes: ["16", "20", "24"]
states: [decorative, labelled]
accessibility: label이 없으면 장식용으로 숨기고, 단독 의미를 전달할 때는 label로 img role과 accessible name을 제공합니다.
props:
  - name: name
    type: IconName
    required: true
    defaultValue: null
    description: check, chevron-right, close, info, search 중 하나입니다.
  - name: size
    type: IconSize
    required: false
    defaultValue: "24"
    description: 16, 20, 24 중 렌더링 크기입니다.
  - name: label
    type: string
    required: false
    defaultValue: null
    description: 단독 아이콘의 accessible name입니다. 비어 있으면 장식용입니다.
  - name: ...svgProps
    type: "Omit<SVGProps<SVGSVGElement>, 'children' | 'role' | 'aria-label' | 'aria-hidden'>"
    required: false
    defaultValue: null
    description: component-owned geometry와 ARIA를 제외한 native SVG props입니다.
tokens:
  - size/icon/small
  - size/icon/medium
  - size/icon/large
  - color/icon/primary
---

import ComponentPreview from '../../components/ComponentPreview.astro';
import IconExample from '../../components/examples/IconExample';
import { ICON_NAMES, Icon } from '@maxxuxx/react';

## 예제

<ComponentPreview title="다섯 아이콘" description="이름, 크기, accessible label 여부를 바꿔 보세요.">
  <IconExample client:load />
</ComponentPreview>

<div className="component-demo__grid">
  {ICON_NAMES.map((name) => (
    <div className="component-demo__item component-demo__item--stacked">
      <Icon name={name} />
      <span className="component-demo__label">{name}</span>
    </div>
  ))}
</div>

## 사용해야 할 때

확인, 다음 이동, 닫기, 정보, 검색처럼 이미 익숙한 기능을 좁은 공간에서 보조할 때 사용합니다. 텍스트 버튼 안의 leading/trailing 시각 단서에도 사용합니다.

## 사용하지 말아야 할 때

의미가 불분명한 장식, 브랜드 로고, 긴 설명의 대체물로 사용하지 않습니다. 아이콘만으로 기능을 이해하기 어렵다면 visible text를 우선합니다.

## 구조

24px viewBox 안의 repository-owned stroke path로 구성됩니다. icon name은 서로 다른 component source이며 하나의 name variant axis가 아닙니다.

## 크기와 변형

`16`, `20`, `24` 세 크기와 `check`, `chevron-right`, `close`, `info`, `search` 다섯 이름을 제공합니다. 기본 크기는 `24`입니다.

## 상태와 동작

Icon 자체에는 hover, pressed, disabled 상태가 없습니다. 색상과 interaction state는 Icon을 포함한 Button이나 링크가 소유합니다.

## 반응형 동작

모바일과 데스크톱에서 같은 24px geometry를 사용합니다. 주변 control의 touch target은 Icon이 아니라 control이 책임집니다.

## 접근성

`label`이 없거나 공백뿐이면 `aria-hidden="true"`입니다. 단독으로 의미를 전달할 때 non-empty `label`을 주면 `role="img"`와 `aria-label`이 생성됩니다. visible text와 함께 쓰는 아이콘은 장식용으로 둡니다.

## React 예제

```tsx
import { Icon } from '@maxxuxx/react';
import '@maxxuxx/react/styles.css';

export function SearchLabel() {
  return (
    <span>
      <Icon name="search" size={20} />
      검색
    </span>
  );
}
```

## API

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `name` | `IconName` | required | 다섯 owned glyph 중 하나 |
| `size` | `16 \| 20 \| 24` | `24` | width와 height를 함께 결정 |
| `label` | `string` | 없음 | 단독 아이콘의 accessible name |
| native SVG props | `Omit<SVGProps<SVGSVGElement>, 'children' \| 'role' \| 'aria-label' \| 'aria-hidden'>` | 없음 | 고정 geometry/ARIA 외 SVG props |

`label`과 `size`가 충돌하는 native ARIA/size props보다 우선합니다.

## 사용 토큰

- `size/icon/small`, `size/icon/medium`, `size/icon/large`
- 기본값 `color/icon/primary` 또는 consumer context가 제공하는 다른 semantic current color

## Figma

Pre-Figma contract는 다섯 개의 24px master component와 16/20/24 documentation instance입니다. 이 계획에서는 Figma를 변경하지 않으므로 `figmaUrl`은 의도적으로 빈 문자열입니다.

## 지원 상태

| React | Svelte | React Native |
|---|---|---|
| preview | planned | planned |
````

- [ ] **Step 7: Run the Icon manifest red/green cycle and docs build**

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:check
```

Expected red: exit non-zero with `Stale component manifest: <absolute path>. Run "pnpm manifest:write".` because Icon MDX is not in the committed JSON yet.

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:write
corepack pnpm --filter @maxxuxx/docs manifest:check
corepack pnpm --filter @maxxuxx/docs build
```

Expected green: write reports the absolute `components.json` path; check and build exit `0`; manifest has exactly one entry (`Icon`) and `/components/icon/` exists in `apps/docs/dist`.

- [ ] **Step 8: Add the Icon-only visual spec**

Create `apps/docs/tests/e2e/component-slices.visual.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { expectPageScreenshot } from './support/visual';

const slices = [{ name: 'Icon', slug: 'icon' }] as const;

for (const slice of slices) {
  test(`${slice.name} component slice`, async ({ page }, testInfo) => {
    test.skip(process.platform !== 'win32', 'Visual baselines are Windows Chromium only.');
    test.skip(testInfo.project.name === 'tablet-chromium', 'Plan 02 owns tablet responsive coverage.');

    await page.goto(`/components/${slice.slug}/`);
    await expect(page.getByRole('heading', { level: 1, name: slice.name })).toBeVisible();
    await expect(page.locator(`[data-component-demo="${slice.slug}"]`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expectPageScreenshot(page, testInfo, slice.slug);
  });
}
```

- [ ] **Step 9: Generate, inspect, and compare Icon mobile/desktop baselines**

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs test:e2e -- --project=mobile-chromium --project=desktop-chromium --grep "Icon component slice" --update-snapshots
Get-Item 'apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/icon-mobile-chromium.png'
Get-Item 'apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/icon-desktop-chromium.png'
corepack pnpm --filter @maxxuxx/docs test:e2e -- --project=mobile-chromium --project=desktop-chromium --grep "Icon component slice"
```

Expected: the update command writes exactly the two named PNGs; inspect both images and confirm all five glyphs render, strokes are unclipped, the controls do not overflow, and 16/20/24 selection remains legible; the comparison run reports `2 passed` and writes no files.

- [ ] **Step 10: Run the slice guard and commit Icon**

Run:

```powershell
$primitiveMatches = @(rg -n -- '--ds-color-(neutral|blue|red|green)-' packages/react/src/icon apps/docs/src/components/examples/IconExample.tsx apps/docs/src/content/components/icon.mdx 2>$null)
if ($LASTEXITCODE -eq 0) { $primitiveMatches; throw 'Primitive color reference found in Icon slice.' }
if ($LASTEXITCODE -ne 1) { throw "rg failed with exit code $LASTEXITCODE" }
corepack pnpm --filter @maxxuxx/react test -- Icon.test.tsx
corepack pnpm --filter @maxxuxx/react check
corepack pnpm --filter @maxxuxx/docs manifest:check
corepack pnpm --filter @maxxuxx/docs build
```

Expected: the wrapper exits `0` with no output; every pnpm command exits `0`.

Commit only the Icon slice:

```powershell
git add packages/react/tsconfig.json packages/react/vitest.config.ts packages/react/src/test/setup.ts packages/react/src/test/accessibility.ts packages/react/src/icon/paths.ts packages/react/src/icon/Icon.tsx packages/react/src/icon/Icon.css packages/react/src/icon/Icon.test.tsx packages/react/src/icon/index.ts packages/react/src/styles.css packages/react/src/index.ts apps/docs/src/layouts/BaseLayout.astro apps/docs/src/components/examples/examples.css apps/docs/src/components/examples/IconExample.tsx apps/docs/src/content/components/icon.mdx apps/docs/public/design-system/components.json apps/docs/tests/e2e/component-slices.visual.spec.ts apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/icon-mobile-chromium.png apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/icon-desktop-chromium.png
git commit -m "feat(icon): add accessible icon pilot"
```

- [ ] **Step 11: Stop at the Icon pre-Figma checkpoint**

Run `corepack pnpm --filter @maxxuxx/docs manifest:release-check`; expect `Release manifest is missing components: Badge, Button, TextField`. Hand the committed Icon source, MDX entry, and two Icon PNGs to plan 04 Task 4. Resume Task 2 only after plan 04 writes the actual Icon URL and the exact Icon readback pair in the checkpoint contract exits `0`.

### Task 2: Complete Badge

**Files:**
- Create: all Badge slice files in the File Map.
- Modify: `packages/react/src/styles.css`, `packages/react/src/index.ts`, `apps/docs/tests/e2e/component-slices.visual.spec.ts`.
- Generate: Badge mobile/desktop screenshots and the two-entry `components.json`.

**Interfaces:**
- Consumes: semantic status/action colors, badge size tokens, radius/type/spacing tokens.
- Produces: `Badge`, `BadgeProps`, `BadgeSize`, `BadgeVariant`, `BadgeTone`.
- Produces: stable selector `[data-component-demo="badge"]` and route `/components/badge/`.

- [ ] **Step 1: Write the failing Badge tests**

Create `packages/react/src/badge/Badge.test.tsx` before `Badge.tsx` exists:

```tsx
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../test/accessibility';
import { Badge, type BadgeSize, type BadgeTone, type BadgeVariant } from './Badge';

const sizes: BadgeSize[] = ['small', 'medium'];
const variants: BadgeVariant[] = ['soft', 'solid'];
const tones: BadgeTone[] = ['neutral', 'primary', 'success', 'danger'];

describe('Badge', () => {
  it('uses the medium soft neutral defaults on a span', () => {
    render(<Badge>신규</Badge>);
    const badge = screen.getByText('신규');

    expect(badge.tagName).toBe('SPAN');
    expect(badge).toHaveClass('ds-badge');
    expect(badge).toHaveAttribute('data-size', 'medium');
    expect(badge).toHaveAttribute('data-variant', 'soft');
    expect(badge).toHaveAttribute('data-tone', 'neutral');
    expect(badge).not.toHaveAttribute('role');
    expect(badge).not.toHaveAttribute('tabindex');
  });

  it('renders all 16 size, variant, and tone combinations', () => {
    for (const size of sizes) {
      for (const variant of variants) {
        for (const tone of tones) {
          const { getByText, unmount } = render(
            <Badge size={size} tone={tone} variant={variant}>
              {`${size}-${variant}-${tone}`}
            </Badge>,
          );
          const badge = getByText(`${size}-${variant}-${tone}`);
          expect(badge).toHaveAttribute('data-size', size);
          expect(badge).toHaveAttribute('data-variant', variant);
          expect(badge).toHaveAttribute('data-tone', tone);
          unmount();
        }
      }
    }
  });

  it('keeps component data authoritative and forwards native span props', () => {
    render(
      <Badge
        aria-label="주문 상태: 완료"
        className="consumer-badge"
        data-size="consumer"
        data-testid="badge"
        size="small"
      >
        완료
      </Badge>,
    );
    const badge = screen.getByTestId('badge');

    expect(badge).toHaveClass('ds-badge', 'consumer-badge');
    expect(badge).toHaveAttribute('data-size', 'small');
    expect(badge).toHaveAttribute('aria-label', '주문 상태: 완료');
  });

  it('forwards its span ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Badge ref={ref}>상태</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Badge tone="neutral">대기</Badge>
        <Badge tone="success" variant="solid">완료</Badge>
        <Badge tone="danger">실패</Badge>
      </div>,
    );
    await expectNoAxeViolations(container);
  });
});
```

- [ ] **Step 2: Run the Badge red test**

Run:

```powershell
corepack pnpm --filter @maxxuxx/react test -- Badge.test.tsx
```

Expected: exit non-zero because Vitest cannot resolve `./Badge`.

- [ ] **Step 3: Implement Badge, its semantic CSS, and cumulative exports**

Create `packages/react/src/badge/Badge.tsx`:

```tsx
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

export type BadgeSize = 'small' | 'medium';
export type BadgeVariant = 'soft' | 'solid';
export type BadgeTone = 'neutral' | 'primary' | 'success' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  size?: BadgeSize;
  variant?: BadgeVariant;
  tone?: BadgeTone;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { children, className, size = 'medium', tone = 'neutral', variant = 'soft', ...spanProps },
  ref,
) {
  const classes = ['ds-badge', className].filter(Boolean).join(' ');

  return (
    <span
      {...spanProps}
      ref={ref}
      className={classes}
      data-size={size}
      data-tone={tone}
      data-variant={variant}
    >
      {children}
    </span>
  );
});
```

Create `packages/react/src/badge/Badge.css`:

```css
.ds-badge {
  display: inline-flex;
  box-sizing: border-box;
  max-width: 100%;
  align-items: center;
  justify-content: center;
  border-radius: var(--ds-radius-full);
  font-family: var(--ds-font-family-sans);
  font-weight: var(--ds-font-weight-semibold);
  white-space: nowrap;
}

.ds-badge[data-size='small'] {
  height: var(--ds-size-badge-small);
  padding-inline: var(--ds-space-8);
  font-size: var(--ds-font-size-caption);
  line-height: var(--ds-font-line-height-caption);
}

.ds-badge[data-size='medium'] {
  height: var(--ds-size-badge-medium);
  padding-inline: calc(var(--ds-space-8) + var(--ds-space-2));
  font-size: var(--ds-font-size-body-sm);
  line-height: var(--ds-font-line-height-body-sm);
}

.ds-badge[data-variant='soft'][data-tone='neutral'] {
  color: var(--ds-color-status-neutral);
  background: var(--ds-color-status-neutral-subtle);
}

.ds-badge[data-variant='soft'][data-tone='primary'] {
  color: var(--ds-color-action-on-weak);
  background: var(--ds-color-action-weak);
}

.ds-badge[data-variant='soft'][data-tone='success'] {
  color: var(--ds-color-status-success);
  background: var(--ds-color-status-success-subtle);
}

.ds-badge[data-variant='soft'][data-tone='danger'] {
  color: var(--ds-color-status-danger);
  background: var(--ds-color-status-danger-subtle);
}

.ds-badge[data-variant='solid'][data-tone='neutral'] {
  color: var(--ds-color-status-on-status);
  background: var(--ds-color-status-neutral);
}

.ds-badge[data-variant='solid'][data-tone='primary'] {
  color: var(--ds-color-action-on-primary);
  background: var(--ds-color-action-primary);
}

.ds-badge[data-variant='solid'][data-tone='success'] {
  color: var(--ds-color-status-on-status);
  background: var(--ds-color-status-success);
}

.ds-badge[data-variant='solid'][data-tone='danger'] {
  color: var(--ds-color-status-on-status);
  background: var(--ds-color-status-danger);
}
```

Create `packages/react/src/badge/index.ts`:

```ts
export { Badge } from './Badge';
export type { BadgeProps, BadgeSize, BadgeTone, BadgeVariant } from './Badge';
```

Replace `packages/react/src/styles.css` with:

```css
@import './icon/Icon.css';
@import './badge/Badge.css';
```

Replace `packages/react/src/index.ts` with:

```ts
export * from './icon';
export * from './badge';
```

- [ ] **Step 4: Run the Badge green test and package check**

Run:

```powershell
corepack pnpm --filter @maxxuxx/react test -- Badge.test.tsx
corepack pnpm --filter @maxxuxx/react check
```

Expected: five Badge tests pass; TypeScript exits `0`.

- [ ] **Step 5: Create the complete Badge demo and MDX source**

Create `apps/docs/src/components/examples/BadgeExample.tsx`:

```tsx
import { useState } from 'react';
import {
  Badge,
  type BadgeSize,
  type BadgeTone,
  type BadgeVariant,
} from '@maxxuxx/react';
import './examples.css';

const SIZES: BadgeSize[] = ['small', 'medium'];
const VARIANTS: BadgeVariant[] = ['soft', 'solid'];
const TONES: BadgeTone[] = ['neutral', 'primary', 'success', 'danger'];

export default function BadgeExample() {
  const [size, setSize] = useState<BadgeSize>('medium');
  const [variant, setVariant] = useState<BadgeVariant>('soft');
  const [tone, setTone] = useState<BadgeTone>('neutral');

  return (
    <div className="component-demo" data-component-demo="badge">
      <div className="component-demo__controls">
        <label className="component-demo__control">
          크기
          <select value={size} onChange={(event) => setSize(event.target.value as BadgeSize)}>
            {SIZES.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="component-demo__control">
          변형
          <select value={variant} onChange={(event) => setVariant(event.target.value as BadgeVariant)}>
            {VARIANTS.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="component-demo__control">
          톤
          <select value={tone} onChange={(event) => setTone(event.target.value as BadgeTone)}>
            {TONES.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      </div>

      <div className="component-demo__stage">
        <Badge size={size} tone={tone} variant={variant}>선택한 상태</Badge>
        <div className="component-demo__grid">
          {SIZES.flatMap((badgeSize) =>
            VARIANTS.flatMap((badgeVariant) =>
              TONES.map((badgeTone) => (
                <div
                  className="component-demo__item component-demo__item--stacked"
                  key={`${badgeSize}-${badgeVariant}-${badgeTone}`}
                >
                  <Badge size={badgeSize} tone={badgeTone} variant={badgeVariant}>상태</Badge>
                  <span className="component-demo__label">
                    {badgeSize} · {badgeVariant} · {badgeTone}
                  </span>
                </div>
              )),
            ),
          )}
        </div>
      </div>
    </div>
  );
}
```

Create `apps/docs/src/content/components/badge.mdx`:

````mdx
---
name: Badge
slug: badge
description: 짧은 상태나 범주 메타데이터를 비대화식으로 표시하는 compact label입니다.
status: preview
figmaUrl: ""
frameworks:
  react: preview
  svelte: planned
  reactNative: planned
variants: [soft, solid, neutral, primary, success, danger]
sizes: [small, medium]
states: [default]
accessibility: native span과 visible children을 유지하며 tone만으로 상태 의미를 전달하지 않습니다.
props:
  - name: children
    type: ReactNode
    required: true
    defaultValue: null
    description: 짧고 직접적인 badge label입니다.
  - name: size
    type: BadgeSize
    required: false
    defaultValue: medium
    description: small 또는 medium 높이입니다.
  - name: variant
    type: BadgeVariant
    required: false
    defaultValue: soft
    description: soft 또는 solid 시각 강도입니다.
  - name: tone
    type: BadgeTone
    required: false
    defaultValue: neutral
    description: neutral, primary, success, danger 중 의미 tone입니다.
  - name: ...spanProps
    type: "HTMLAttributes<HTMLSpanElement>"
    required: false
    defaultValue: null
    description: native span props와 ARIA attributes입니다.
tokens:
  - size/badge/small
  - size/badge/medium
  - radius/full
  - color/status/neutral
  - color/status/neutral-subtle
  - color/status/success
  - color/status/success-subtle
  - color/status/danger
  - color/status/danger-subtle
  - color/status/on-status
  - color/action/primary
  - color/action/weak
  - color/action/on-primary
  - color/action/on-weak
---

import ComponentPreview from '../../components/ComponentPreview.astro';
import BadgeExample from '../../components/examples/BadgeExample';
import { Badge } from '@maxxuxx/react';

## 예제

<ComponentPreview title="Badge 조합" description="두 크기, 두 변형, 네 tone의 16개 조합을 함께 확인합니다.">
  <BadgeExample client:load />
</ComponentPreview>

<p><Badge tone="success">승인됨</Badge> <Badge tone="danger" variant="solid">확인 필요</Badge></p>

## 사용해야 할 때

주문의 진행 상태, 짧은 범주, 새 항목 표시처럼 본문을 보조하는 compact metadata에 사용합니다.

## 사용하지 말아야 할 때

버튼, 토글, 링크처럼 interaction이 필요한 요소로 사용하지 않습니다. 긴 문장이나 tone만으로 이해해야 하는 상태에도 사용하지 않습니다.

## 구조

native `span` 안에 한 줄 label을 둡니다. Badge는 icon slot, close action, notification live region을 포함하지 않습니다.

## 크기와 변형

`small`은 20px, `medium`은 24px 높이입니다. `soft`와 `solid`, `neutral`, `primary`, `success`, `danger`를 조합해 총 16개 시각 조합을 만듭니다.

## 상태와 동작

Badge는 비대화식이므로 hover, focus, pressed, disabled 상태가 없습니다. 정보가 바뀌었다는 공지는 Badge가 아니라 surrounding live region이 책임집니다.

## 반응형 동작

모바일과 데스크톱에서 동일한 크기를 유지합니다. label은 한 줄이어야 하며 좁은 화면에서는 surrounding layout이 Badge를 다음 줄로 배치합니다.

## 접근성

visible children이 읽히며 기본 role을 만들지 않습니다. success/danger 색상만으로 의미를 전달하지 말고 `승인됨`, `실패`처럼 의미가 드러나는 label을 사용합니다.

## React 예제

```tsx
import { Badge } from '@maxxuxx/react';
import '@maxxuxx/react/styles.css';

export function OrderStatus() {
  return <Badge tone="success" variant="soft">결제 완료</Badge>;
}
```

## API

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `children` | `ReactNode` | required | 짧은 visible label |
| `size` | `'small' \| 'medium'` | `'medium'` | 20px 또는 24px 높이 |
| `variant` | `'soft' \| 'solid'` | `'soft'` | 시각 강도 |
| `tone` | `'neutral' \| 'primary' \| 'success' \| 'danger'` | `'neutral'` | 의미 tone |
| native span props | `HTMLAttributes<HTMLSpanElement>` | 없음 | span/ARIA attributes |

## 사용 토큰

- `size/badge/small`, `size/badge/medium`, `radius/full`
- `color/status/*` semantic status colors
- `color/action/primary`, `color/action/weak`, `color/action/on-primary`, `color/action/on-weak`

## Figma

Pre-Figma contract는 `Size 2 × Variant 2 × Tone 4 = 16` variants와 `Label` TEXT property입니다. 이 계획에서는 `figmaUrl`이 정확히 빈 문자열입니다.

## 지원 상태

| React | Svelte | React Native |
|---|---|---|
| preview | planned | planned |
````

- [ ] **Step 6: Run the Badge manifest red/green cycle and docs build**

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:check
```

Expected red: exit non-zero with `Stale component manifest: <absolute path>. Run "pnpm manifest:write".`.

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:write
corepack pnpm --filter @maxxuxx/docs manifest:check
corepack pnpm --filter @maxxuxx/docs build
```

Expected green: all exit `0`; manifest order is exactly `Icon, Badge`; `/components/badge/` exists.

- [ ] **Step 7: Replace the visual spec with the accumulated Icon + Badge suite**

Replace `apps/docs/tests/e2e/component-slices.visual.spec.ts` with:

```ts
import { expect, test } from '@playwright/test';
import { expectPageScreenshot } from './support/visual';

const slices = [
  { name: 'Icon', slug: 'icon' },
  { name: 'Badge', slug: 'badge' },
] as const;

for (const slice of slices) {
  test(`${slice.name} component slice`, async ({ page }, testInfo) => {
    test.skip(process.platform !== 'win32', 'Visual baselines are Windows Chromium only.');
    test.skip(testInfo.project.name === 'tablet-chromium', 'Plan 02 owns tablet responsive coverage.');

    await page.goto(`/components/${slice.slug}/`);
    await expect(page.getByRole('heading', { level: 1, name: slice.name })).toBeVisible();
    await expect(page.locator(`[data-component-demo="${slice.slug}"]`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expectPageScreenshot(page, testInfo, slice.slug);
  });
}
```

- [ ] **Step 8: Generate, inspect, and compare Badge mobile/desktop baselines**

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs test:e2e -- --project=mobile-chromium --project=desktop-chromium --grep "Badge component slice" --update-snapshots
Get-Item 'apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/badge-mobile-chromium.png'
Get-Item 'apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/badge-desktop-chromium.png'
corepack pnpm --filter @maxxuxx/docs test:e2e -- --project=mobile-chromium --project=desktop-chromium --grep "Badge component slice"
```

Expected: exactly two new PNGs; visually confirm all 16 combinations, readable short labels, correct 20/24px height difference, no horizontal overflow, and sufficient tone distinction; comparison reports `2 passed`.

- [ ] **Step 9: Run the slice guard and commit Badge**

Run:

```powershell
$primitiveMatches = @(rg -n -- '--ds-color-(neutral|blue|red|green)-' packages/react/src/badge apps/docs/src/components/examples/BadgeExample.tsx apps/docs/src/content/components/badge.mdx 2>$null)
if ($LASTEXITCODE -eq 0) { $primitiveMatches; throw 'Primitive color reference found in Badge slice.' }
if ($LASTEXITCODE -ne 1) { throw "rg failed with exit code $LASTEXITCODE" }
corepack pnpm --filter @maxxuxx/react test -- Badge.test.tsx
corepack pnpm --filter @maxxuxx/react check
corepack pnpm --filter @maxxuxx/docs manifest:check
corepack pnpm --filter @maxxuxx/docs build
```

Expected: the wrapper exits `0` with no output; all pnpm commands exit `0`.

Commit only the Badge slice:

```powershell
git add packages/react/src/badge/Badge.tsx packages/react/src/badge/Badge.css packages/react/src/badge/Badge.test.tsx packages/react/src/badge/index.ts packages/react/src/styles.css packages/react/src/index.ts apps/docs/src/components/examples/BadgeExample.tsx apps/docs/src/content/components/badge.mdx apps/docs/public/design-system/components.json apps/docs/tests/e2e/component-slices.visual.spec.ts apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/badge-mobile-chromium.png apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/badge-desktop-chromium.png
git commit -m "feat(badge): add semantic badge variants"
```

- [ ] **Step 10: Stop at the Badge pre-Figma checkpoint**

Run `corepack pnpm --filter @maxxuxx/docs manifest:release-check`; expect `Release manifest is missing components: Button, TextField`. Hand the committed Badge source, MDX entry, and two Badge PNGs to plan 04 Task 5. Resume Task 3 only after plan 04 writes the actual Badge URL and the exact Badge readback pair exits `0`.

### Task 3: Complete Button

**Files:**
- Create: all Button slice files in the File Map.
- Modify: `packages/react/src/styles.css`, `packages/react/src/index.ts`, `apps/docs/tests/e2e/component-slices.visual.spec.ts`.
- Generate: Button mobile/desktop screenshots and the three-entry `components.json`.

**Interfaces:**
- Consumes: `Icon`, control size tokens, semantic action/background/border/text/focus tokens.
- Produces: `Button`, `ButtonProps`, `ButtonSize`, `ButtonVariant`, `ButtonWidth`.
- Produces: stable selector `[data-component-demo="button"]` and route `/components/button/`.

- [ ] **Step 1: Write the failing Button tests**

Create `packages/react/src/button/Button.test.tsx` before `Button.tsx` exists:

```tsx
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Icon } from '../icon';
import { expectNoAxeViolations } from '../test/accessibility';
import { Button, type ButtonSize, type ButtonVariant, type ButtonWidth } from './Button';

const sizes: ButtonSize[] = ['small', 'medium', 'large'];
const variants: ButtonVariant[] = ['fill', 'weak', 'outline'];
const widths: ButtonWidth[] = ['hug', 'full'];

describe('Button', () => {
  it('defaults to a medium fill hug button with type button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>저장</Button>);
    const button = screen.getByRole('button', { name: '저장' });

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('data-size', 'medium');
    expect(button).toHaveAttribute('data-variant', 'fill');
    expect(button).toHaveAttribute('data-width', 'hug');
    expect(button).toHaveAttribute('data-loading', 'false');
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keeps native Enter and Space activation', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>계속</Button>);
    const button = screen.getByRole('button', { name: '계속' });

    button.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('suppresses activation for disabled and loading buttons', async () => {
    const user = userEvent.setup();
    const disabledClick = vi.fn();
    const loadingClick = vi.fn();
    render(
      <div>
        <Button disabled onClick={disabledClick}>비활성</Button>
        <Button loading onClick={loadingClick}>저장 중</Button>
      </div>,
    );

    const disabled = screen.getByRole('button', { name: '비활성' });
    const loading = screen.getByRole('button', { name: '저장 중' });
    expect(disabled).toBeDisabled();
    expect(loading).toBeDisabled();
    await user.click(disabled);
    await user.click(loading);
    expect(disabledClick).not.toHaveBeenCalled();
    expect(loadingClick).not.toHaveBeenCalled();
  });

  it('makes loading authoritative for aria-busy and preserves the accessible name', () => {
    render(
      <div>
        <Button aria-busy={false}>대기</Button>
        <Button aria-busy={false} loading>결제하기</Button>
      </div>,
    );

    expect(screen.getByRole('button', { name: '대기' })).toHaveAttribute('aria-busy', 'false');
    const loading = screen.getByRole('button', { name: '결제하기' });
    expect(loading).toHaveAttribute('aria-busy', 'true');
    expect(loading.querySelector('.ds-button__spinner')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders every size, variant, and width data contract', () => {
    for (const size of sizes) {
      for (const variant of variants) {
        for (const width of widths) {
          const label = `${size}-${variant}-${width}`;
          const { getByRole, unmount } = render(
            <Button size={size} variant={variant} width={width}>{label}</Button>,
          );
          const button = getByRole('button', { name: label });
          expect(button).toHaveAttribute('data-size', size);
          expect(button).toHaveAttribute('data-variant', variant);
          expect(button).toHaveAttribute('data-width', width);
          unmount();
        }
      }
    }
  });

  it('renders leading and trailing icons without replacing its label', () => {
    render(
      <Button
        leadingIcon={<Icon data-testid="leading" name="search" />}
        trailingIcon={<Icon data-testid="trailing" name="chevron-right" />}
      >
        찾기
      </Button>,
    );

    expect(screen.getByRole('button', { name: '찾기' })).toBeInTheDocument();
    expect(screen.getByTestId('leading')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('trailing')).toHaveAttribute('aria-hidden', 'true');
  });

  it('forwards native props, an explicit type, and its ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button className="consumer-button" data-testid="button" ref={ref} type="submit">
        전송
      </Button>,
    );
    const button = screen.getByTestId('button');

    expect(button).toHaveClass('ds-button', 'consumer-button');
    expect(button).toHaveAttribute('type', 'submit');
    expect(ref.current).toBe(button);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Button>기본</Button>
        <Button disabled>비활성</Button>
        <Button loading>로딩</Button>
        <Button variant="outline">보조</Button>
      </div>,
    );
    await expectNoAxeViolations(container);
  });
});
```

- [ ] **Step 2: Run the Button red test**

Run:

```powershell
corepack pnpm --filter @maxxuxx/react test -- Button.test.tsx
```

Expected: exit non-zero because Vitest cannot resolve `./Button`.

- [ ] **Step 3: Implement Button, its semantic CSS, and cumulative exports**

Create `packages/react/src/button/Button.tsx`:

```tsx
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { IconProps } from '../icon';

export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonVariant = 'fill' | 'weak' | 'outline';
export type ButtonWidth = 'hug' | 'full';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
  width?: ButtonWidth;
  loading?: boolean;
  leadingIcon?: ReactElement<IconProps>;
  trailingIcon?: ReactElement<IconProps>;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    'aria-busy': ariaBusy,
    children,
    className,
    disabled = false,
    leadingIcon,
    loading = false,
    size = 'medium',
    trailingIcon,
    type = 'button',
    variant = 'fill',
    width = 'hug',
    ...buttonProps
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const classes = ['ds-button', className].filter(Boolean).join(' ');

  return (
    <button
      {...buttonProps}
      ref={ref}
      aria-busy={loading ? true : ariaBusy}
      className={classes}
      data-loading={loading}
      data-size={size}
      data-variant={variant}
      data-width={width}
      disabled={isDisabled}
      type={type}
    >
      <span className="ds-button__content">
        {leadingIcon ? <span className="ds-button__icon">{leadingIcon}</span> : null}
        <span className="ds-button__label">{children}</span>
        {trailingIcon ? <span className="ds-button__icon">{trailingIcon}</span> : null}
      </span>
      {loading ? <span aria-hidden="true" className="ds-button__spinner" /> : null}
    </button>
  );
});
```

Create `packages/react/src/button/Button.css`:

```css
.ds-button {
  position: relative;
  display: inline-flex;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: var(--ds-radius-md);
  font-family: var(--ds-font-family-sans);
  font-weight: var(--ds-font-weight-semibold);
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
}

.ds-button[data-size='small'] {
  min-height: var(--ds-size-control-small);
  padding-inline: var(--ds-space-16);
  gap: var(--ds-space-8);
  font-size: var(--ds-font-size-body-sm);
  line-height: var(--ds-font-line-height-body-sm);
}

.ds-button[data-size='medium'] {
  min-height: var(--ds-size-control-medium);
  padding-inline: var(--ds-space-20);
  gap: var(--ds-space-8);
  font-size: var(--ds-font-size-body);
  line-height: var(--ds-font-line-height-body);
}

.ds-button[data-size='large'] {
  min-height: var(--ds-size-control-large);
  padding-inline: var(--ds-space-24);
  gap: var(--ds-space-12);
  font-size: var(--ds-font-size-body-lg);
  line-height: var(--ds-font-line-height-body-lg);
}

.ds-button[data-width='hug'] {
  width: auto;
}

.ds-button[data-width='full'] {
  width: 100%;
}

.ds-button[data-variant='fill'] {
  color: var(--ds-color-action-on-primary);
  background: var(--ds-color-action-primary);
}

.ds-button[data-variant='fill']:not(:disabled):hover {
  background: var(--ds-color-action-primary-hover);
}

.ds-button[data-variant='fill']:not(:disabled):active {
  background: var(--ds-color-action-primary-pressed);
}

.ds-button[data-variant='weak'] {
  color: var(--ds-color-action-on-weak);
  background: var(--ds-color-action-weak);
}

.ds-button[data-variant='weak']:not(:disabled):hover {
  background: var(--ds-color-action-weak-hover);
}

.ds-button[data-variant='weak']:not(:disabled):active {
  color: var(--ds-color-action-primary-pressed);
}

.ds-button[data-variant='outline'] {
  color: var(--ds-color-text-primary);
  background: var(--ds-color-bg-surface);
  border-color: var(--ds-color-border-strong);
}

.ds-button[data-variant='outline']:not(:disabled):hover {
  background: var(--ds-color-bg-subtle);
  border-color: var(--ds-color-border-focus);
}

.ds-button[data-variant='outline']:not(:disabled):active {
  color: var(--ds-color-action-on-weak);
  background: var(--ds-color-action-weak);
}

.ds-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--ds-space-4) var(--ds-color-focus-ring);
}

.ds-button:disabled {
  color: var(--ds-color-text-disabled);
  background: var(--ds-color-bg-subtle);
  border-color: var(--ds-color-border-default);
  cursor: not-allowed;
}

.ds-button__content {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: inherit;
}

.ds-button__icon {
  display: inline-flex;
  align-items: center;
}

.ds-button__label {
  min-width: 0;
}

.ds-button[data-loading='true'] .ds-button__content {
  opacity: 0;
}

.ds-button__spinner {
  position: absolute;
  box-sizing: border-box;
  width: var(--ds-size-icon-medium);
  height: var(--ds-size-icon-medium);
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: var(--ds-radius-full);
  animation: ds-button-spin 700ms linear infinite;
}

@keyframes ds-button-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ds-button,
  .ds-button__spinner {
    transition: none;
    animation: none;
  }
}
```

Create `packages/react/src/button/index.ts`:

```ts
export { Button } from './Button';
export type { ButtonProps, ButtonSize, ButtonVariant, ButtonWidth } from './Button';
```

Replace `packages/react/src/styles.css` with:

```css
@import './icon/Icon.css';
@import './badge/Badge.css';
@import './button/Button.css';
```

Replace `packages/react/src/index.ts` with:

```ts
export * from './icon';
export * from './badge';
export * from './button';
```

- [ ] **Step 4: Run the Button green test and semantic-style guard**

Run:

```powershell
corepack pnpm --filter @maxxuxx/react test -- Button.test.tsx
corepack pnpm --filter @maxxuxx/react check
$primitiveMatches = @(rg -n -- '--ds-color-(neutral|blue|red|green)-' packages/react/src/button 2>$null)
if ($LASTEXITCODE -eq 0) { $primitiveMatches; throw 'Primitive color reference found in Button source.' }
if ($LASTEXITCODE -ne 1) { throw "rg failed with exit code $LASTEXITCODE" }
```

Expected: eight Button tests pass; TypeScript and the no-match wrapper exit `0`; the wrapper prints nothing.

- [ ] **Step 5: Create the complete Button demo and MDX source**

Create `apps/docs/src/components/examples/ButtonExample.tsx`:

```tsx
import { useState } from 'react';
import {
  Button,
  Icon,
  type ButtonSize,
  type ButtonVariant,
  type ButtonWidth,
} from '@maxxuxx/react';
import './examples.css';

const SIZES: ButtonSize[] = ['small', 'medium', 'large'];
const VARIANTS: ButtonVariant[] = ['fill', 'weak', 'outline'];
const WIDTHS: ButtonWidth[] = ['hug', 'full'];

export default function ButtonExample() {
  const [size, setSize] = useState<ButtonSize>('medium');
  const [variant, setVariant] = useState<ButtonVariant>('fill');
  const [width, setWidth] = useState<ButtonWidth>('hug');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [showLeading, setShowLeading] = useState(true);
  const [showTrailing, setShowTrailing] = useState(false);
  const [activationCount, setActivationCount] = useState(0);

  return (
    <div className="component-demo" data-component-demo="button">
      <div className="component-demo__controls">
        <label className="component-demo__control">
          크기
          <select value={size} onChange={(event) => setSize(event.target.value as ButtonSize)}>
            {SIZES.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="component-demo__control">
          변형
          <select value={variant} onChange={(event) => setVariant(event.target.value as ButtonVariant)}>
            {VARIANTS.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="component-demo__control">
          너비
          <select value={width} onChange={(event) => setWidth(event.target.value as ButtonWidth)}>
            {WIDTHS.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="component-demo__toggle">
          <input checked={loading} type="checkbox" onChange={(event) => setLoading(event.target.checked)} />
          loading
        </label>
        <label className="component-demo__toggle">
          <input checked={disabled} type="checkbox" onChange={(event) => setDisabled(event.target.checked)} />
          disabled
        </label>
        <label className="component-demo__toggle">
          <input checked={showLeading} type="checkbox" onChange={(event) => setShowLeading(event.target.checked)} />
          leading icon
        </label>
        <label className="component-demo__toggle">
          <input checked={showTrailing} type="checkbox" onChange={(event) => setShowTrailing(event.target.checked)} />
          trailing icon
        </label>
      </div>

      <div className="component-demo__stage">
        <div className="component-demo__stack">
          <Button
            disabled={disabled}
            leadingIcon={showLeading ? <Icon name="search" size={20} /> : undefined}
            loading={loading}
            size={size}
            trailingIcon={showTrailing ? <Icon name="chevron-right" size={20} /> : undefined}
            variant={variant}
            width={width}
            onClick={() => setActivationCount((count) => count + 1)}
          >
            주문 확인
          </Button>
          <span className="component-demo__label">활성화 횟수: {activationCount}</span>
        </div>

        <div className="component-demo__grid">
          {SIZES.flatMap((buttonSize) =>
            VARIANTS.map((buttonVariant) => (
              <div className="component-demo__item component-demo__item--stacked" key={`${buttonSize}-${buttonVariant}`}>
                <Button size={buttonSize} variant={buttonVariant}>{buttonVariant}</Button>
                <span className="component-demo__label">{buttonSize}</span>
              </div>
            )),
          )}
          <div className="component-demo__item component-demo__item--stacked">
            <Button disabled>disabled</Button>
            <span className="component-demo__label">disabled state</span>
          </div>
          <div className="component-demo__item component-demo__item--stacked">
            <Button loading>loading</Button>
            <span className="component-demo__label">loading state</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

Create `apps/docs/src/content/components/button.mdx`:

````mdx
---
name: Button
slug: button
description: 화면의 주 행동이나 보조 행동을 native button semantics로 실행하는 action control입니다.
status: preview
figmaUrl: ""
frameworks:
  react: preview
  svelte: planned
  reactNative: planned
variants: [fill, weak, outline]
sizes: [small, medium, large]
states: [default, hover, pressed, focus-visible, disabled, loading]
accessibility: native button, keyboard activation, visible focus, effective disabled, loading aria-busy와 보존된 accessible name을 제공합니다.
props:
  - name: children
    type: ReactNode
    required: true
    defaultValue: null
    description: 버튼의 visible accessible label입니다.
  - name: size
    type: ButtonSize
    required: false
    defaultValue: medium
    description: small, medium, large control height입니다.
  - name: variant
    type: ButtonVariant
    required: false
    defaultValue: fill
    description: fill, weak, outline 시각 위계입니다.
  - name: width
    type: ButtonWidth
    required: false
    defaultValue: hug
    description: content 너비 또는 container full width layout입니다.
  - name: loading
    type: boolean
    required: false
    defaultValue: "false"
    description: activation을 막고 aria-busy와 spinner를 표시합니다.
  - name: leadingIcon
    type: "ReactElement<IconProps>"
    required: false
    defaultValue: null
    description: label 앞의 decorative icon slot입니다.
  - name: trailingIcon
    type: "ReactElement<IconProps>"
    required: false
    defaultValue: null
    description: label 뒤의 decorative icon slot입니다.
  - name: ...buttonProps
    type: "ButtonHTMLAttributes<HTMLButtonElement>"
    required: false
    defaultValue: null
    description: native button props입니다. type default는 button입니다.
tokens:
  - size/control/small
  - size/control/medium
  - size/control/large
  - radius/md
  - color/action/primary
  - color/action/primary-hover
  - color/action/primary-pressed
  - color/action/on-primary
  - color/action/weak
  - color/action/weak-hover
  - color/action/on-weak
  - color/border/default
  - color/border/strong
  - color/border/focus
  - color/focus/ring
---

import ComponentPreview from '../../components/ComponentPreview.astro';
import ButtonExample from '../../components/examples/ButtonExample';
import { Button, Icon } from '@maxxuxx/react';

## 예제

<ComponentPreview title="Button 상태와 조합" description="크기, 위계, 너비, loading, disabled, icon slot을 바꿔 보세요.">
  <ButtonExample client:load />
</ComponentPreview>

<p><Button>계속</Button> <Button variant="outline">취소</Button></p>

## 사용해야 할 때

제출, 저장, 결제, 다음 단계처럼 사용자가 명시적으로 실행하는 주 행동과 보조 행동에 사용합니다. 한 화면의 dominant fill action은 하나를 우선합니다.

## 사용하지 말아야 할 때

단순 페이지 이동 text, 여러 개의 경쟁하는 primary action, 상태 label에는 사용하지 않습니다. 페이지 이동만 수행하면 의미에 맞는 link를 사용합니다.

## 구조

native `button` 안에 leading icon slot, label, trailing icon slot을 둡니다. loading spinner는 overlay되며 accessible label은 DOM에 남습니다.

## 크기와 변형

`small`, `medium`, `large`는 최소 44px, 48px, 56px 높이입니다. `fill`, `weak`, `outline` 세 위계가 있고 `width="full"`은 variant가 아닌 container layout behavior입니다.

## 상태와 동작

web은 hover와 focus-visible을 추가하고 공통 design state는 default, pressed, disabled입니다. `loading || disabled`가 native disabled를 만들며 loading은 `aria-busy="true"`입니다.

## 반응형 동작

모바일에서는 primary action에 `width="full"`을 사용할 수 있고 데스크톱에서는 기본 `hug`가 일반적입니다. 별도 mobile component를 만들지 않습니다.

## 접근성

native Enter/Space activation을 유지합니다. visible label을 제거하지 않고 icon은 기본 장식용입니다. loading 중에도 accessible name이 유지되며 focus-visible ring은 semantic focus token을 사용합니다.

## React 예제

```tsx
import { Button, Icon } from '@maxxuxx/react';
import '@maxxuxx/react/styles.css';

export function ContinueButton() {
  return (
    <Button trailingIcon={<Icon name="chevron-right" size={20} />}>
      다음으로
    </Button>
  );
}
```

## API

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `children` | `ReactNode` | required | visible accessible label |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 44/48/56px minimum height |
| `variant` | `'fill' \| 'weak' \| 'outline'` | `'fill'` | action hierarchy |
| `width` | `'hug' \| 'full'` | `'hug'` | intrinsic 또는 full width |
| `loading` | `boolean` | `false` | native disabled + aria-busy + spinner |
| `leadingIcon` | `ReactElement<IconProps>` | 없음 | label 앞 owned Icon slot |
| `trailingIcon` | `ReactElement<IconProps>` | 없음 | label 뒤 owned Icon slot |
| native button props | `ButtonHTMLAttributes<HTMLButtonElement>` | `type="button"` | native behavior와 events |

## 사용 토큰

- `size/control/small`, `size/control/medium`, `size/control/large`, `radius/md`
- `color/action/*`, `color/border/*`, `color/text/disabled`, `color/bg/*`, `color/focus/ring`

## Figma

Pre-Figma contract는 `Size 3 × Variant 3 × State Default/Pressed/Disabled = 27` variants입니다. `Label` TEXT, `Loading`, `Show leading icon`, `Show trailing icon` BOOLEAN, leading/trailing INSTANCE_SWAP properties를 사용합니다. width는 variant가 아닙니다. `figmaUrl`은 빈 문자열입니다.

## 지원 상태

| React | Svelte | React Native |
|---|---|---|
| preview | planned | planned |
````

- [ ] **Step 6: Run the Button manifest red/green cycle and docs build**

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:check
```

Expected red: exit non-zero with `Stale component manifest: <absolute path>. Run "pnpm manifest:write".`.

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:write
corepack pnpm --filter @maxxuxx/docs manifest:check
corepack pnpm --filter @maxxuxx/docs build
```

Expected green: all exit `0`; manifest order is exactly `Icon, Badge, Button`; `/components/button/` exists.

- [ ] **Step 7: Replace the visual spec with the accumulated Icon + Badge + Button suite**

Replace `apps/docs/tests/e2e/component-slices.visual.spec.ts` with:

```ts
import { expect, test } from '@playwright/test';
import { expectPageScreenshot } from './support/visual';

const slices = [
  { name: 'Icon', slug: 'icon' },
  { name: 'Badge', slug: 'badge' },
  { name: 'Button', slug: 'button' },
] as const;

for (const slice of slices) {
  test(`${slice.name} component slice`, async ({ page }, testInfo) => {
    test.skip(process.platform !== 'win32', 'Visual baselines are Windows Chromium only.');
    test.skip(testInfo.project.name === 'tablet-chromium', 'Plan 02 owns tablet responsive coverage.');

    await page.goto(`/components/${slice.slug}/`);
    await expect(page.getByRole('heading', { level: 1, name: slice.name })).toBeVisible();
    await expect(page.locator(`[data-component-demo="${slice.slug}"]`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expectPageScreenshot(page, testInfo, slice.slug);
  });
}
```

- [ ] **Step 8: Generate, inspect, and compare Button mobile/desktop baselines**

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs test:e2e -- --project=mobile-chromium --project=desktop-chromium --grep "Button component slice" --update-snapshots
Get-Item 'apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/button-mobile-chromium.png'
Get-Item 'apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/button-desktop-chromium.png'
corepack pnpm --filter @maxxuxx/docs test:e2e -- --project=mobile-chromium --project=desktop-chromium --grep "Button component slice"
```

Expected: exactly two new PNGs; inspect all size/variant examples, 44/48/56px hierarchy, visible disabled/loading distinctions, full-width mobile behavior, unclipped icons/labels, and no horizontal overflow; comparison reports `2 passed`.

- [ ] **Step 9: Run the slice guard and commit Button**

Run:

```powershell
$primitiveMatches = @(rg -n -- '--ds-color-(neutral|blue|red|green)-' packages/react/src/button apps/docs/src/components/examples/ButtonExample.tsx apps/docs/src/content/components/button.mdx 2>$null)
if ($LASTEXITCODE -eq 0) { $primitiveMatches; throw 'Primitive color reference found in Button slice.' }
if ($LASTEXITCODE -ne 1) { throw "rg failed with exit code $LASTEXITCODE" }
corepack pnpm --filter @maxxuxx/react test -- Button.test.tsx
corepack pnpm --filter @maxxuxx/react check
corepack pnpm --filter @maxxuxx/docs manifest:check
corepack pnpm --filter @maxxuxx/docs build
```

Expected: the wrapper exits `0` with no output; all pnpm commands exit `0`.

Commit only the Button slice:

```powershell
git add packages/react/src/button/Button.tsx packages/react/src/button/Button.css packages/react/src/button/Button.test.tsx packages/react/src/button/index.ts packages/react/src/styles.css packages/react/src/index.ts apps/docs/src/components/examples/ButtonExample.tsx apps/docs/src/content/components/button.mdx apps/docs/public/design-system/components.json apps/docs/tests/e2e/component-slices.visual.spec.ts apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/button-mobile-chromium.png apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/button-desktop-chromium.png
git commit -m "feat(button): add accessible action component"
```

- [ ] **Step 10: Stop at the Button pre-Figma checkpoint**

Run `corepack pnpm --filter @maxxuxx/docs manifest:release-check`; expect `Release manifest is missing components: TextField`. Hand the committed Button source, MDX entry, and two Button PNGs to plan 04 Task 6. Resume Task 4 only after plan 04 writes the actual Button URL and the exact Button readback pair exits `0`.

### Task 4: Complete TextField

**Files:**
- Create: all TextField slice files in the File Map.
- Modify: `packages/react/src/styles.css`, `packages/react/src/index.ts`, `apps/docs/tests/e2e/component-slices.visual.spec.ts`.
- Generate: TextField mobile/desktop screenshots and the four-entry `components.json`.

**Interfaces:**
- Consumes: control size, semantic surface/text/border/danger/focus, radius/type/spacing tokens.
- Produces: `TextField`, `TextFieldProps`, `TextFieldSize`.
- Produces: stable selector `[data-component-demo="text-field"]` and route `/components/text-field/`.

- [ ] **Step 1: Write the failing TextField tests**

Create `packages/react/src/text-field/TextField.test.tsx` before `TextField.tsx` exists:

```tsx
import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../test/accessibility';
import { TextField } from './TextField';

describe('TextField', () => {
  it('associates a visible label with a generated input ID', () => {
    render(<TextField label="이름" />);
    const input = screen.getByRole('textbox', { name: '이름' });
    const label = screen.getByText('이름');

    expect(input.id).toMatch(/^ds-text-field-/);
    expect(label).toHaveAttribute('for', input.id);
    expect(input).toHaveAttribute('data-size', 'medium');
    expect(input).toHaveAttribute('data-state', 'default');
  });

  it('uses a supplied ID instead of the generated ID', () => {
    render(<TextField id="customer-name" label="고객명" size="large" />);
    const input = screen.getByRole('textbox', { name: '고객명' });

    expect(input).toHaveAttribute('id', 'customer-name');
    expect(input).toHaveAttribute('data-size', 'large');
    expect(screen.getByText('고객명')).toHaveAttribute('for', 'customer-name');
  });

  it('orders description, error, then de-duplicated caller IDs', () => {
    render(
      <div>
        <span id="external-help">외부 도움말</span>
        <TextField
          aria-describedby="external-help external-help"
          description="한글로 입력하세요."
          errorMessage="이름을 입력하세요."
          id="name"
          label="이름"
        />
      </div>,
    );
    const input = screen.getByRole('textbox', { name: '이름' });

    expect(input).toHaveAttribute('aria-describedby', 'name-description name-error external-help');
    expect(input).toHaveAttribute('aria-errormessage', 'name-error');
    expect(screen.getByText('이름을 입력하세요.')).toHaveAttribute('id', 'name-error');
    expect(screen.getByText('이름을 입력하세요.')).toHaveAttribute('role', 'alert');
  });

  it('makes errorMessage authoritative over caller aria-invalid', () => {
    render(
      <div>
        <TextField aria-invalid="grammar" id="without-error" label="별칭" />
        <TextField aria-invalid={false} errorMessage="필수 항목입니다." id="with-error" label="주소" />
      </div>,
    );

    expect(screen.getByRole('textbox', { name: '별칭' })).toHaveAttribute('aria-invalid', 'grammar');
    const invalid = screen.getByRole('textbox', { name: '주소' });
    expect(invalid).toHaveAttribute('aria-invalid', 'true');
    expect(invalid).toHaveAttribute('data-state', 'error');
  });

  it('preserves native accessible-name precedence while keeping the visible label', () => {
    render(<TextField aria-label="검색어 입력" id="query" label="검색" />);
    expect(screen.getByRole('textbox', { name: '검색어 입력' })).toBeInTheDocument();
    expect(screen.getByText('검색')).toHaveAttribute('for', 'query');
  });

  it('supports uncontrolled and controlled values', async () => {
    const user = userEvent.setup();

    function ControlledField() {
      const [value, setValue] = useState('초기');
      return <TextField label="제어 입력" value={value} onChange={(event) => setValue(event.target.value)} />;
    }

    render(
      <div>
        <TextField defaultValue="기본" label="비제어 입력" />
        <ControlledField />
      </div>,
    );
    const uncontrolled = screen.getByRole('textbox', { name: '비제어 입력' });
    const controlled = screen.getByRole('textbox', { name: '제어 입력' });

    expect(uncontrolled).toHaveValue('기본');
    expect(controlled).toHaveValue('초기');
    await user.clear(controlled);
    await user.type(controlled, '변경');
    expect(controlled).toHaveValue('변경');
  });

  it('forwards disabled, required, native props, and its ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <TextField
        autoComplete="name"
        className="consumer-input"
        disabled
        label="수령인"
        ref={ref}
        required
      />,
    );
    const input = screen.getByRole('textbox', { name: '수령인' });

    expect(input).toBeDisabled();
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('autocomplete', 'name');
    expect(input).toHaveClass('ds-text-field__input', 'consumer-input');
    expect(input).toHaveAttribute('data-state', 'disabled');
    expect(ref.current).toBe(input);
  });

  it('is keyboard focusable', async () => {
    const user = userEvent.setup();
    render(<TextField label="이메일" />);
    await user.tab();
    expect(screen.getByRole('textbox', { name: '이메일' })).toHaveFocus();
  });

  it('has no axe violations with description and error content', async () => {
    const { container } = render(
      <TextField
        description="주문 알림에 사용합니다."
        errorMessage="이메일 형식을 확인하세요."
        label="이메일"
      />,
    );
    await expectNoAxeViolations(container);
  });
});
```

- [ ] **Step 2: Run the TextField red test**

Run:

```powershell
corepack pnpm --filter @maxxuxx/react test -- TextField.test.tsx
```

Expected: exit non-zero because Vitest cannot resolve `./TextField`.

- [ ] **Step 3: Implement TextField, exact ARIA merging, semantic CSS, and cumulative exports**

Create `packages/react/src/text-field/TextField.tsx`:

```tsx
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
} from 'react';

export type TextFieldSize = 'medium' | 'large';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  description?: string;
  errorMessage?: string;
  size?: TextFieldSize;
}

function mergeIds(...values: Array<string | undefined>): string | undefined {
  const ids = values
    .flatMap((value) => value?.split(/\s+/) ?? [])
    .filter((value, index, all) => value.length > 0 && all.indexOf(value) === index);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
    'aria-invalid': ariaInvalid,
    className,
    description,
    disabled = false,
    errorMessage,
    id,
    label,
    size = 'medium',
    ...inputProps
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? `ds-text-field-${generatedId}`;
  const hasDescription = typeof description === 'string' && description.trim().length > 0;
  const hasError = errorMessage !== undefined;
  const descriptionId = hasDescription ? `${inputId}-description` : undefined;
  const errorId = hasError ? `${inputId}-error` : undefined;
  const describedBy = mergeIds(descriptionId, errorId, ariaDescribedBy);
  const state = disabled ? 'disabled' : hasError ? 'error' : 'default';
  const inputClasses = ['ds-text-field__input', className].filter(Boolean).join(' ');

  return (
    <div className="ds-text-field" data-state={state} data-size={size}>
      <label className="ds-text-field__label" htmlFor={inputId}>{label}</label>
      <input
        {...inputProps}
        ref={ref}
        aria-describedby={describedBy}
        aria-errormessage={hasError ? errorId : ariaErrorMessage}
        aria-invalid={hasError ? true : ariaInvalid}
        className={inputClasses}
        data-size={size}
        data-state={state}
        disabled={disabled}
        id={inputId}
      />
      {hasDescription ? (
        <p className="ds-text-field__description" id={descriptionId}>{description}</p>
      ) : null}
      {hasError ? (
        <p className="ds-text-field__error" id={errorId} role="alert">{errorMessage}</p>
      ) : null}
    </div>
  );
});
```

Create `packages/react/src/text-field/TextField.css`:

```css
.ds-text-field {
  display: grid;
  width: 100%;
  gap: var(--ds-space-8);
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-sans);
}

.ds-text-field__label {
  font-size: var(--ds-font-size-body-sm);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-font-line-height-body-sm);
}

.ds-text-field__input {
  box-sizing: border-box;
  width: 100%;
  color: var(--ds-color-text-primary);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  font-family: inherit;
  font-size: var(--ds-font-size-body);
  line-height: var(--ds-font-line-height-body);
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.ds-text-field__input[data-size='medium'] {
  min-height: var(--ds-size-control-medium);
  padding-inline: var(--ds-space-16);
}

.ds-text-field__input[data-size='large'] {
  min-height: var(--ds-size-control-large);
  padding-inline: var(--ds-space-20);
}

.ds-text-field__input::placeholder {
  color: var(--ds-color-text-secondary);
}

.ds-text-field__input:focus-visible {
  border-color: var(--ds-color-border-focus);
  outline: none;
  box-shadow: 0 0 0 var(--ds-space-4) var(--ds-color-focus-ring);
}

.ds-text-field__input[data-state='error'] {
  border-color: var(--ds-color-status-danger);
  box-shadow: 0 0 0 var(--ds-space-2) var(--ds-color-status-danger-subtle);
}

.ds-text-field__input[data-state='disabled'] {
  color: var(--ds-color-text-disabled);
  background: var(--ds-color-bg-subtle);
  border-color: var(--ds-color-border-default);
  box-shadow: none;
  cursor: not-allowed;
}

.ds-text-field__description,
.ds-text-field__error {
  margin: 0;
  font-size: var(--ds-font-size-caption);
  line-height: var(--ds-font-line-height-caption);
}

.ds-text-field__description {
  color: var(--ds-color-text-secondary);
}

.ds-text-field__error {
  color: var(--ds-color-status-danger);
}

@media (prefers-reduced-motion: reduce) {
  .ds-text-field__input {
    transition: none;
  }
}
```

Create `packages/react/src/text-field/index.ts`:

```ts
export { TextField } from './TextField';
export type { TextFieldProps, TextFieldSize } from './TextField';
```

Replace `packages/react/src/styles.css` with:

```css
@import './icon/Icon.css';
@import './badge/Badge.css';
@import './button/Button.css';
@import './text-field/TextField.css';
```

Replace `packages/react/src/index.ts` with:

```ts
export * from './icon';
export * from './badge';
export * from './button';
export * from './text-field';
```

- [ ] **Step 4: Run the TextField green test and semantic-style guard**

Run:

```powershell
corepack pnpm --filter @maxxuxx/react test -- TextField.test.tsx
corepack pnpm --filter @maxxuxx/react check
$primitiveMatches = @(rg -n -- '--ds-color-(neutral|blue|red|green)-' packages/react/src/text-field 2>$null)
if ($LASTEXITCODE -eq 0) { $primitiveMatches; throw 'Primitive color reference found in TextField source.' }
if ($LASTEXITCODE -ne 1) { throw "rg failed with exit code $LASTEXITCODE" }
```

Expected: nine TextField tests pass; TypeScript and the no-match wrapper exit `0`; the wrapper prints nothing.

- [ ] **Step 5: Create the complete TextField demo and MDX source**

Create `apps/docs/src/components/examples/TextFieldExample.tsx`:

```tsx
import { useState } from 'react';
import { TextField, type TextFieldSize } from '@maxxuxx/react';
import './examples.css';

const SIZES: TextFieldSize[] = ['medium', 'large'];

export default function TextFieldExample() {
  const [value, setValue] = useState('김토큰');
  const [size, setSize] = useState<TextFieldSize>('medium');
  const [disabled, setDisabled] = useState(false);
  const [required, setRequired] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [showError, setShowError] = useState(false);

  return (
    <div className="component-demo" data-component-demo="text-field">
      <div className="component-demo__controls">
        <label className="component-demo__control">
          크기
          <select value={size} onChange={(event) => setSize(event.target.value as TextFieldSize)}>
            {SIZES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="component-demo__toggle">
          <input checked={disabled} type="checkbox" onChange={(event) => setDisabled(event.target.checked)} />
          disabled
        </label>
        <label className="component-demo__toggle">
          <input checked={required} type="checkbox" onChange={(event) => setRequired(event.target.checked)} />
          required
        </label>
        <label className="component-demo__toggle">
          <input checked={showDescription} type="checkbox" onChange={(event) => setShowDescription(event.target.checked)} />
          description
        </label>
        <label className="component-demo__toggle">
          <input checked={showError} type="checkbox" onChange={(event) => setShowError(event.target.checked)} />
          error
        </label>
      </div>

      <div className="component-demo__stage">
        <div className="component-demo__stack">
          <TextField
            description={showDescription ? '주문자 확인에 사용합니다.' : undefined}
            disabled={disabled}
            errorMessage={showError ? '이름을 다시 확인하세요.' : undefined}
            label="이름"
            required={required}
            size={size}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <TextField description="기본 도움말" label="기본 상태" placeholder="내용 입력" />
          <TextField errorMessage="필수 항목입니다." label="오류 상태" />
          <TextField disabled label="비활성 상태" value="수정할 수 없음" readOnly />
        </div>
      </div>
    </div>
  );
}
```

Create `apps/docs/src/content/components/text-field.mdx`:

````mdx
---
name: TextField
slug: text-field
description: visible label과 contextual feedback으로 한 줄 text value를 받는 native input control입니다.
status: preview
figmaUrl: ""
frameworks:
  react: preview
  svelte: planned
  reactNative: planned
variants: []
sizes: [medium, large]
states: [default, focus, error, disabled]
accessibility: visible label 연결, stable description/error IDs, ordered aria-describedby, forced error aria-invalid와 alert를 제공합니다.
props:
  - name: label
    type: string
    required: true
    defaultValue: null
    description: input과 연결되는 visible label입니다.
  - name: description
    type: string
    required: false
    defaultValue: null
    description: input을 보조하는 도움말입니다.
  - name: errorMessage
    type: string
    required: false
    defaultValue: null
    description: aria-invalid, aria-errormessage, alert를 만드는 오류 문구입니다.
  - name: size
    type: TextFieldSize
    required: false
    defaultValue: medium
    description: medium 또는 large control height입니다.
  - name: ...inputProps
    type: "Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>"
    required: false
    defaultValue: null
    description: numeric HTML size를 제외한 native input props입니다.
tokens:
  - size/control/medium
  - size/control/large
  - radius/md
  - color/bg/surface
  - color/bg/subtle
  - color/text/primary
  - color/text/secondary
  - color/text/disabled
  - color/border/default
  - color/border/focus
  - color/status/danger
  - color/status/danger-subtle
  - color/focus/ring
---

import ComponentPreview from '../../components/ComponentPreview.astro';
import TextFieldExample from '../../components/examples/TextFieldExample';
import { TextField } from '@maxxuxx/react';

## 예제

<ComponentPreview title="TextField 상태" description="typing, size, disabled, required, description, error를 확인합니다.">
  <TextFieldExample client:load />
</ComponentPreview>

<TextField description="영수증에 표시되는 이름입니다." label="주문자 이름" />

## 사용해야 할 때

이름, 검색어, 짧은 식별자처럼 한 줄 text value를 입력받고 visible label과 도움말 또는 오류가 필요할 때 사용합니다.

## 사용하지 말아야 할 때

읽기 전용 데이터 표시, 여러 줄 본문, 선택지 목록에는 사용하지 않습니다. 여러 줄에는 textarea, 선택에는 해당 native control을 사용합니다.

## 구조

visible label, native input, optional description, optional error 순서입니다. 모든 보조 text는 input ID에서 파생한 stable ID를 사용합니다.

## 크기와 변형

`medium`은 48px, `large`는 56px 높이입니다. 별도 visual variant는 없고 state가 border, text, surface를 결정합니다.

## 상태와 동작

우선순위는 `Disabled > Error > Focus > Default`입니다. errorMessage가 있으면 caller가 `aria-invalid={false}`를 주어도 error가 우선합니다.

## 반응형 동작

wrapper는 항상 available width를 채웁니다. 모바일의 native keyboard와 autofill은 input type, inputMode, autoComplete props를 통해 브라우저가 처리하며 별도 mobile component를 만들지 않습니다.

## 접근성

visible label은 항상 input과 연결됩니다. `aria-describedby`는 description, error, caller IDs 순서이며 duplicate를 제거합니다. error는 `role="alert"`, `aria-invalid="true"`, `aria-errormessage`를 만듭니다.

## React 예제

```tsx
import { TextField } from '@maxxuxx/react';
import '@maxxuxx/react/styles.css';

export function EmailField() {
  return (
    <TextField
      autoComplete="email"
      description="주문 알림을 받을 주소입니다."
      inputMode="email"
      label="이메일"
      type="email"
    />
  );
}
```

## API

| Prop | Type | Default | 설명 |
|---|---|---|---|
| `label` | `string` | required | visible associated label |
| `description` | `string` | 없음 | helper text |
| `errorMessage` | `string` | 없음 | error ARIA와 alert text |
| `size` | `'medium' \| 'large'` | `'medium'` | 48/56px height |
| native input props | `Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>` | 없음 | controlled/uncontrolled/native behavior |

## 사용 토큰

- `size/control/medium`, `size/control/large`, `radius/md`
- `color/bg/*`, `color/text/*`, `color/border/*`, `color/status/danger*`, `color/focus/ring`

## Figma

Pre-Figma contract는 `Size 2 × State Default/Focus/Error/Disabled = 8` variants와 `Label`, `Value`, `Description`, `Error` TEXT properties입니다. `figmaUrl`은 빈 문자열입니다.

## 지원 상태

| React | Svelte | React Native |
|---|---|---|
| preview | planned | planned |
````

- [ ] **Step 6: Run the TextField manifest red/green cycle and docs build**

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:check
```

Expected red: exit non-zero with `Stale component manifest: <absolute path>. Run "pnpm manifest:write".`.

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:write
corepack pnpm --filter @maxxuxx/docs manifest:check
corepack pnpm --filter @maxxuxx/docs build
```

Expected green: all exit `0`; manifest order is exactly `Icon, Badge, Button, TextField`; `/components/text-field/` exists.

- [ ] **Step 7: Replace the visual spec with the final four-slice suite**

Replace `apps/docs/tests/e2e/component-slices.visual.spec.ts` with:

```ts
import { expect, test } from '@playwright/test';
import { expectPageScreenshot } from './support/visual';

const slices = [
  { name: 'Icon', slug: 'icon' },
  { name: 'Badge', slug: 'badge' },
  { name: 'Button', slug: 'button' },
  { name: 'TextField', slug: 'text-field' },
] as const;

for (const slice of slices) {
  test(`${slice.name} component slice`, async ({ page }, testInfo) => {
    test.skip(process.platform !== 'win32', 'Visual baselines are Windows Chromium only.');
    test.skip(testInfo.project.name === 'tablet-chromium', 'Plan 02 owns tablet responsive coverage.');

    await page.goto(`/components/${slice.slug}/`);
    await expect(page.getByRole('heading', { level: 1, name: slice.name })).toBeVisible();
    await expect(page.locator(`[data-component-demo="${slice.slug}"]`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expectPageScreenshot(page, testInfo, slice.slug);
  });
}
```

- [ ] **Step 8: Generate, inspect, and compare TextField mobile/desktop baselines**

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs test:e2e -- --project=mobile-chromium --project=desktop-chromium --grep "TextField component slice" --update-snapshots
Get-Item 'apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/text-field-mobile-chromium.png'
Get-Item 'apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/text-field-desktop-chromium.png'
corepack pnpm --filter @maxxuxx/docs test:e2e -- --project=mobile-chromium --project=desktop-chromium --grep "TextField component slice"
```

Expected: exactly two new PNGs; inspect 48/56px controls, default/error/disabled distinction, readable helper/error wrapping, aligned labels, mobile full-width layout, and no overflow; comparison reports `2 passed`.

- [ ] **Step 9: Run the slice guard and commit TextField**

Run:

```powershell
$primitiveMatches = @(rg -n -- '--ds-color-(neutral|blue|red|green)-' packages/react/src/text-field apps/docs/src/components/examples/TextFieldExample.tsx apps/docs/src/content/components/text-field.mdx 2>$null)
if ($LASTEXITCODE -eq 0) { $primitiveMatches; throw 'Primitive color reference found in TextField slice.' }
if ($LASTEXITCODE -ne 1) { throw "rg failed with exit code $LASTEXITCODE" }
corepack pnpm --filter @maxxuxx/react test -- TextField.test.tsx
corepack pnpm --filter @maxxuxx/react check
corepack pnpm --filter @maxxuxx/docs manifest:check
corepack pnpm --filter @maxxuxx/docs build
```

Expected: the wrapper exits `0` with no output; all pnpm commands exit `0`.

Commit only the TextField slice:

```powershell
git add packages/react/src/text-field/TextField.tsx packages/react/src/text-field/TextField.css packages/react/src/text-field/TextField.test.tsx packages/react/src/text-field/index.ts packages/react/src/styles.css packages/react/src/index.ts apps/docs/src/components/examples/TextFieldExample.tsx apps/docs/src/content/components/text-field.mdx apps/docs/public/design-system/components.json apps/docs/tests/e2e/component-slices.visual.spec.ts apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/text-field-mobile-chromium.png apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/text-field-desktop-chromium.png
git commit -m "feat(text-field): add accessible text input"
```

- [ ] **Step 10: Stop at the TextField pre-Figma checkpoint**

Run `corepack pnpm --filter @maxxuxx/docs manifest:release-check`; expect `Figma URLs are required for release: TextField`. Hand the committed TextField source, MDX entry, and two TextField PNGs to plan 04 Task 7. Plan 03 is complete only after plan 04 writes the actual TextField URL, the exact TextField readback pair exits `0`, and `corepack pnpm --filter @maxxuxx/docs manifest:release-check` becomes silent exit `0`.

### Task 5: Verify the reconciled four-slice contract

**Files:**
- Verify only: all files created by Tasks 1–4.
- Verify generated: `apps/docs/public/design-system/components.json`.
- Verify generated: the eight exact PNG paths in the File Map.

**Interfaces:**
- Consumes: actual Figma URL reconciliation from plan 04 Tasks 4–7.
- Produces: the release-ready React/docs/manifest/browser checkpoint consumed by plan 04 Phase 4 and plan 05.

- [ ] **Step 1: Run all component and docs checks from a fresh process**

```powershell
corepack pnpm --filter @maxxuxx/react test
corepack pnpm --filter @maxxuxx/react check
corepack pnpm --filter @maxxuxx/docs test:unit
corepack pnpm --filter @maxxuxx/docs manifest:check
corepack pnpm --filter @maxxuxx/docs manifest:release-check
corepack pnpm --filter @maxxuxx/docs build
```

Expected: four Vitest component files run 29 tests with 29 passed; React TypeScript and docs unit tests pass; both manifest checks and Astro build exit `0`.

- [ ] **Step 2: Validate the complete generated manifest without editing it**

Run:

```powershell
node -e "const fs=require('node:fs');const m=JSON.parse(fs.readFileSync('apps/docs/public/design-system/components.json','utf8'));const expected=[['Icon','icon'],['Badge','badge'],['Button','button'],['TextField','text-field']];if(m.schemaVersion!==1||m.components.length!==4)throw new Error('Manifest must contain schemaVersion 1 and four components');expected.forEach(([name,slug],index)=>{const c=m.components[index];if(c.name!==name||c.slug!==slug||c.docsUrl!=='/components/'+slug+'/'||!c.figmaUrl.startsWith('https://www.figma.com/')||c.status!=='preview'||c.frameworks.react!=='preview'||c.frameworks.svelte!=='planned'||c.frameworks.reactNative!=='planned')throw new Error('Manifest contract mismatch: '+name)});console.log('Manifest contract passed: Icon, Badge, Button, TextField')"
```

Expected exact output: `Manifest contract passed: Icon, Badge, Button, TextField` and exit `0`.

- [ ] **Step 3: Compare all eight Windows Chromium baselines**

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs test:e2e -- --project=mobile-chromium --project=desktop-chromium tests/e2e/component-slices.visual.spec.ts
Get-Item 'apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/icon-mobile-chromium.png'
Get-Item 'apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/icon-desktop-chromium.png'
Get-Item 'apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/badge-mobile-chromium.png'
Get-Item 'apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/badge-desktop-chromium.png'
Get-Item 'apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/button-mobile-chromium.png'
Get-Item 'apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/button-desktop-chromium.png'
Get-Item 'apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/text-field-mobile-chromium.png'
Get-Item 'apps/docs/tests/e2e/__snapshots__/component-slices.visual.spec/text-field-desktop-chromium.png'
```

Expected: Playwright reports `8 passed`; all eight committed paths exist; no baseline changes are written.

- [ ] **Step 4: Run the repository-wide primitive-color guard for this plan's product files**

```powershell
$primitiveMatches = @(rg -n -- '--ds-color-(neutral|blue|red|green)-' packages/react/src apps/docs/src/components/examples apps/docs/src/content/components 2>$null)
if ($LASTEXITCODE -eq 0) { $primitiveMatches; throw 'Primitive color reference found in component product files.' }
if ($LASTEXITCODE -ne 1) { throw "rg failed with exit code $LASTEXITCODE" }
```

Expected: exit `0` with no output.

- [ ] **Step 5: Publish the plan 04/05 checkpoint**

The checkpoint output is exactly:

- Four exported React families with passing focused and aggregate tests.
- Four validated MDX documents with exact 13-heading order and actual reconciled Figma URLs.
- One generated four-entry manifest in fixed `Icon, Badge, Button, TextField` order.
- Eight reviewed Windows Chromium PNGs, two per component.
- Owned Icon path data and complete SVG strings for plan 04 `createNodeFromSvg` consumption.
- Exact Figma matrices: Icon five masters plus documented 16/20/24 instances; Badge 16; Button 27; TextField 8.
- Exact accessibility rules from this plan, including TextField `Disabled > Error > Focus > Default` and description/error/caller ID ordering.

No additional plan 03 commit is made here. Actual Figma URL reconciliation belongs to the corresponding plan 04 commit, and plan 05 performs the final integrated verification.

---

## Acceptance Matrix

| Requirement | Evidence |
|---|---|
| Icon complete before Badge | `Icon.test.tsx`, Icon MDX/manifest/build, two Icon PNGs, Icon checkpoint |
| Badge complete before Button | 16-combination test/demo, Badge MDX/build, two Badge PNGs, Badge checkpoint |
| Button native action semantics | click/keyboard/disabled/loading tests, 44/48/56px CSS, Button MDX, two PNGs |
| TextField ARIA precedence | ordered-ID/error/state tests, native input implementation, MDX, two PNGs |
| AI-readable component metadata | generated four-entry `components.json`, validated frontmatter and headings |
| No primitive product colors | per-slice and aggregate PowerShell guards exit `0` |
| Mobile + desktop visual QA | exact eight committed Windows Chromium baselines and `8 passed` comparison |
| Figma handoff without mutation here | four explicit pre-Figma checkpoints and actual-URL readbacks from plan 04 |

## Official Implementation References

- React accessibility and DOM components: https://react.dev/reference/react-dom/components
- React `forwardRef`: https://react.dev/reference/react/forwardRef
- React `useId`: https://react.dev/reference/react/useId
- Testing Library user events: https://testing-library.com/docs/user-event/intro/
- Playwright screenshot comparisons: https://playwright.dev/docs/test-snapshots
- Playwright `snapshotPathTemplate`: https://playwright.dev/docs/api/class-testconfig#test-config-snapshot-path-template
