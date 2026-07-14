import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../test/accessibility';
import {
  Textarea,
  type TextareaProps,
  type TextareaResize,
  type TextareaSize,
} from './Textarea';

describe('Textarea', () => {
  it('associates a visible label with a generated textarea ID and applies defaults', () => {
    render(<Textarea label="요청사항" />);
    const textarea = screen.getByRole('textbox', { name: '요청사항' });
    const label = screen.getByText('요청사항');
    const root = textarea.closest('.hds-textarea');

    expect(textarea.id).toMatch(/^hds-textarea-/);
    expect(label).toHaveAttribute('for', textarea.id);
    expect(textarea).toHaveAttribute('rows', '4');
    expect(textarea).toHaveAttribute('data-size', 'medium');
    expect(textarea).toHaveAttribute('data-resize', 'vertical');
    expect(textarea).toHaveAttribute('data-state', 'default');
    expect(root).toHaveAttribute('data-size', 'medium');
    expect(root).toHaveAttribute('data-state', 'default');
  });

  it('uses supplied ID, rows, size, and resize settings', () => {
    render(
      <Textarea
        id="delivery-note"
        label="배송 메모"
        resize="none"
        rows={7}
        size="large"
      />,
    );
    const textarea = screen.getByRole('textbox', { name: '배송 메모' });

    expect(textarea).toHaveAttribute('id', 'delivery-note');
    expect(screen.getByText('배송 메모')).toHaveAttribute('for', 'delivery-note');
    expect(textarea).toHaveAttribute('rows', '7');
    expect(textarea).toHaveAttribute('data-size', 'large');
    expect(textarea).toHaveAttribute('data-resize', 'none');
  });

  it('orders description, error, then de-duplicated caller IDs', () => {
    render(
      <div>
        <span id="external-help">외부 도움말</span>
        <Textarea
          aria-describedby="external-help external-help"
          description="수령인이 확인할 내용입니다."
          errorMessage="배송 메모를 확인하세요."
          id="note"
          label="배송 메모"
        />
      </div>,
    );
    const textarea = screen.getByRole('textbox', { name: '배송 메모' });

    expect(textarea).toHaveAttribute(
      'aria-describedby',
      'note-description note-error external-help',
    );
    expect(textarea).toHaveAttribute('aria-errormessage', 'note-error');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('수령인이 확인할 내용입니다.'))
      .toHaveAttribute('id', 'note-description');
    expect(screen.getByText('배송 메모를 확인하세요.'))
      .toHaveAttribute('id', 'note-error');
    expect(screen.getByText('배송 메모를 확인하세요.'))
      .toHaveAttribute('role', 'alert');
  });

  it('preserves caller ARIA state until an error message becomes authoritative', () => {
    const { rerender } = render(
      <Textarea
        aria-errormessage="server-error"
        aria-invalid="grammar"
        id="profile"
        label="소개"
      />,
    );
    let textarea = screen.getByRole('textbox', { name: '소개' });

    expect(textarea).toHaveAttribute('aria-invalid', 'grammar');
    expect(textarea).toHaveAttribute('aria-errormessage', 'server-error');

    rerender(
      <Textarea
        aria-errormessage="server-error"
        aria-invalid={false}
        errorMessage="소개를 입력하세요."
        id="profile"
        label="소개"
      />,
    );
    textarea = screen.getByRole('textbox', { name: '소개' });

    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAttribute('aria-errormessage', 'profile-error');
    expect(textarea).toHaveAttribute('data-state', 'error');
  });

  it('supports uncontrolled and controlled values', async () => {
    const user = userEvent.setup();

    function ControlledTextarea() {
      const [value, setValue] = useState('초기');
      return (
        <Textarea
          label="제어 메모"
          onChange={(event) => setValue(event.target.value)}
          value={value}
        />
      );
    }

    render(
      <div>
        <Textarea defaultValue="기본" label="비제어 메모" />
        <ControlledTextarea />
      </div>,
    );
    const uncontrolled = screen.getByRole('textbox', { name: '비제어 메모' });
    const controlled = screen.getByRole('textbox', { name: '제어 메모' });

    expect(uncontrolled).toHaveValue('기본');
    expect(controlled).toHaveValue('초기');
    await user.clear(controlled);
    await user.type(controlled, '변경');
    expect(controlled).toHaveValue('변경');
  });

  it('keeps native maxLength, required, change, and form-value behavior', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <form>
        <Textarea
          label="문의 내용"
          maxLength={5}
          name="inquiry"
          onChange={onChange}
          required
        />
      </form>,
    );
    const textarea = screen.getByRole<HTMLTextAreaElement>('textbox', { name: '문의 내용' });

    expect(textarea).toBeRequired();
    expect(textarea).toHaveAttribute('maxlength', '5');
    expect(textarea.checkValidity()).toBe(false);
    await user.type(textarea, '안녕하세요!');
    expect(textarea).toHaveValue('안녕하세요');
    expect(onChange).toHaveBeenCalled();
    expect(textarea.checkValidity()).toBe(true);
    expect(new FormData(textarea.form!).get('inquiry')).toBe('안녕하세요');
  });

  it('keeps disabled visual precedence without dropping error semantics', () => {
    render(
      <Textarea
        disabled
        errorMessage="수정할 수 없습니다."
        label="고정 메모"
      />,
    );
    const textarea = screen.getByRole('textbox', { name: '고정 메모' });
    const root = textarea.closest('.hds-textarea');

    expect(textarea).toBeDisabled();
    expect(textarea).toHaveAttribute('data-state', 'disabled');
    expect(root).toHaveAttribute('data-state', 'disabled');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAttribute('aria-errormessage', expect.stringMatching(/-error$/));
  });

  it('forwards native props, className, and ref to the textarea', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(
      <Textarea
        autoComplete="street-address"
        className="consumer-textarea"
        data-consumer="native"
        label="상세 주소"
        ref={ref}
        spellCheck={false}
      />,
    );
    const textarea = screen.getByRole('textbox', { name: '상세 주소' });

    expect(textarea).toHaveClass('hds-textarea__control', 'consumer-textarea');
    expect(textarea).toHaveAttribute('autocomplete', 'street-address');
    expect(textarea).toHaveAttribute('data-consumer', 'native');
    expect(textarea).toHaveAttribute('spellcheck', 'false');
    expect(ref.current).toBe(textarea);
  });

  it('is keyboard focusable', async () => {
    const user = userEvent.setup();
    render(<Textarea label="설명" />);

    await user.tab();
    expect(screen.getByRole('textbox', { name: '설명' })).toHaveFocus();
  });

  it('exposes the exact public size, resize, and children contracts', () => {
    expectTypeOf<TextareaSize>().toEqualTypeOf<'medium' | 'large'>();
    expectTypeOf<TextareaResize>().toEqualTypeOf<'vertical' | 'none'>();
    expectTypeOf<NonNullable<TextareaProps['size']>>()
      .toEqualTypeOf<TextareaSize>();
    expectTypeOf<NonNullable<TextareaProps['resize']>>()
      .toEqualTypeOf<TextareaResize>();
    expectTypeOf<TextareaProps>().not.toHaveProperty('children');
  });

  it('has no axe violations with description and error content', async () => {
    const { container } = render(
      <Textarea
        description="처리 목적에만 사용합니다."
        errorMessage="내용을 입력하세요."
        label="문의 내용"
      />,
    );

    await expectNoAxeViolations(container);
  });
});
