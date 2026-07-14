import { createRef, useState, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../test/accessibility';
import {
  Select,
  type SelectProps,
  type SelectSize,
} from './Select';

type IsRequired<T, Key extends keyof T> = {} extends Pick<T, Key> ? false : true;

describe('Select', () => {
  it('associates a visible label with a generated select ID and applies defaults', () => {
    render(
      <Select label="국가">
        <option value="kr">대한민국</option>
      </Select>,
    );
    const select = screen.getByRole('combobox', { name: '국가' });
    const label = screen.getByText('국가');
    const root = select.closest('.ds-select');

    expect(select.id).toMatch(/^ds-select-/);
    expect(label).toHaveAttribute('for', select.id);
    expect(select).toHaveAttribute('data-size', 'medium');
    expect(select).toHaveAttribute('data-state', 'default');
    expect(select).not.toHaveAttribute('multiple');
    expect(select).not.toHaveAttribute('size');
    expect(root).toHaveAttribute('data-size', 'medium');
    expect(root).toHaveAttribute('data-state', 'default');
  });

  it('prepends an optional disabled empty-value placeholder', () => {
    render(
      <Select defaultValue="" label="국가" placeholder="선택하세요">
        <option value="kr">대한민국</option>
      </Select>,
    );
    const select = screen.getByRole('combobox', { name: '국가' });
    const placeholder = screen.getByRole('option', { name: '선택하세요' });

    expect(placeholder).toBeDisabled();
    expect(placeholder).toHaveValue('');
    expect(select).toHaveValue('');
    expect(select.firstElementChild).toBe(placeholder);
  });

  it('does not add a placeholder when none is provided', () => {
    render(
      <Select label="배송 방식">
        <option value="parcel">택배</option>
      </Select>,
    );
    const select = screen.getByRole('combobox', { name: '배송 방식' });

    expect(select.children).toHaveLength(1);
    expect(select.firstElementChild).toHaveTextContent('택배');
  });

  it('preserves native option and optgroup composition', () => {
    render(
      <Select defaultValue="busan" label="지역">
        <optgroup label="수도권">
          <option value="seoul">서울</option>
        </optgroup>
        <optgroup label="영남권">
          <option value="busan">부산</option>
        </optgroup>
      </Select>,
    );
    const select = screen.getByRole<HTMLSelectElement>('combobox', { name: '지역' });

    expect(select).toHaveValue('busan');
    expect(select.querySelectorAll('optgroup')).toHaveLength(2);
    expect(select.querySelector('optgroup[label="수도권"]')).toContainElement(
      screen.getByRole('option', { name: '서울' }),
    );
  });

  it('supports uncontrolled and controlled native selection', async () => {
    const user = userEvent.setup();
    const onUncontrolledChange = vi.fn();

    function ControlledSelect() {
      const [value, setValue] = useState('medium');
      return (
        <Select
          label="제어 크기"
          onChange={(event) => setValue(event.target.value)}
          value={value}
        >
          <option value="small">작게</option>
          <option value="medium">보통</option>
          <option value="large">크게</option>
        </Select>
      );
    }

    render(
      <div>
        <Select
          defaultValue="parcel"
          label="비제어 배송"
          onChange={onUncontrolledChange}
        >
          <option value="parcel">택배</option>
          <option value="pickup">방문 수령</option>
        </Select>
        <ControlledSelect />
      </div>,
    );
    const uncontrolled = screen.getByRole('combobox', { name: '비제어 배송' });
    const controlled = screen.getByRole('combobox', { name: '제어 크기' });

    await user.selectOptions(uncontrolled, 'pickup');
    expect(uncontrolled).toHaveValue('pickup');
    expect(onUncontrolledChange).toHaveBeenCalledTimes(1);

    await user.selectOptions(controlled, 'large');
    expect(controlled).toHaveValue('large');
  });

  it('keeps native form values and required constraint semantics', async () => {
    const user = userEvent.setup();
    render(
      <form>
        <Select
          defaultValue=""
          label="결제 수단"
          name="payment"
          placeholder="선택하세요"
          required
        >
          <option value="card">카드</option>
          <option value="bank">계좌이체</option>
        </Select>
      </form>,
    );
    const select = screen.getByRole<HTMLSelectElement>('combobox', { name: '결제 수단' });

    expect(select).toBeRequired();
    expect(select.checkValidity()).toBe(false);
    expect(new FormData(select.form!).get('payment')).toBe('');

    await user.selectOptions(select, 'card');
    expect(select.checkValidity()).toBe(true);
    expect(new FormData(select.form!).get('payment')).toBe('card');
  });

  it('uses a supplied ID and large size', () => {
    render(
      <Select id="locale" label="언어" size="large">
        <option value="ko">한국어</option>
      </Select>,
    );
    const select = screen.getByRole('combobox', { name: '언어' });

    expect(select).toHaveAttribute('id', 'locale');
    expect(select).toHaveAttribute('data-size', 'large');
    expect(screen.getByText('언어')).toHaveAttribute('for', 'locale');
  });

  it('orders description, error, then de-duplicated caller IDs', () => {
    render(
      <div>
        <span id="external-help">외부 도움말</span>
        <Select
          aria-describedby="external-help external-help"
          description="배송 가능한 국가만 표시합니다."
          errorMessage="국가를 선택하세요."
          id="country"
          label="국가"
        >
          <option value="kr">대한민국</option>
        </Select>
      </div>,
    );
    const select = screen.getByRole('combobox', { name: '국가' });

    expect(select).toHaveAttribute(
      'aria-describedby',
      'country-description country-error external-help',
    );
    expect(select).toHaveAttribute('aria-errormessage', 'country-error');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('배송 가능한 국가만 표시합니다.'))
      .toHaveAttribute('id', 'country-description');
    expect(screen.getByText('국가를 선택하세요.'))
      .toHaveAttribute('id', 'country-error');
    expect(screen.getByText('국가를 선택하세요.')).toHaveAttribute('role', 'alert');
  });

  it('keeps disabled visual precedence without dropping error semantics', () => {
    render(
      <Select disabled errorMessage="변경할 수 없습니다." label="고정 국가">
        <option value="kr">대한민국</option>
      </Select>,
    );
    const select = screen.getByRole('combobox', { name: '고정 국가' });
    const root = select.closest('.ds-select');

    expect(select).toBeDisabled();
    expect(select).toHaveAttribute('data-state', 'disabled');
    expect(root).toHaveAttribute('data-state', 'disabled');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAttribute('aria-errormessage', expect.stringMatching(/-error$/));
  });

  it('forwards native props, className, and ref to the select', () => {
    const ref = createRef<HTMLSelectElement>();
    render(
      <Select
        autoComplete="country"
        className="consumer-select"
        data-consumer="native"
        label="거주 국가"
        ref={ref}
      >
        <option value="kr">대한민국</option>
      </Select>,
    );
    const select = screen.getByRole('combobox', { name: '거주 국가' });

    expect(select).toHaveClass('ds-select__control', 'consumer-select');
    expect(select).toHaveAttribute('autocomplete', 'country');
    expect(select).toHaveAttribute('data-consumer', 'native');
    expect(ref.current).toBe(select);
  });

  it('renders the owned chevron as pointer-inert decorative content', () => {
    render(
      <Select label="정렬">
        <option value="recent">최신순</option>
      </Select>,
    );
    const select = screen.getByRole('combobox', { name: '정렬' });
    const wrapper = select.parentElement;
    const icon = wrapper?.querySelector('svg');

    expect(wrapper).toHaveClass('ds-select__field');
    expect(wrapper?.children[0]).toBe(select);
    expect(wrapper?.children[1]).toBe(icon);
    expect(icon).toHaveClass('ds-select__icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).not.toHaveAttribute('aria-label');
    expect(icon).not.toHaveAttribute('role');
    expect(icon).toHaveAttribute('data-size', '20');
  });

  it('is keyboard focusable', async () => {
    const user = userEvent.setup();
    render(
      <Select label="상태">
        <option value="ready">준비</option>
      </Select>,
    );

    await user.tab();
    expect(screen.getByRole('combobox', { name: '상태' })).toHaveFocus();
  });

  it('exposes required children, exact custom size, and no multiple prop', () => {
    expectTypeOf<SelectSize>().toEqualTypeOf<'medium' | 'large'>();
    expectTypeOf<NonNullable<SelectProps['size']>>()
      .toEqualTypeOf<SelectSize>();
    expectTypeOf<SelectProps['children']>().toEqualTypeOf<ReactNode>();
    expectTypeOf<IsRequired<SelectProps, 'children'>>().toEqualTypeOf<true>();
    expectTypeOf<SelectProps>().not.toHaveProperty('multiple');
  });

  it('has no axe violations with native groups, description, and error content', async () => {
    const { container } = render(
      <Select
        description="배송 권역을 선택하세요."
        errorMessage="권역을 선택해야 합니다."
        label="배송 권역"
      >
        <optgroup label="국내">
          <option value="seoul">서울</option>
        </optgroup>
      </Select>,
    );

    await expectNoAxeViolations(container);
  });
});
