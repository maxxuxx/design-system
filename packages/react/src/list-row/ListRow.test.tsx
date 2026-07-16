import { readFileSync } from 'node:fs';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { ICON_PATHS } from '../icon';
import { Switch } from '../switch';
import { expectNoAxeViolations } from '../test/accessibility';
import { ListRow, type ListRowProps } from './ListRow';

describe('ListRow', () => {
  it('renders the static fallback as a div and forwards div props and ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ListRow
        aria-label="배송지 정보"
        className="consumer-row"
        data-testid="static-row"
        id="delivery-row"
        ref={ref}
        title="배송지"
      />,
    );

    const row = screen.getByTestId('static-row');
    expect(row).toBeInstanceOf(HTMLDivElement);
    expect(row).toHaveClass('hds-list-row', 'consumer-row');
    expect(row).toHaveAttribute('id', 'delivery-row');
    expect(row).toHaveAttribute('aria-label', '배송지 정보');
    expect(row).not.toHaveAttribute('role');
    expect(row).not.toHaveAttribute('tabindex');
    expect(ref.current).toBe(row);
  });

  it('renders the onClick branch as a native button with button props, ref, and keyboard behavior', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <ListRow
        className="consumer-button"
        data-testid="button-row"
        name="intent"
        onClick={onClick}
        ref={ref}
        title="결제 수단 변경"
        value="payment"
      />,
    );

    const button = screen.getByRole('button', { name: '결제 수단 변경' });
    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('name', 'intent');
    expect(button).toHaveAttribute('value', 'payment');
    expect(button).toHaveClass('hds-list-row', 'consumer-button');
    expect(ref.current).toBe(button);

    button.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('supports native button type and disabled behavior', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <ListRow
        disabled
        onClick={onClick}
        title="사용할 수 없음"
        type="submit"
      />,
    );

    const button = screen.getByRole('button', { name: '사용할 수 없음' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('type', 'submit');
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('dispatches a string href before onClick and forwards anchor props and ref', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((event) => event.preventDefault());
    const ref = createRef<HTMLAnchorElement>();
    render(
      <ListRow
        href="/orders/42/"
        onClick={onClick}
        ref={ref}
        rel="noreferrer"
        target="_blank"
        title="주문 상세"
        type="text/html"
      />,
    );

    const link = screen.getByRole('link', { name: '주문 상세' });
    expect(link).toBeInstanceOf(HTMLAnchorElement);
    expect(link).toHaveAttribute('href', '/orders/42/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
    expect(link).toHaveAttribute('type', 'text/html');
    expect(ref.current).toBe(link);
    await user.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('never exposes or renders a fake-disabled anchor', () => {
    type AnchorProps = Extract<ListRowProps, { href: string }>;
    type AnchorDisabledProp = Extract<'disabled', keyof AnchorProps>;
    expectTypeOf<AnchorDisabledProp>().toEqualTypeOf<never>();

    const invalidAnchorProps = {
      disabled: true,
      href: '/still-active/',
      title: '계속 이동',
    } as unknown as AnchorProps;
    render(<ListRow {...invalidAnchorProps} />);

    const link = screen.getByRole('link', { name: '계속 이동' });
    expect(link).toHaveAttribute('href', '/still-active/');
    expect(link).not.toHaveAttribute('disabled');
    expect(link).not.toHaveAttribute('aria-disabled');
  });

  it('hides left content, exposes right content, and owns an optional decorative arrow', () => {
    const { container } = render(
      <ListRow
        description="다음 날 도착"
        left={<span data-testid="left-art">01</span>}
        right={<span data-testid="right-copy">무료</span>}
        title="일반 배송"
        withArrow
      />,
    );

    const left = screen.getByTestId('left-art').parentElement;
    const right = screen.getByTestId('right-copy').parentElement;
    const icon = container.querySelector('.hds-list-row__arrow .hds-icon');
    expect(left).toHaveAttribute('aria-hidden', 'true');
    expect(right).not.toHaveAttribute('aria-hidden');
    expect(screen.getByText('다음 날 도착')).toHaveClass(
      'hds-list-row__description',
    );
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(
      Array.from(icon?.querySelectorAll('path') ?? [], (path) =>
        path.getAttribute('d'),
      ),
    ).toEqual(ICON_PATHS['chevron-right']);
    expect(container.querySelector('.hds-list-row__arrow')).not.toHaveStyle(
      'transform: rotate(90deg)',
    );
  });

  it('allows an interactive right child only on the static branch', async () => {
    const user = userEvent.setup();
    render(
      <ListRow
        right={<Switch label="배송 알림" />}
        title="배송 알림 받기"
      />,
    );

    const control = screen.getByRole('switch', { name: '배송 알림' });
    await user.click(control);
    expect(control).toBeChecked();
    expect(control.closest('.hds-list-row__right')).not.toHaveAttribute(
      'aria-hidden',
    );
  });

  it.each([
    ['anchor', <a href="/nested/">중첩 링크</a>],
    ['button', <button type="button">중첩 버튼</button>],
    ['input', <input aria-label="중첩 입력" />],
    ['select', <select aria-label="중첩 선택" />],
    ['textarea', <textarea aria-label="중첩 메모" />],
    ['summary', <summary>중첩 요약</summary>],
    ['positive tabindex', <span tabIndex={1}>중첩 포커스</span>],
  ])('rejects a nested %s after rendering a whole-row button', (_name, right) => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(<ListRow onClick={() => {}} right={right} title="작업" />),
    ).toThrow(/must not contain nested interactive descendants/i);
    consoleError.mockRestore();
  });

  it('rejects nested controls on links but permits non-positive tabindex content', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <ListRow
          href="/nested/"
          right={<input aria-label="중첩 입력" />}
          title="이동"
        />,
      ),
    ).toThrow(/must not contain nested interactive descendants/i);
    consoleError.mockRestore();

    render(
      <ListRow
        href="/allowed/"
        right={<span tabIndex={-1}>보조 설명</span>}
        title="허용 이동"
      />,
    );
    expect(screen.getByRole('link', { name: /허용 이동/ })).toBeInTheDocument();
  });

  it('skips nested-descendant validation in production mode', () => {
    vi.stubEnv('NODE_ENV', 'production');
    try {
      expect(() =>
        render(
          <ListRow
            onClick={() => {}}
            right={<span tabIndex={1}>production descendant</span>}
            title="production row"
          />,
        ),
      ).not.toThrow();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('preserves owned content and data contracts while filtering unsafe runtime props and styles', () => {
    type StaticProps = Extract<
      ListRowProps,
      { href?: never; onClick?: never }
    >;
    const injection = { __html: '<span data-injected="true">주입</span>' };
    const runtimeProps = {
      'data-divider': 'none',
      'data-with-arrow': 'false',
      dangerouslySetInnerHTML: injection,
      divider: 'indented',
      disabled: true,
      form: 'unsafe-form',
      href: 42,
      onClick: 'unsafe-handler',
      style: { color: 'red', marginTop: 1, minHeight: 1 },
      title: '안전한 행',
      type: 'submit',
      withArrow: true,
    } as unknown as StaticProps;
    const { container } = render(<ListRow {...runtimeProps} />);

    const row = screen.getByText('안전한 행').closest('.hds-list-row')!;
    expect(row).toBeInstanceOf(HTMLDivElement);
    expect(row).toHaveAttribute('data-divider', 'indented');
    expect(row).toHaveAttribute('data-with-arrow', 'true');
    expect(row).not.toHaveAttribute('disabled');
    expect(row).not.toHaveAttribute('form');
    expect(row).not.toHaveAttribute('href');
    expect(row).not.toHaveAttribute('onclick');
    expect(row).not.toHaveAttribute('type');
    expect(row).toHaveStyle('margin-top: 1px');
    expect((row as HTMLElement).style.color).toBe('');
    expect((row as HTMLElement).style.minHeight).toBe('');
    expect(container.querySelector('[data-injected="true"]')).toBeNull();
  });

  it('preserves long localized and unbroken copy', () => {
    const longCopy = 'ListRowLongUnbrokenLocalizedCopy'.repeat(12);
    render(<ListRow description={longCopy} title={longCopy} />);
    expect(screen.getAllByText(longCopy)).toHaveLength(2);
  });

  it('uses token-only flat row geometry, wrapping, divider, focus, and forced colors', () => {
    const componentCss = readFileSync('src/list-row/ListRow.css', 'utf8');
    const componentSource = readFileSync('src/list-row/ListRow.tsx', 'utf8');
    const reactStyles = readFileSync('src/styles.css', 'utf8');

    expect(reactStyles).toContain("@import './list-row/ListRow.css';");
    expect(componentCss).toMatch(
      /\.hds-list-row\s*\{[^}]*min-block-size:\s*var\(--hds-size-control-large\);/s,
    );
    expect(componentCss).toContain('overflow-wrap: anywhere;');
    expect(componentCss).toContain("[data-divider='indented']");
    expect(componentCss).toContain(':focus-visible');
    expect(componentCss).toContain('@media (forced-colors: active)');
    expect(componentCss).not.toContain('@keyframes');
    expect(componentCss).not.toMatch(/#[\da-f]{3,8}\b|rgba?\(|hsla?\(/i);
    expect(componentCss).toContain('var(--hds-color-bg-surface)');
    expect(componentCss).toContain('var(--hds-color-text-primary)');
    expect(componentCss).toContain('var(--hds-color-action-weak)');
    expect(componentCss).toContain('var(--hds-color-action-weak-hover)');
    expect(componentCss).toContain('var(--hds-color-border-default)');
    expect(componentCss).toMatch(
      /\.hds-list-row__left \.hds-icon,\s*\.hds-list-row__arrow \.hds-icon\s*\{[^}]*color:\s*inherit;/s,
    );
    expect(componentCss).not.toContain('forced-color-adjust: none');
    expect(componentSource).toContain(
      "process.env.NODE_ENV === 'production'",
    );
    expect(componentSource).not.toContain('globalThis as typeof globalThis');
  });

  it('has no axe violations across static, button, disabled, and link rows', async () => {
    const { container } = render(
      <div>
        <ListRow
          description="설명을 포함합니다."
          left={<span>01</span>}
          right={<Switch label="알림" />}
          title="정적 행"
        />
        <ListRow onClick={() => {}} title="버튼 행" withArrow />
        <ListRow disabled onClick={() => {}} title="비활성 행" />
        <ListRow href="/details/" title="링크 행" withArrow />
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
