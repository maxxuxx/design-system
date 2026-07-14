import { createRef, type ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { Icon, type IconProps } from '../icon';
import { expectNoAxeViolations } from '../test/accessibility';
import {
  Button,
  type ButtonProps,
  type ButtonSize,
  type ButtonVariant,
  type ButtonWidth,
} from './Button';

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
    expect(loading.querySelector('.hds-button__spinner')).toHaveAttribute('aria-hidden', 'true');
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

  it('types icon slots as owned Icon elements', () => {
    type OwnedIconElement = ReactElement<IconProps, typeof Icon>;

    expectTypeOf<ButtonProps['leadingIcon']>().toEqualTypeOf<OwnedIconElement | undefined>();
    expectTypeOf<ButtonProps['trailingIcon']>().toEqualTypeOf<OwnedIconElement | undefined>();
  });

  it('forces owned icons to stay decorative', () => {
    render(
      <Button leadingIcon={<Icon data-testid="leading" label="검색" name="search" />}>
        찾기
      </Button>,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAccessibleName('찾기');
    expect(screen.getByTestId('leading')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('leading')).not.toHaveAttribute('aria-label');
    expect(screen.getByTestId('leading')).not.toHaveAttribute('role');
  });

  it('omits invalid icon slot elements at runtime', () => {
    const invalidIcon = (
      <span data-testid="invalid-icon">not an Icon</span>
    ) as unknown as ReactElement<IconProps, typeof Icon>;

    render(<Button leadingIcon={invalidIcon}>계속</Button>);

    expect(screen.getByRole('button', { name: '계속' })).toBeInTheDocument();
    expect(screen.queryByTestId('invalid-icon')).not.toBeInTheDocument();
  });

  it('forwards native props, an explicit type, and its ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button className="consumer-button" data-testid="button" ref={ref} type="submit">
        전송
      </Button>,
    );
    const button = screen.getByTestId('button');

    expect(button).toHaveClass('hds-button', 'consumer-button');
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
