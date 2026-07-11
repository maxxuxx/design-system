import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { expectNoAxeViolations } from '../test/accessibility';
import { Icon, type IconProps } from './Icon';
import { ICON_NAMES, ICON_PATHS, ICON_SVGS } from './paths';

describe('Icon', () => {
  it('renders decorative defaults', () => {
    render(<Icon data-testid="icon" name="check" />);
    const icon = screen.getByTestId('icon');

    expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
    expect(icon).toHaveAttribute('width', '24');
    expect(icon).toHaveAttribute('height', '24');
    expect(icon).toHaveAttribute('fill', 'none');
    expect(icon).toHaveAttribute('stroke', 'currentColor');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('focusable', 'false');
    expect(icon).not.toHaveAttribute('role');
  });

  it('owns its paths', () => {
    for (const name of ICON_NAMES) {
      const { container, unmount } = render(<Icon name={name} />);
      expect(container.querySelectorAll('path')).toHaveLength(ICON_PATHS[name].length);
      expect(ICON_SVGS[name]).toContain('<svg');
      unmount();
    }
  });

  it('makes size authoritative and forwards supported SVG props', () => {
    render(
      <Icon
        data-testid="icon"
        height={99}
        name="search"
        size={16}
        strokeWidth={1.5}
        width={99}
      />,
    );
    const icon = screen.getByTestId('icon');

    expect(icon).toHaveAttribute('width', '16');
    expect(icon).toHaveAttribute('height', '16');
    expect(icon).toHaveAttribute('stroke-width', '1.5');
  });

  it('labels a meaningful icon', () => {
    render(<Icon data-testid="icon" label="  Search  " name="search" />);
    const icon = screen.getByTestId('icon');

    expect(icon).toHaveAttribute('role', 'img');
    expect(icon).toHaveAttribute('aria-label', 'Search');
  });

  it('keeps a whitespace-only label decorative', () => {
    render(<Icon data-testid="icon" label="   " name="info" />);
    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
  });

  it('omits caller focus and alternate naming props from its public API', () => {
    type ForbiddenIconProps = Extract<
      | 'aria-labelledby'
      | 'dangerouslySetInnerHTML'
      | 'focusable'
      | 'style'
      | 'tabIndex',
      keyof IconProps
    >;

    expectTypeOf<ForbiddenIconProps>().toEqualTypeOf<never>();
  });

  it('discards caller focus and alternate naming props at runtime', () => {
    const conflictingProps = {
      'aria-labelledby': 'external-label',
      focusable: 'true',
      tabIndex: 0,
    } as unknown as IconProps;

    render(<Icon {...conflictingProps} data-testid="icon" label="Search" name="search" />);
    const icon = screen.getByTestId('icon');

    expect(icon).not.toHaveAttribute('aria-labelledby');
    expect(icon).not.toHaveAttribute('tabindex');
    expect(icon).toHaveAttribute('focusable', 'false');
    expect(icon).toHaveAccessibleName('Search');
  });

  it('discards caller-owned markup and inline presentation at runtime', () => {
    const conflictingProps = {
      dangerouslySetInnerHTML: {
        __html: '<circle data-testid="injected" cx="12" cy="12" r="12" />',
      },
      style: {
        fill: 'red',
        height: 999,
        stroke: 'blue',
        width: 999,
      },
    } as unknown as IconProps;

    expect(() => {
      render(<Icon {...conflictingProps} data-testid="icon" name="search" />);
    }).not.toThrow();

    const icon = screen.getByTestId('icon');
    expect(icon).not.toHaveAttribute('style');
    expect(screen.queryByTestId('injected')).not.toBeInTheDocument();
    expect(icon).toHaveAttribute('fill', 'none');
    expect(icon).toHaveAttribute('stroke', 'currentColor');
    expect(icon).toHaveAttribute('width', '24');
    expect(icon).toHaveAttribute('height', '24');
  });

  it('forwards its ref', () => {
    const ref = createRef<SVGSVGElement>();
    render(<Icon ref={ref} name="close" />);
    expect(ref.current).toBeInstanceOf(SVGSVGElement);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Icon name="check" />
        <Icon label="Info" name="info" />
      </div>,
    );
    await expectNoAxeViolations(container);
  });
});
