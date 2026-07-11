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
