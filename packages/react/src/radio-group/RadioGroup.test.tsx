import { readFileSync } from 'node:fs';
import { createRef, useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import {
  RadioGroup,
  type RadioGroupOption,
  type RadioGroupProps,
  type RadioGroupSize,
} from './RadioGroup';
import { expectNoAxeViolations } from '../test/accessibility';

const options = [
  {
    value: 'standard',
    label: '일반',
    description: '영업일 기준 3일 이내 배송',
  },
  {
    value: 'express',
    label: '빠른',
    description: '다음 영업일 배송',
  },
  {
    value: 'pickup',
    label: '매장 수령',
    disabled: true,
  },
] as const satisfies readonly RadioGroupOption[];

describe('RadioGroup', () => {
  it('renders a named native fieldset with generated option IDs', () => {
    render(<RadioGroup legend="배송" name="delivery" options={options} />);
    const group = screen.getByRole('group', { name: '배송' });
    const radios = screen.getAllByRole('radio');

    expect(group).toBeInstanceOf(HTMLFieldSetElement);
    expect(group.id).toMatch(/^hds-radio-group-/);
    expect(group).toHaveAttribute('data-size', 'medium');
    expect(group).toHaveAttribute('data-state', 'default');
    expect(radios).toHaveLength(3);
    expect(radios.map((radio) => radio.getAttribute('name')))
      .toEqual(['delivery', 'delivery', 'delivery']);
    expect(radios[0]?.id).toBe(`${group.id}-option-0`);
    expect(screen.getByText('일반').closest('label'))
      .toHaveAttribute('for', `${group.id}-option-0`);
  });

  it('supports native uncontrolled selection, form values, and onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <form>
        <RadioGroup
          defaultValue="standard"
          legend="배송"
          name="delivery"
          onChange={onChange}
          options={options}
        />
      </form>,
    );
    const standard = screen.getByRole<HTMLInputElement>('radio', { name: '일반' });
    const express = screen.getByRole<HTMLInputElement>('radio', { name: '빠른' });

    expect(standard).toBeChecked();
    expect(new FormData(standard.form!).get('delivery')).toBe('standard');
    await user.click(screen.getByText('빠른'));
    expect(express).toBeChecked();
    expect(standard).not.toBeChecked();
    expect(new FormData(express.form!).get('delivery')).toBe('express');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0].target).toBe(express);
  });

  it('supports controlled selection without maintaining mirror state', async () => {
    const user = userEvent.setup();

    function ControlledRadioGroup() {
      const [value, setValue] = useState('standard');
      return (
        <RadioGroup
          legend="배송"
          name="delivery"
          onChange={(event) => setValue(event.target.value)}
          options={options}
          value={value}
        />
      );
    }

    render(<ControlledRadioGroup />);
    const express = screen.getByRole('radio', { name: '빠른' });

    await user.click(express);
    expect(express).toBeChecked();
    expect(screen.getByRole('radio', { name: '일반' })).not.toBeChecked();
  });

  it('merges group, option, error, and caller descriptive relationships', () => {
    render(
      <div>
        <span id="external-help">외부 도움말</span>
        <RadioGroup
          aria-describedby="external-help external-help"
          description="배송 방법을 선택하세요."
          errorMessage="배송 방법은 필수입니다."
          id="shipping"
          legend="배송"
          name="delivery"
          options={options}
        />
      </div>,
    );
    const group = screen.getByRole('group', { name: '배송' });
    const standard = screen.getByRole('radio', { name: '일반' });
    const pickup = screen.getByRole('radio', { name: '매장 수령' });

    expect(group).toHaveAttribute(
      'aria-describedby',
      'shipping-description shipping-error external-help',
    );
    expect(group).toHaveAttribute('aria-errormessage', 'shipping-error');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(standard).toHaveAttribute(
      'aria-describedby',
      'shipping-option-0-description shipping-description shipping-error external-help',
    );
    expect(standard).toHaveAttribute('aria-errormessage', 'shipping-error');
    expect(standard).toHaveAttribute('aria-invalid', 'true');
    expect(pickup).toHaveAttribute(
      'aria-describedby',
      'shipping-description shipping-error external-help',
    );
    expect(screen.getByText('배송 방법을 선택하세요.'))
      .toHaveAttribute('id', 'shipping-description');
    expect(screen.getByText('영업일 기준 3일 이내 배송'))
      .toHaveAttribute('id', 'shipping-option-0-description');
    expect(screen.getByText('배송 방법은 필수입니다.'))
      .toHaveAttribute('id', 'shipping-error');
    expect(screen.getByText('배송 방법은 필수입니다.')).toHaveAttribute('role', 'alert');
  });

  it('applies required only to the first enabled option and keeps native validity', async () => {
    const user = userEvent.setup();
    const firstDisabledOptions = [
      { value: 'none', label: '선택 안 함', disabled: true },
      { value: 'email', label: '이메일' },
      { value: 'sms', label: '문자' },
    ] satisfies readonly RadioGroupOption[];

    render(
      <RadioGroup
        legend="연락 방법"
        name="contact"
        options={firstDisabledOptions}
        required
      />,
    );
    const radios = screen.getAllByRole('radio');

    expect(radios[0]).toBeDisabled();
    expect(radios[0]).not.toBeRequired();
    expect(radios[1]).toBeRequired();
    expect(radios[2]).not.toBeRequired();
    expect((radios[1] as HTMLInputElement).checkValidity()).toBe(false);
    await user.click(screen.getByRole('radio', { name: '문자' }));
    expect((radios[1] as HTMLInputElement).checkValidity()).toBe(true);
  });

  it('supports fieldset and individual option disabled behavior', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <RadioGroup legend="배송" name="delivery" options={options} />,
    );
    const pickup = screen.getByRole('radio', { name: '매장 수령' });

    expect(pickup).toBeDisabled();
    await user.click(screen.getByText('매장 수령'));
    expect(pickup).not.toBeChecked();

    rerender(
      <RadioGroup
        disabled
        errorMessage="변경할 수 없습니다."
        legend="배송"
        name="delivery"
        options={options}
      />,
    );
    const group = screen.getByRole('group', { name: '배송' });

    expect(group).toBeDisabled();
    expect(group).toHaveAttribute('data-state', 'disabled');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled();
      expect(radio).toHaveAttribute('data-state', 'disabled');
    }
  });

  it('forwards fieldset props, className, and ref to the native fieldset', () => {
    const ref = createRef<HTMLFieldSetElement>();
    render(
      <RadioGroup
        className="consumer-group"
        data-consumer="native"
        form="checkout"
        id="delivery-method"
        legend="배송"
        name="delivery"
        options={options}
        ref={ref}
        size="small"
      />,
    );
    const group = screen.getByRole('group', { name: '배송' });

    expect(ref.current).toBe(group);
    expect(group).toHaveClass('hds-radio-group', 'consumer-group');
    expect(group).toHaveAttribute('data-consumer', 'native');
    expect(group).toHaveAttribute('form', 'checkout');
    expect(group).toHaveAttribute('data-size', 'small');
    expect(screen.getByRole('radio', { name: '일반' }))
      .toHaveAttribute('data-size', 'small');
  });

  it('keeps label rows as native pointer targets with 44px-compatible structure', async () => {
    const user = userEvent.setup();
    render(<RadioGroup legend="배송" name="delivery" options={options} />);
    const group = screen.getByRole('group', { name: '배송' });
    const list = group.querySelector('.hds-radio-group__options');
    const row = screen.getByText('일반').closest('label');
    const input = screen.getByRole('radio', { name: '일반' });

    expect(list).toBeInTheDocument();
    expect(row).toHaveClass('hds-radio-group__option');
    expect(row?.children[0]).toBe(input);
    expect(row?.children[1]).toHaveClass('hds-radio-group__option-copy');
    expect(within(row!).getByText('영업일 기준 3일 이내 배송'))
      .toHaveClass('hds-radio-group__option-description');
    await user.click(screen.getByText('일반'));
    expect(input).toBeChecked();
  });

  it('keeps browser-owned radio keyboard behavior', async () => {
    const user = userEvent.setup();
    render(<RadioGroup legend="배송" name="delivery" options={options} />);
    const standard = screen.getByRole('radio', { name: '일반' });
    const express = screen.getByRole('radio', { name: '빠른' });

    standard.focus();
    await user.keyboard('{ArrowDown}');
    expect(express).toBeChecked();
    expect(express).toHaveFocus();
  });

  it('keeps generic interaction selectors below error and forced-colors specificity', () => {
    const componentCss = readFileSync('src/radio-group/RadioGroup.css', 'utf8');

    for (const selector of [
      ':where(.hds-radio-group__option:hover) .hds-radio-group__input:where(:not(:disabled))',
      ':where(.hds-radio-group__option:hover) .hds-radio-group__input:checked:where(:not(:disabled))',
      '.hds-radio-group__input:where(:active:not(:disabled))',
      '.hds-radio-group__input:checked:where(:active:not(:disabled))',
    ]) {
      expect(componentCss).toContain(selector);
    }

    expect(componentCss.indexOf(".hds-radio-group__input[data-state='error']"))
      .toBeGreaterThan(componentCss.indexOf(':where(.hds-radio-group__option:hover)'));
    expect(componentCss.indexOf('@media (forced-colors: active)'))
      .toBeGreaterThan(componentCss.indexOf(':where(.hds-radio-group__option:hover)'));
  });

  it('exposes the exact public unions and option contract', () => {
    expectTypeOf<RadioGroupSize>().toEqualTypeOf<'small' | 'medium'>();
    expectTypeOf<NonNullable<RadioGroupProps['size']>>()
      .toEqualTypeOf<RadioGroupSize>();
    expectTypeOf<RadioGroupProps['options']>()
      .toEqualTypeOf<readonly RadioGroupOption[]>();
    expectTypeOf<RadioGroupOption>().toEqualTypeOf<{
      value: string;
      label: string;
      description?: string;
      disabled?: boolean;
    }>();
  });

  it('has no axe violations with descriptions, disabled options, and an error', async () => {
    const { container } = render(
      <RadioGroup
        description="주문에 사용할 배송 방법입니다."
        errorMessage="배송 방법을 선택하세요."
        legend="배송"
        name="delivery"
        options={options}
        required
      />,
    );

    await expectNoAxeViolations(container);
  });
});
