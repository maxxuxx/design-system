import { readFileSync } from 'node:fs';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { ICON_PATHS } from '../icon';
import { expectNoAxeViolations } from '../test/accessibility';
import {
  TextButton,
  type TextButtonProps,
  type TextButtonSize,
  type TextButtonTone,
  type TextButtonVariant,
} from './TextButton';

const sizes: TextButtonSize[] = ['small', 'medium', 'large'];
const variants: TextButtonVariant[] = ['clear', 'underline', 'arrow'];
const tones: TextButtonTone[] = ['primary', 'neutral'];

describe('TextButton', () => {
  it('defaults to a medium clear primary button with type button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<TextButton onClick={onClick}>저장</TextButton>);
    const button = screen.getByRole('button', { name: '저장' });

    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('data-size', 'medium');
    expect(button).toHaveAttribute('data-variant', 'clear');
    expect(button).toHaveAttribute('data-tone', 'primary');
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a native anchor when href is a string and forwards anchor props and ref', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <TextButton
        className="consumer-link"
        data-testid="text-link"
        href="/getting-started/"
        ref={ref}
        rel="noreferrer"
        target="_blank"
      >
        시작하기
      </TextButton>,
    );
    const link = screen.getByRole('link', { name: '시작하기' });

    expect(link).toBeInstanceOf(HTMLAnchorElement);
    expect(link).toHaveAttribute('href', '/getting-started/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
    expect(link).toHaveClass('ds-text-button', 'consumer-link');
    expect(ref.current).toBe(link);
  });

  it('renders a native button without href and forwards button props and ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <TextButton
        className="consumer-button"
        data-testid="text-button"
        form="checkout"
        name="intent"
        ref={ref}
        type="submit"
        value="continue"
      >
        계속
      </TextButton>,
    );
    const button = screen.getByRole('button', { name: '계속' });

    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button).toHaveAttribute('form', 'checkout');
    expect(button).toHaveAttribute('name', 'intent');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('value', 'continue');
    expect(button).toHaveClass('ds-text-button', 'consumer-button');
    expect(ref.current).toBe(button);
  });

  it('forwards native style props on both element branches', () => {
    render(
      <div>
        <TextButton
          data-testid="styled-button"
          style={{ color: 'red', minHeight: 1 }}
        >
          버튼
        </TextButton>
        <TextButton
          data-testid="styled-link"
          href="/details/"
          style={{ color: 'red', minHeight: 1 }}
        >
          링크
        </TextButton>
      </div>,
    );

    expect(screen.getByTestId('styled-button')).toHaveStyle(
      'color: rgb(255, 0, 0); min-height: 1px',
    );
    expect(screen.getByTestId('styled-link')).toHaveStyle(
      'color: rgb(255, 0, 0); min-height: 1px',
    );
  });

  it('uses native disabled button behavior', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<TextButton disabled onClick={onClick}>사용할 수 없음</TextButton>);
    const button = screen.getByRole('button', { name: '사용할 수 없음' });

    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not expose or render a fake disabled anchor', () => {
    type AnchorProps = Extract<TextButtonProps, { href: string }>;
    type AnchorDisabledProp = Extract<'disabled', keyof AnchorProps>;

    expectTypeOf<AnchorDisabledProp>().toEqualTypeOf<never>();

    const invalidAnchorProps = {
      disabled: true,
      href: '/still-active/',
    } as unknown as AnchorProps;
    render(<TextButton {...invalidAnchorProps}>계속 이동</TextButton>);
    const link = screen.getByRole('link', { name: '계속 이동' });

    expect(link).not.toHaveAttribute('disabled');
    expect(link).not.toHaveAttribute('aria-disabled');
    expect(link).toHaveAttribute('href', '/still-active/');
  });

  it('renders every size, variant, and tone data contract', () => {
    for (const size of sizes) {
      for (const variant of variants) {
        for (const tone of tones) {
          const label = `${size}-${variant}-${tone}`;
          const { getByRole, unmount } = render(
            <TextButton size={size} tone={tone} variant={variant}>
              {label}
            </TextButton>,
          );
          const button = getByRole('button', { name: label });

          expect(button).toHaveAttribute('data-size', size);
          expect(button).toHaveAttribute('data-variant', variant);
          expect(button).toHaveAttribute('data-tone', tone);
          unmount();
        }
      }
    }
  });

  it('owns a decorative ChevronRight only for the arrow variant', () => {
    const { container } = render(
      <div>
        <TextButton>투명</TextButton>
        <TextButton variant="underline">밑줄</TextButton>
        <TextButton variant="arrow">자세히 보기</TextButton>
      </div>,
    );
    const arrow = screen.getByRole('button', { name: '자세히 보기' });
    const icon = arrow.querySelector('.ds-text-button__icon .ds-icon');

    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(container.querySelectorAll('.ds-text-button__icon')).toHaveLength(1);
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon?.querySelectorAll('path')).toHaveLength(
      ICON_PATHS['chevron-right'].length,
    );
    expect(
      Array.from(icon?.querySelectorAll('path') ?? [], (path) =>
        path.getAttribute('d'),
      ),
    ).toEqual(ICON_PATHS['chevron-right']);
    expect(arrow).toHaveAccessibleName('자세히 보기');
  });

  it('preserves a long localized label as its accessible name', () => {
    const label =
      '환불정책과개인정보처리방침을확인하고다음단계로계속진행하기';
    render(<TextButton variant="arrow">{label}</TextButton>);

    expect(screen.getByRole('button', { name: label })).toHaveTextContent(label);
  });

  it('types children as localized text', () => {
    expectTypeOf<TextButtonProps['children']>().toEqualTypeOf<string>();
  });

  it('uses token-backed typography, interaction, wrapping, and platform states', () => {
    const componentCss = readFileSync(
      'src/text-button/TextButton.css',
      'utf8',
    );
    const reactStyles = readFileSync('src/styles.css', 'utf8');

    expect(reactStyles).toContain("@import './text-button/TextButton.css';");
    expect(componentCss).toContain(
      'min-block-size: var(--ds-size-control-small);',
    );
    expect(componentCss).toContain(
      'min-inline-size: var(--ds-size-control-small);',
    );
    expect(componentCss).toMatch(
      /\[data-size='small'\][^}]*font-size:\s*var\(--ds-font-size-caption\);/s,
    );
    expect(componentCss).toMatch(
      /\[data-size='medium'\][^}]*font-size:\s*var\(--ds-font-size-body-sm\);/s,
    );
    expect(componentCss).toMatch(
      /\[data-size='large'\][^}]*font-size:\s*var\(--ds-font-size-body\);/s,
    );
    expect(componentCss).toMatch(
      /\[data-variant='underline'\][^}]*text-decoration-line:\s*underline;/s,
    );
    expect(componentCss).toContain('overflow-wrap: anywhere;');
    expect(componentCss).toContain('var(--ds-motion-duration-fast)');
    expect(componentCss).toContain('var(--ds-motion-easing-standard)');
    expect(componentCss).toContain('@media (forced-colors: active)');
    expect(componentCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(componentCss).not.toMatch(/#[\da-f]{3,8}\b|rgba?\(|hsla?\(/i);

    const visitedSelector =
      ".ds-text-button[data-tone='primary']:where(a:visited)";
    const hoverSelector =
      ".ds-text-button[data-tone='primary']:where(a, button:not(:disabled)):hover";
    const activeSelector =
      ".ds-text-button[data-tone='primary']:where(a, button:not(:disabled)):active";
    expect(componentCss).toContain(visitedSelector);
    expect(componentCss.indexOf(visitedSelector)).toBeLessThan(
      componentCss.indexOf(hoverSelector),
    );
    expect(componentCss.indexOf(hoverSelector)).toBeLessThan(
      componentCss.indexOf(activeSelector),
    );
  });

  it('has no axe violations for button and anchor branches', async () => {
    const { container } = render(
      <div>
        <TextButton>기본 동작</TextButton>
        <TextButton disabled>비활성 동작</TextButton>
        <TextButton href="/details/" variant="underline">
          상세 정보
        </TextButton>
        <TextButton href="/next/" tone="neutral" variant="arrow">
          다음 단계
        </TextButton>
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
