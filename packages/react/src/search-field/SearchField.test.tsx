import { readFileSync } from 'node:fs';
import { createRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import {
  act,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { expectNoAxeViolations } from '../test/accessibility';

import { SearchField } from './SearchField';

class ResizeObserverDouble {
  static instances: ResizeObserverDouble[] = [];

  readonly disconnect = vi.fn();
  readonly observe = vi.fn((_target: Element) => undefined);
  readonly unobserve = vi.fn((_target: Element) => undefined);
  readonly takeRecords = vi.fn((): ResizeObserverEntry[] => []);

  constructor(private readonly callback: ResizeObserverCallback) {
    ResizeObserverDouble.instances.push(this);
  }

  trigger(target: Element): void {
    this.callback(
      [{ target } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
}

beforeEach(() => {
  ResizeObserverDouble.instances = [];
  vi.stubGlobal('ResizeObserver', ResizeObserverDouble);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SearchField', () => {
  it('renders a trimmed hidden label and native search input with an owned search icon', () => {
    const { container } = render(
      <SearchField clearLabel="검색어 지우기" label="  검색  " />,
    );
    const input = screen.getByRole('searchbox', { name: '검색' });
    const label = container.querySelector('.ds-search-field__label');
    const searchIcon = container.querySelector('.ds-search-field__search-icon');

    expect(input).toHaveAttribute('type', 'search');
    expect(label).toHaveTextContent('검색');
    expect(label).toHaveAttribute('for', input.id);
    expect(searchIcon).toHaveAttribute('aria-hidden', 'true');
    expect(searchIcon).toHaveAttribute('data-size', '20');
  });

  it('rejects empty input and clear labels at runtime', () => {
    expect(() => {
      render(<SearchField clearLabel="지우기" label="   " />);
    }).toThrow('SearchField label must be a non-empty string.');
    expect(() => {
      render(<SearchField clearLabel="   " label="검색" />);
    }).toThrow('SearchField clearLabel must be a non-empty string.');
  });

  it('supports uncontrolled typing and reports every value change', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SearchField
        clearLabel="검색어 지우기"
        defaultValue="토"
        label="검색"
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole('searchbox', { name: '검색' });

    await user.type(input, '스');

    expect(input).toHaveValue('토스');
    expect(onValueChange).toHaveBeenLastCalledWith('토스');
  });

  it('supports a controlled value without treating an empty string as uncontrolled', async () => {
    const user = userEvent.setup();

    function ControlledSearchField() {
      const [value, setValue] = useState('');
      return (
        <SearchField
          clearLabel="검색어 지우기"
          label="제어 검색"
          onValueChange={setValue}
          value={value}
        />
      );
    }

    render(<ControlledSearchField />);
    const input = screen.getByRole('searchbox', { name: '제어 검색' });

    await user.type(input, '검색어');

    expect(input).toHaveValue('검색어');
    expect(screen.getByRole('button', { name: '검색어 지우기' })).toBeVisible();
  });

  it('clears in callback order and restores focus to the input', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    let input: HTMLInputElement;
    render(
      <SearchField
        clearLabel="검색어 지우기"
        defaultValue="토스"
        label="검색"
        onClear={() => {
          calls.push('clear');
          expect(input).not.toHaveFocus();
        }}
        onValueChange={(nextValue) => calls.push(`value:${nextValue}`)}
      />,
    );
    input = screen.getByRole('searchbox', { name: '검색' });

    await user.click(screen.getByRole('button', { name: '검색어 지우기' }));

    expect(calls).toEqual(['value:', 'clear']);
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('button', { name: '검색어 지우기' })).toBeNull();
  });

  it('participates in native form data and restores its default on form reset', async () => {
    const user = userEvent.setup();
    render(
      <form aria-label="검색 양식">
        <SearchField
          clearLabel="검색어 지우기"
          defaultValue="기본"
          label="검색"
          name="query"
        />
        <button type="reset">초기화</button>
      </form>,
    );
    const form = screen.getByRole('form', {
      name: '검색 양식',
    }) as HTMLFormElement;
    const input = screen.getByRole('searchbox', { name: '검색' });

    await user.clear(input);
    await user.type(input, '변경');
    expect(new FormData(form).get('query')).toBe('변경');

    await user.click(screen.getByRole('button', { name: '초기화' }));

    await waitFor(() => expect(input).toHaveValue('기본'));
    expect(new FormData(form).get('query')).toBe('기본');
  });

  it('preserves its current value when native form reset is canceled', async () => {
    const user = userEvent.setup();
    render(
      <form
        aria-label="취소 가능한 검색 양식"
        onReset={(event) => event.preventDefault()}
      >
        <SearchField
          clearLabel="검색어 지우기"
          defaultValue="기본"
          label="검색"
          name="query"
        />
        <button type="reset">초기화 취소</button>
      </form>,
    );
    const input = screen.getByRole('searchbox', { name: '검색' });

    await user.clear(input);
    await user.type(input, '유지');
    await user.click(screen.getByRole('button', { name: '초기화 취소' }));

    expect(input).toHaveValue('유지');
  });

  it('never exposes a clear action for disabled or readonly values', () => {
    render(
      <div>
        <SearchField
          clearLabel="비활성 검색어 지우기"
          defaultValue="비활성"
          disabled
          label="비활성 검색"
        />
        <SearchField
          clearLabel="읽기 전용 검색어 지우기"
          defaultValue="읽기 전용"
          label="읽기 전용 검색"
          readOnly
        />
      </div>,
    );

    expect(screen.getByRole('searchbox', { name: '비활성 검색' })).toBeDisabled();
    expect(screen.getByRole('searchbox', { name: '읽기 전용 검색' })).toHaveAttribute(
      'readonly',
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('forwards its ref and native input props while applying only safe root layout styles', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <SearchField
        aria-describedby="search-help"
        autoComplete="off"
        className="consumer-search-field"
        clearLabel="검색어 지우기"
        data-consumer="orders"
        label="주문 검색"
        name="query"
        placeholder="주문 번호"
        ref={ref}
        required
        style={{
          backgroundColor: 'red',
          marginTop: 8,
          minHeight: 1,
          position: 'absolute',
        }}
      />,
    );
    const input = screen.getByRole('searchbox', { name: '주문 검색' });
    const root = container.firstElementChild;

    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute('aria-describedby', 'search-help');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('data-consumer', 'orders');
    expect(input).toHaveAttribute('name', 'query');
    expect(input).toHaveAttribute('placeholder', '주문 번호');
    expect(input).toBeRequired();
    expect(root).toHaveClass('ds-search-field', 'consumer-search-field');
    expect(root).toHaveStyle('margin-top: 8px');
    expect((root as HTMLElement).style.backgroundColor).toBe('');
    expect((root as HTMLElement).style.minHeight).toBe('');
    expect((root as HTMLElement).style.position).toBe('');
  });

  it('measures a fixed bar into its take-space spacer and disconnects cleanly', () => {
    const { container, unmount } = render(
      <SearchField clearLabel="검색어 지우기" fixed label="검색" />,
    );
    const root = container.firstElementChild;
    const bar = container.querySelector<HTMLElement>('.ds-search-field__bar');
    const spacer = container.querySelector<HTMLElement>('.ds-search-field__spacer');
    const observer = ResizeObserverDouble.instances[0];

    expect(root).toHaveAttribute('data-fixed', 'true');
    expect(root).toHaveAttribute('data-take-space', 'true');
    expect(bar).not.toBeNull();
    expect(spacer).not.toBeNull();
    expect(observer?.observe).toHaveBeenCalledWith(bar);

    vi.spyOn(bar as HTMLElement, 'getBoundingClientRect').mockReturnValue({
      bottom: 72,
      height: 72,
      left: 0,
      right: 320,
      top: 0,
      width: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    act(() => observer?.trigger(bar as Element));

    expect(spacer).toHaveStyle('block-size: 72px');
    unmount();
    expect(observer?.disconnect).toHaveBeenCalledTimes(1);
  });

  it('uses the CSS spacer fallback without ResizeObserver and omits space when requested', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const fixed = render(
      <SearchField clearLabel="검색어 지우기" fixed label="고정 검색" />,
    );
    const fallbackSpacer = fixed.container.querySelector<HTMLElement>(
      '.ds-search-field__spacer',
    );

    expect(fallbackSpacer).not.toBeNull();
    expect(fallbackSpacer?.style.blockSize).toBe('');
    fixed.unmount();

    const withoutSpace = render(
      <SearchField
        clearLabel="검색어 지우기"
        fixed
        label="공간 없는 검색"
        takeSpace={false}
      />,
    );
    expect(withoutSpace.container.querySelector('.ds-search-field__spacer')).toBeNull();
  });

  it('suppresses the native WebKit cancel control and uses token-backed responsive styles', () => {
    const componentCss = readFileSync('src/search-field/SearchField.css', 'utf8');
    const reactStyles = readFileSync('src/styles.css', 'utf8');

    expect(reactStyles).toContain("@import './search-field/SearchField.css';");
    expect(componentCss).toMatch(
      /::-webkit-search-cancel-button[^}]*-webkit-appearance:\s*none/s,
    );
    expect(componentCss).toContain('min-inline-size: 0');
    expect(componentCss).toContain('var(--ds-color-bg-surface)');
    expect(componentCss).toContain('var(--ds-size-control-large)');
    expect(componentCss).toContain('@media (forced-colors: active)');
  });

  it('renders safely on the server', () => {
    vi.stubGlobal('ResizeObserver', undefined);

    expect(() =>
      renderToString(
        <SearchField
          clearLabel="검색어 지우기"
          defaultValue="서버"
          fixed
          label="검색"
        />,
      )
    ).not.toThrow();
  });

  it('has no axe violations in filled, readonly, disabled, and fixed states', async () => {
    const { container } = render(
      <main>
        <SearchField
          clearLabel="검색어 지우기"
          defaultValue="토스"
          label="검색"
        />
        <SearchField
          clearLabel="읽기 전용 검색어 지우기"
          defaultValue="읽기 전용"
          label="읽기 전용 검색"
          readOnly
        />
        <SearchField
          clearLabel="비활성 검색어 지우기"
          defaultValue="비활성"
          disabled
          label="비활성 검색"
        />
        <SearchField clearLabel="고정 검색어 지우기" fixed label="고정 검색" />
      </main>,
    );

    await expectNoAxeViolations(container);
  });
});
