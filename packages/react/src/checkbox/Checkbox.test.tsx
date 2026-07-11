import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import {
  Checkbox,
  type CheckboxProps,
  type CheckboxSize,
} from '../index';
import { expectNoAxeViolations } from '../test/accessibility';

describe('Checkbox', () => {
  it('associates a visible label with a generated input ID', () => {
    render(<Checkbox label="배송 알림 받기" />);
    const input = screen.getByRole('checkbox', { name: '배송 알림 받기' });
    const label = screen.getByText('배송 알림 받기');
    const row = label.closest('label');
    const root = row?.parentElement;

    expect(input.id).toMatch(/^ds-checkbox-/);
    expect(row).toHaveAttribute('for', input.id);
    expect(input).toHaveAttribute('type', 'checkbox');
    expect(input).toHaveAttribute('data-size', 'medium');
    expect(input).toHaveAttribute('data-state', 'default');
    expect(root).toHaveClass('ds-checkbox');
    expect(root).toHaveAttribute('data-size', 'medium');
    expect(root).toHaveAttribute('data-state', 'default');
  });

  it('uses a supplied ID and size', () => {
    render(<Checkbox id="newsletter" label="뉴스레터" size="small" />);
    const input = screen.getByRole('checkbox', { name: '뉴스레터' });

    expect(input).toHaveAttribute('id', 'newsletter');
    expect(input).toHaveAttribute('data-size', 'small');
    expect(screen.getByText('뉴스레터').closest('label'))
      .toHaveAttribute('for', 'newsletter');
  });

  it('supports uncontrolled checked changes through its visible label', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="선물 포장" onChange={onChange} />);
    const input = screen.getByRole('checkbox', { name: '선물 포장' });

    expect(input).not.toBeChecked();
    await user.click(screen.getByText('선물 포장'));
    expect(input).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('supports controlled checked state', async () => {
    const user = userEvent.setup();

    function ControlledCheckbox() {
      const [checked, setChecked] = useState(false);
      return (
        <Checkbox
          checked={checked}
          label="관심 상품"
          onChange={(event) => setChecked(event.target.checked)}
        />
      );
    }

    render(<ControlledCheckbox />);
    const input = screen.getByRole('checkbox', { name: '관심 상품' });

    await user.click(input);
    expect(input).toBeChecked();
    await user.click(input);
    expect(input).not.toBeChecked();
  });

  it('synchronizes the native indeterminate property', () => {
    const { rerender } = render(<Checkbox indeterminate label="전체 선택" />);
    const input = screen.getByRole('checkbox', { name: '전체 선택' });

    expect(input).toBePartiallyChecked();
    rerender(<Checkbox indeterminate={false} label="전체 선택" />);
    expect(input).not.toBePartiallyChecked();
  });

  it('orders description, error, then de-duplicated caller IDs', () => {
    render(
      <div>
        <span id="external-help">외부 도움말</span>
        <Checkbox
          aria-describedby="external-help external-help"
          description="결제 알림에 사용합니다."
          errorMessage="동의가 필요합니다."
          id="terms"
          label="약관 동의"
        />
      </div>,
    );
    const input = screen.getByRole('checkbox', { name: '약관 동의' });

    expect(input).toHaveAttribute(
      'aria-describedby',
      'terms-description terms-error external-help',
    );
    expect(input).toHaveAttribute('aria-errormessage', 'terms-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('결제 알림에 사용합니다.'))
      .toHaveAttribute('id', 'terms-description');
    expect(screen.getByText('동의가 필요합니다.')).toHaveAttribute('id', 'terms-error');
    expect(screen.getByText('동의가 필요합니다.')).toHaveAttribute('role', 'alert');
  });

  it('keeps disabled visual precedence over error without dropping error semantics', async () => {
    const user = userEvent.setup();
    render(
      <Checkbox
        defaultChecked
        disabled
        errorMessage="선택을 변경할 수 없습니다."
        label="고정 선택"
      />,
    );
    const input = screen.getByRole('checkbox', { name: '고정 선택' });
    const root = input.closest('.ds-checkbox');

    expect(input).toBeDisabled();
    expect(input).toBeChecked();
    expect(input).toHaveAttribute('data-state', 'disabled');
    expect(root).toHaveAttribute('data-state', 'disabled');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-errormessage');
    await user.click(screen.getByText('고정 선택'));
    expect(input).toBeChecked();
  });

  it('forwards native props and its ref to the native input', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <form>
        <Checkbox
          className="consumer-checkbox"
          data-consumer="native"
          defaultChecked
          label="마케팅 수신"
          name="marketing"
          ref={ref}
          required
          value="yes"
        />
      </form>,
    );
    const input = screen.getByRole<HTMLInputElement>('checkbox', { name: '마케팅 수신' });

    expect(input).toBeRequired();
    expect(input).toHaveClass('ds-checkbox__input', 'consumer-checkbox');
    expect(input).toHaveAttribute('data-consumer', 'native');
    expect(ref.current).toBe(input);
    expect(new FormData(input.form!).get('marketing')).toBe('yes');
  });

  it('keeps native form value and Space activation', async () => {
    const user = userEvent.setup();
    render(
      <form>
        <Checkbox label="약관 동의" name="terms" value="yes" />
      </form>,
    );
    const input = screen.getByRole<HTMLInputElement>('checkbox', { name: '약관 동의' });

    expect(new FormData(input.form!).get('terms')).toBeNull();
    await user.tab();
    expect(input).toHaveFocus();
    await user.keyboard(' ');
    expect(input).toBeChecked();
    expect(new FormData(input.form!).get('terms')).toBe('yes');
  });

  it('owns the pointer target on the label row while keeping the input native', () => {
    render(
      <Checkbox
        description="주문 상태를 알려 드립니다."
        errorMessage="연락처 확인이 필요합니다."
        label="문자 알림"
      />,
    );
    const input = screen.getByRole('checkbox', { name: '문자 알림' });
    const row = input.closest('label');
    const root = input.closest('.ds-checkbox');

    expect(row).toHaveClass('ds-checkbox__row');
    expect(row?.children[0]).toBe(input);
    expect(row?.children[1]).toHaveClass('ds-checkbox__label');
    expect(root?.children[0]).toBe(row);
    expect(root?.children[1]).toHaveClass('ds-checkbox__description');
    expect(root?.children[2]).toHaveClass('ds-checkbox__error');
  });

  it('exposes the exact public size union', () => {
    expectTypeOf<CheckboxSize>().toEqualTypeOf<'small' | 'medium'>();
    expectTypeOf<NonNullable<CheckboxProps['size']>>()
      .toEqualTypeOf<CheckboxSize>();
  });

  it('has no axe violations with description and error content', async () => {
    const { container } = render(
      <Checkbox
        description="필수 약관입니다."
        errorMessage="약관에 동의하세요."
        label="서비스 약관"
      />,
    );

    await expectNoAxeViolations(container);
  });
});
