import { readFileSync } from 'node:fs';
import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import { Switch, type SwitchProps, type SwitchSize } from './index';
import { expectNoAxeViolations } from '../test/accessibility';

describe('Switch', () => {
  it('owns switch semantics and associates a visible label with a generated ID', () => {
    render(<Switch label="주문 알림" />);
    const control = screen.getByRole('switch', { name: '주문 알림' });
    const label = screen.getByText('주문 알림');
    const row = label.closest('label');
    const root = row?.parentElement;

    expect(control.id).toMatch(/^ds-switch-/);
    expect(control).toHaveAttribute('type', 'checkbox');
    expect(control).toHaveAttribute('role', 'switch');
    expect(control).toHaveAttribute('data-size', 'medium');
    expect(control).toHaveAttribute('data-state', 'default');
    expect(row).toHaveAttribute('for', control.id);
    expect(root).toHaveClass('ds-switch');
    expect(root).toHaveAttribute('data-size', 'medium');
    expect(root).toHaveAttribute('data-state', 'default');
  });

  it('uses a supplied ID and size', () => {
    render(<Switch id="notifications" label="알림" size="small" />);
    const control = screen.getByRole('switch', { name: '알림' });

    expect(control).toHaveAttribute('id', 'notifications');
    expect(control).toHaveAttribute('data-size', 'small');
    expect(screen.getByText('알림').closest('label'))
      .toHaveAttribute('for', 'notifications');
  });

  it('keeps native uncontrolled changes and a stable visible label', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="주문 알림" onChange={onChange} />);
    const control = screen.getByRole('switch', { name: '주문 알림' });

    expect(control).not.toBeChecked();
    await user.click(screen.getByText('주문 알림'));
    expect(control).toBeChecked();
    expect(screen.getByText('주문 알림')).toBeVisible();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('supports controlled checked state', async () => {
    const user = userEvent.setup();

    function ControlledSwitch() {
      const [checked, setChecked] = useState(false);
      return (
        <Switch
          checked={checked}
          label="자동 저장"
          onChange={(event) => setChecked(event.target.checked)}
        />
      );
    }

    render(<ControlledSwitch />);
    const control = screen.getByRole('switch', { name: '자동 저장' });

    await user.click(control);
    expect(control).toBeChecked();
    await user.click(control);
    expect(control).not.toBeChecked();
  });

  it('orders description, error, then de-duplicated caller IDs', () => {
    render(
      <div>
        <span id="external-help">외부 도움말</span>
        <Switch
          aria-describedby="external-help external-help"
          description="주문 상태가 바뀌면 알려 드립니다."
          errorMessage="알림 설정을 저장하지 못했습니다."
          id="order-alerts"
          label="주문 알림"
        />
      </div>,
    );
    const control = screen.getByRole('switch', { name: '주문 알림' });

    expect(control).toHaveAttribute(
      'aria-describedby',
      'order-alerts-description order-alerts-error external-help',
    );
    expect(control).toHaveAttribute('aria-errormessage', 'order-alerts-error');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('주문 상태가 바뀌면 알려 드립니다.'))
      .toHaveAttribute('id', 'order-alerts-description');
    expect(screen.getByText('알림 설정을 저장하지 못했습니다.'))
      .toHaveAttribute('id', 'order-alerts-error');
    expect(screen.getByText('알림 설정을 저장하지 못했습니다.'))
      .toHaveAttribute('role', 'alert');
  });

  it('keeps disabled visual precedence over error without dropping error semantics', async () => {
    const user = userEvent.setup();
    render(
      <Switch
        defaultChecked
        disabled
        errorMessage="설정을 변경할 수 없습니다."
        label="고정 설정"
      />,
    );
    const control = screen.getByRole('switch', { name: '고정 설정' });
    const root = control.closest('.ds-switch');

    expect(control).toBeDisabled();
    expect(control).toBeChecked();
    expect(control).toHaveAttribute('data-state', 'disabled');
    expect(root).toHaveAttribute('data-state', 'disabled');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveAttribute('aria-errormessage');
    await user.click(screen.getByText('고정 설정'));
    expect(control).toBeChecked();
  });

  it('forwards native props and its ref to the native checkbox', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <form>
        <Switch
          className="consumer-switch"
          data-consumer="native"
          defaultChecked
          label="마케팅 알림"
          name="marketing"
          ref={ref}
          required
          value="enabled"
        />
      </form>,
    );
    const control = screen.getByRole<HTMLInputElement>('switch', {
      name: '마케팅 알림',
    });

    expect(control).toBeRequired();
    expect(control).toHaveClass('ds-switch__input', 'consumer-switch');
    expect(control).toHaveAttribute('data-consumer', 'native');
    expect(ref.current).toBe(control);
    expect(new FormData(control.form!).get('marketing')).toBe('enabled');
  });

  it('keeps native form value and Space activation', async () => {
    const user = userEvent.setup();
    render(
      <form>
        <Switch label="배송 알림" name="delivery" value="on" />
      </form>,
    );
    const control = screen.getByRole<HTMLInputElement>('switch', {
      name: '배송 알림',
    });

    expect(new FormData(control.form!).get('delivery')).toBeNull();
    await user.tab();
    expect(control).toHaveFocus();
    await user.keyboard(' ');
    expect(control).toBeChecked();
    expect(new FormData(control.form!).get('delivery')).toBe('on');
  });

  it('keeps native required constraint validation', async () => {
    const user = userEvent.setup();
    render(
      <form>
        <Switch label="필수 알림" name="required-alert" required />
      </form>,
    );
    const control = screen.getByRole<HTMLInputElement>('switch', {
      name: '필수 알림',
    });

    expect(control.validity.valueMissing).toBe(true);
    expect(control.checkValidity()).toBe(false);
    expect(control.form?.checkValidity()).toBe(false);
    await user.click(screen.getByText('필수 알림'));
    expect(control.validity.valueMissing).toBe(false);
    expect(control.checkValidity()).toBe(true);
    expect(control.form?.checkValidity()).toBe(true);
  });

  it('owns the 44px pointer target row and field message structure', () => {
    render(
      <Switch
        description="이 기기에서만 적용됩니다."
        errorMessage="다시 시도해 주세요."
        label="절전 모드"
      />,
    );
    const control = screen.getByRole('switch', { name: '절전 모드' });
    const row = control.closest('label');
    const root = control.closest('.ds-switch');

    expect(row).toHaveClass('ds-switch__row');
    expect(row?.children[0]).toBe(control);
    expect(row?.children[1]).toHaveClass('ds-switch__label');
    expect(root?.children[0]).toBe(row);
    expect(root?.children[1]).toHaveClass('ds-switch__description');
    expect(root?.children[2]).toHaveClass('ds-switch__error');
  });

  it('keeps generic interaction selectors below error-state specificity', () => {
    const componentCss = readFileSync('src/switch/Switch.css', 'utf8');

    for (const selector of [
      ":where(.ds-switch__row:hover) .ds-switch__input:where(:not(:disabled))",
      ":where(.ds-switch__row:hover) .ds-switch__input:checked:where(:not(:disabled))",
      ".ds-switch__input:where(:active:not(:disabled))",
      ".ds-switch__input:checked:where(:active:not(:disabled))",
    ]) {
      expect(componentCss).toContain(selector);
    }

    expect(componentCss).toMatch(
      /\.ds-switch__input:checked:where\(:not\(:disabled\)\)\s*\{[^}]*background:\s*var\(--ds-color-action-primary-hover\);[^}]*border-color:\s*var\(--ds-color-action-primary-hover\);/s,
    );
    expect(componentCss).toMatch(
      /\.ds-switch__input:checked:where\(:active:not\(:disabled\)\)\s*\{[^}]*background:\s*var\(--ds-color-action-primary-pressed\);[^}]*border-color:\s*var\(--ds-color-action-primary-pressed\);/s,
    );

    expect(componentCss.indexOf(".ds-switch[data-state='error']"))
      .toBeGreaterThan(componentCss.indexOf(':where(.ds-switch__row:hover)'));
  });

  it('exposes the exact public contract', () => {
    expectTypeOf<SwitchSize>().toEqualTypeOf<'small' | 'medium'>();
    expectTypeOf<NonNullable<SwitchProps['size']>>()
      .toEqualTypeOf<SwitchSize>();
    expectTypeOf<'role' extends keyof SwitchProps ? true : false>()
      .toEqualTypeOf<false>();
    expectTypeOf<'type' extends keyof SwitchProps ? true : false>()
      .toEqualTypeOf<false>();
  });

  it('has no axe violations with description and error content', async () => {
    const { container } = render(
      <Switch
        description="설정을 켜면 바로 적용됩니다."
        errorMessage="설정을 저장하지 못했습니다."
        label="자동 업데이트"
      />,
    );

    await expectNoAxeViolations(container);
  });
});
