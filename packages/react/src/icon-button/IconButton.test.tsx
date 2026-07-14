import { readFileSync } from 'node:fs';
import { createRef, type SyntheticEvent } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { ICON_NAMES, ICON_PATHS, type IconName } from '../icon';
import { expectNoAxeViolations } from '../test/accessibility';
import {
  IconButton,
  type IconButtonProps,
  type IconButtonSize,
  type IconButtonVariant,
} from './IconButton';

const sizes: IconButtonSize[] = ['small', 'medium', 'large'];
const variants: IconButtonVariant[] = ['clear', 'fill', 'outline'];

describe('IconButton', () => {
  it('defaults to a medium clear button with an owned trimmed accessible name', () => {
    render(<IconButton label="  검색  " name="search" />);
    const button = screen.getByRole('button', { name: '검색' });

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('aria-label', '검색');
    expect(button).toHaveAttribute('data-size', 'medium');
    expect(button).toHaveAttribute('data-variant', 'clear');
    expect(button).not.toHaveAttribute('name');
  });

  it('rejects an empty accessible label at runtime', () => {
    expect(() => {
      render(<IconButton label="   " name="close" />);
    }).toThrow('IconButton label must be a non-empty string.');
  });

  it('owns decorative geometry for every supported icon name', () => {
    for (const name of ICON_NAMES) {
      const { container, unmount } = render(
        <IconButton label={`${name} action`} name={name} />,
      );
      const button = screen.getByRole('button', { name: `${name} action` });
      const icon = button.querySelector('.ds-icon');

      expect(container.querySelectorAll('.ds-icon')).toHaveLength(1);
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).not.toHaveAttribute('role');
      expect(
        Array.from(icon?.querySelectorAll('path') ?? [], (path) =>
          path.getAttribute('d'),
        ),
      ).toEqual(ICON_PATHS[name]);
      expect(button).toHaveAccessibleName(`${name} action`);
      unmount();
    }
  });

  it('renders the complete size and variant data contract with owned icon sizes', () => {
    const iconSizeByButtonSize: Record<IconButtonSize, string> = {
      small: '20',
      medium: '24',
      large: '24',
    };

    for (const size of sizes) {
      for (const variant of variants) {
        const label = `${size}-${variant}`;
        const { unmount } = render(
          <IconButton
            label={label}
            name="info"
            size={size}
            variant={variant}
          />,
        );
        const button = screen.getByRole('button', { name: label });
        const icon = button.querySelector('.ds-icon');

        expect(button).toHaveAttribute('data-size', size);
        expect(button).toHaveAttribute('data-variant', variant);
        expect(icon).toHaveAttribute('data-size', iconSizeByButtonSize[size]);
        expect(icon).toHaveAttribute('width', iconSizeByButtonSize[size]);
        expect(icon).toHaveAttribute('height', iconSizeByButtonSize[size]);
        unmount();
      }
    }
  });

  it('forwards native props and safe layout styles without exposing owned presentation', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <IconButton
        className="consumer-icon-button"
        data-testid="icon-button"
        form="search-form"
        label="검색"
        name="search"
        ref={ref}
        style={{
          backgroundColor: 'red',
          color: 'red',
          flexBasis: 1,
          flexGrow: 1,
          flexShrink: 1,
          marginTop: 1,
          minHeight: 1,
        }}
        title="검색 열기"
        type="submit"
        value="find"
      />,
    );
    const button = screen.getByRole('button', { name: '검색' });

    expect(button).toHaveAttribute('form', 'search-form');
    expect(button).toHaveAttribute('title', '검색 열기');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('value', 'find');
    expect(button).toHaveClass('ds-icon-button', 'consumer-icon-button');
    expect(button).toHaveStyle('margin-top: 1px');
    expect(button.style.backgroundColor).toBe('');
    expect(button.style.color).toBe('');
    expect(button.style.flexBasis).toBe('');
    expect(button.style.flexGrow).toBe('');
    expect(button.style.flexShrink).toBe('');
    expect(button.style.minHeight).toBe('');
    expect(ref.current).toBe(button);
  });

  it('uses native disabled and form behavior while defaulting to form-safe type button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onSubmit = vi.fn((event: SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
    });
    render(
      <form onSubmit={onSubmit}>
        <IconButton label="안전한 기본값" name="check" />
        <IconButton
          disabled
          label="사용할 수 없음"
          name="close"
          onClick={onClick}
        />
        <IconButton label="제출" name="chevron-right" type="submit" />
      </form>,
    );

    await user.click(screen.getByRole('button', { name: '안전한 기본값' }));
    expect(onSubmit).not.toHaveBeenCalled();

    const disabled = screen.getByRole('button', { name: '사용할 수 없음' });
    expect(disabled).toBeDisabled();
    await user.click(disabled);
    expect(onClick).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '제출' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('keeps caller aria-label, children, and icon name out of the native surface', () => {
    type ForbiddenProps = Extract<'aria-label' | 'children', keyof IconButtonProps>;
    expectTypeOf<ForbiddenProps>().toEqualTypeOf<never>();
    expectTypeOf<IconButtonProps['name']>().toEqualTypeOf<IconName>();

    const conflictingProps = {
      'aria-label': 'caller label',
      children: 'caller child',
      label: '  library label  ',
      name: 'search',
    } as unknown as IconButtonProps;
    render(<IconButton {...conflictingProps} data-testid="owned-button" />);
    const button = screen.getByTestId('owned-button');

    expect(button).toHaveAttribute('aria-label', 'library label');
    expect(button).not.toHaveAttribute('name');
    expect(button).not.toHaveTextContent('caller child');
    expect(button.querySelectorAll('.ds-icon')).toHaveLength(1);
  });

  it('discards caller-owned markup at runtime', () => {
    const conflictingProps = {
      dangerouslySetInnerHTML: {
        __html: '<span data-testid="injected">caller markup</span>',
      },
      label: '정보',
      name: 'info',
    } as IconButtonProps;

    expect(() => {
      render(<IconButton {...conflictingProps} data-testid="owned-markup" />);
    }).not.toThrow();
    expect(screen.queryByTestId('injected')).not.toBeInTheDocument();
    expect(
      screen.getByTestId('owned-markup').querySelectorAll('.ds-icon'),
    ).toHaveLength(1);
  });

  it('uses token-backed geometry and platform interaction states', () => {
    const componentCss = readFileSync(
      'src/icon-button/IconButton.css',
      'utf8',
    );
    const reactStyles = readFileSync('src/styles.css', 'utf8');

    expect(reactStyles).toContain("@import './icon-button/IconButton.css';");
    expect(componentCss).toMatch(
      /\[data-size='small'\][^}]*inline-size:\s*var\(--ds-size-control-small\);[^}]*block-size:\s*var\(--ds-size-control-small\);/s,
    );
    expect(componentCss).toMatch(
      /\[data-size='medium'\][^}]*inline-size:\s*var\(--ds-size-control-medium\);[^}]*block-size:\s*var\(--ds-size-control-medium\);/s,
    );
    expect(componentCss).toMatch(
      /\[data-size='large'\][^}]*inline-size:\s*var\(--ds-size-control-large\);[^}]*block-size:\s*var\(--ds-size-control-large\);/s,
    );
    expect(componentCss).toContain("[data-variant='clear']");
    expect(componentCss).toContain("[data-variant='fill']");
    expect(componentCss).toContain("[data-variant='outline']");
    expect(componentCss).toContain('var(--ds-motion-duration-fast)');
    expect(componentCss).toContain('var(--ds-motion-easing-standard)');
    expect(componentCss).toContain('@media (forced-colors: active)');
    expect(componentCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(componentCss).not.toMatch(/#[\da-f]{3,8}\b|rgba?\(|hsla?\(/i);

    const forcedColorsStart = componentCss.indexOf(
      '@media (forced-colors: active)',
    );
    for (const variant of variants) {
      for (const state of ['', ':not(:disabled):hover', ':not(:disabled):active']) {
        const selector =
          `.ds-icon-button[data-variant='${variant}']${state}`;
        expect(componentCss.lastIndexOf(selector)).toBeGreaterThan(
          forcedColorsStart,
        );
      }
    }
    expect(
      componentCss.lastIndexOf('.ds-icon-button[data-variant]:disabled'),
    ).toBeGreaterThan(forcedColorsStart);

    const hoverSelector =
      ".ds-icon-button[data-variant='fill']:not(:disabled):hover";
    const activeSelector =
      ".ds-icon-button[data-variant='fill']:not(:disabled):active";
    const disabledSelector = '.ds-icon-button:disabled';
    expect(componentCss.indexOf(hoverSelector)).toBeLessThan(
      componentCss.indexOf(activeSelector),
    );
    expect(componentCss.indexOf(activeSelector)).toBeLessThan(
      componentCss.indexOf(disabledSelector),
    );
  });

  it('has no axe violations across variants and disabled state', async () => {
    const { container } = render(
      <div>
        <IconButton label="검색" name="search" />
        <IconButton label="정보" name="info" variant="fill" />
        <IconButton label="닫기" name="close" variant="outline" />
        <IconButton disabled label="완료" name="check" />
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
