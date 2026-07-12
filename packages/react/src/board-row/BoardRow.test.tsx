import { readFileSync } from 'node:fs';
import { createRef, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { ICON_PATHS } from '../icon';
import { expectNoAxeViolations } from '../test/accessibility';
import { BoardRow, type BoardRowProps } from './BoardRow';

describe('BoardRow', () => {
  it('renders native details and summary semantics with an owned decorative arrow', () => {
    const { container } = render(
      <BoardRow title="배송 정보">
        <p>내일 도착합니다.</p>
      </BoardRow>,
    );

    const details = container.querySelector('details');
    const summary = screen.getByText('배송 정보').closest('summary');
    const icon = summary?.querySelector('.ds-icon');

    expect(details).toHaveClass('ds-board-row');
    expect(details).not.toHaveAttribute('open');
    expect(summary).toHaveClass('ds-board-row__summary');
    expect(summary).not.toHaveAttribute('role');
    expect(summary).not.toHaveAttribute('tabindex');
    expect(details).toContainElement(summary);
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).not.toHaveAttribute('role');
    expect(
      Array.from(icon?.querySelectorAll('path') ?? [], (path) =>
        path.getAttribute('d'),
      ),
    ).toEqual(ICON_PATHS['chevron-right']);
  });

  it('forwards documented native details props, className, style, and ref', () => {
    const ref = createRef<HTMLDetailsElement>();
    render(
      <BoardRow
        aria-label="배송 상세"
        className="consumer-row"
        data-testid="board-row"
        id="delivery-row"
        ref={ref}
        style={{ marginTop: 1 }}
        title="배송 정보"
      >
        배송 내용
      </BoardRow>,
    );
    const details = screen.getByTestId('board-row');

    expect(details).toHaveAttribute('id', 'delivery-row');
    expect(details).toHaveAttribute('aria-label', '배송 상세');
    expect(details).toHaveClass('ds-board-row', 'consumer-row');
    expect(details).toHaveStyle('margin-top: 1px');
    expect(ref.current).toBe(details);
  });

  it('uses defaultOpen as an uncontrolled initial value and reports the final native click state', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { container } = render(
      <BoardRow
        defaultOpen
        onOpenChange={onOpenChange}
        title="주문 내역"
      >
        주문 내용
      </BoardRow>,
    );
    const details = container.querySelector('details')!;
    const summary = container.querySelector('summary')!;

    expect(details.open).toBe(true);
    expect(details).not.toHaveAttribute('defaultopen');
    await user.click(summary);

    expect(details.open).toBe(false);
    await waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(false));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it('leaves Enter and Space handling to the native summary element', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <BoardRow title="결제 정보">
        결제 내용
      </BoardRow>,
    );
    const summary = container.querySelector('summary')!;
    const keyboardEvents: Array<{ key: string; defaultPrevented: boolean }> = [];
    summary.addEventListener('keydown', (event) => {
      keyboardEvents.push({
        key: event.key,
        defaultPrevented: event.defaultPrevented,
      });
    });

    summary.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(summary).toHaveFocus();
    expect(summary).not.toHaveAttribute('role');
    expect(summary).not.toHaveAttribute('tabindex');
    expect(keyboardEvents).toEqual([
      { key: 'Enter', defaultPrevented: false },
      { key: ' ', defaultPrevented: false },
    ]);
  });

  it('reconciles controlled native toggles and follows controlled prop updates', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { container, rerender } = render(
      <BoardRow
        defaultOpen
        open={false}
        onOpenChange={onOpenChange}
        title="정책"
      >
        정책 내용
      </BoardRow>,
    );
    const details = container.querySelector('details')!;
    const summary = container.querySelector('summary')!;

    expect(details.open).toBe(false);
    await user.click(summary);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true));
    await waitFor(() => expect(details.open).toBe(false));
    expect(onOpenChange).toHaveBeenCalledTimes(1);

    rerender(
      <BoardRow open onOpenChange={onOpenChange} title="정책">
        정책 내용
      </BoardRow>,
    );
    await waitFor(() => expect(details.open).toBe(true));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it('lets a controlled owner accept the final native state without duplicate callbacks', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    function ControlledBoardRow() {
      const [open, setOpen] = useState(false);
      return (
        <BoardRow
          open={open}
          onOpenChange={(nextOpen) => {
            onOpenChange(nextOpen);
            setOpen(nextOpen);
          }}
          title="제어 예제"
        >
          제어된 내용
        </BoardRow>
      );
    }

    const { container } = render(<ControlledBoardRow />);
    const details = container.querySelector('details')!;

    await user.click(container.querySelector('summary')!);
    await waitFor(() => expect(details.open).toBe(true));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    await user.click(container.querySelector('summary')!);
    await waitFor(() => expect(details.open).toBe(false));
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('renders optional presentational prefix, description, and owned content region', () => {
    const { container } = render(
      <BoardRow
        description="변경 사항을 확인하세요."
        prefix={<span data-testid="prefix-art">01</span>}
        title="업데이트"
      >
        <p data-testid="disclosure-content">새 기능이 추가되었습니다.</p>
      </BoardRow>,
    );

    const prefix = screen.getByTestId('prefix-art').parentElement;
    const description = screen.getByText('변경 사항을 확인하세요.');
    const content = screen.getByTestId('disclosure-content').parentElement;

    expect(prefix).toHaveClass('ds-board-row__prefix');
    expect(prefix).toHaveAttribute('aria-hidden', 'true');
    expect(description).toHaveClass('ds-board-row__description');
    expect(content).toHaveClass('ds-board-row__content');
    expect(container.querySelector('summary a, summary button, summary input'))
      .not.toBeInTheDocument();
  });

  it('preserves long unbroken title, description, prefix, and content copy', () => {
    const longCopy = 'BoardRowLongUnbrokenCopy'.repeat(12);
    render(
      <BoardRow
        defaultOpen
        description={longCopy}
        prefix={longCopy}
        title={longCopy}
      >
        <span>{longCopy}</span>
      </BoardRow>,
    );

    expect(screen.getAllByText(longCopy)).toHaveLength(4);
  });

  it('owns onToggle while retaining its controlled open public contract', () => {
    type ForbiddenNativeProps = Extract<'onToggle', keyof BoardRowProps>;
    expectTypeOf<ForbiddenNativeProps>().toEqualTypeOf<never>();
    expectTypeOf<BoardRowProps['open']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<BoardRowProps['defaultOpen']>()
      .toEqualTypeOf<boolean | undefined>();
  });

  it('uses tokens for a 56px summary and does not animate content height', () => {
    const componentCss = readFileSync('src/board-row/BoardRow.css', 'utf8');
    const reactStyles = readFileSync('src/styles.css', 'utf8');

    expect(reactStyles).toContain("@import './board-row/BoardRow.css';");
    expect(componentCss).toMatch(
      /\.ds-board-row__summary\s*\{[^}]*min-block-size:\s*var\(--ds-size-control-large\);/s,
    );
    expect(componentCss).toContain('.ds-board-row[open] .ds-board-row__arrow');
    expect(componentCss).toContain('var(--ds-motion-duration-fast)');
    expect(componentCss).toContain('var(--ds-motion-easing-standard)');
    expect(componentCss).toContain('@media (forced-colors: active)');
    expect(componentCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(componentCss).not.toMatch(
      /transition(?:-property)?\s*:[^;]*(?:height|block-size|max-height|max-block-size)/i,
    );
    expect(componentCss).not.toContain('@keyframes');
    expect(componentCss).not.toMatch(/#[\da-f]{3,8}\b|rgba?\(|hsla?\(/i);
  });

  it('has no axe violations with closed and open disclosures', async () => {
    const { container } = render(
      <div>
        <BoardRow title="닫힌 항목">닫힌 내용</BoardRow>
        <BoardRow
          defaultOpen
          description="상세 설명"
          prefix={<span>02</span>}
          title="열린 항목"
        >
          열린 내용
        </BoardRow>
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
