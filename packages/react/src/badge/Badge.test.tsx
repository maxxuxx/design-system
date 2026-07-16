import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../test/accessibility';
import { Badge, type BadgeSize, type BadgeTone, type BadgeVariant } from './Badge';

const sizes: BadgeSize[] = ['small', 'medium'];
const variants: BadgeVariant[] = ['soft', 'solid'];
const tones: BadgeTone[] = ['neutral', 'primary', 'success', 'danger'];

describe('Badge', () => {
  it('uses the medium soft neutral defaults on a span', () => {
    render(<Badge data-testid="badge">신규</Badge>);
    const badge = screen.getByTestId('badge');

    expect(badge.tagName).toBe('SPAN');
    expect(badge).toHaveClass('hds-badge');
    expect(badge).toHaveAttribute('data-size', 'medium');
    expect(badge).toHaveAttribute('data-variant', 'soft');
    expect(badge).toHaveAttribute('data-tone', 'neutral');
    expect(badge).not.toHaveAttribute('role');
    expect(badge).not.toHaveAttribute('tabindex');
  });

  it('renders all 16 size, variant, and tone combinations', () => {
    for (const size of sizes) {
      for (const variant of variants) {
        for (const tone of tones) {
          const { getByText, unmount } = render(
            <Badge data-testid="badge" size={size} tone={tone} variant={variant}>
              {`${size}-${variant}-${tone}`}
            </Badge>,
          );
          const label = getByText(`${size}-${variant}-${tone}`);
          const badge = label.closest('.hds-badge');
          expect(badge).not.toBeNull();
          expect(badge).toHaveAttribute('data-size', size);
          expect(badge).toHaveAttribute('data-variant', variant);
          expect(badge).toHaveAttribute('data-tone', tone);
          unmount();
        }
      }
    }
  });

  it('keeps component data authoritative and forwards native span props', () => {
    render(
      <Badge
        aria-label="주문 상태: 완료"
        className="consumer-badge"
        data-size="consumer"
        data-testid="badge"
        size="small"
      >
        완료
      </Badge>,
    );
    const badge = screen.getByTestId('badge');

    expect(badge).toHaveClass('hds-badge', 'consumer-badge');
    expect(badge).toHaveAttribute('data-size', 'small');
    expect(badge).toHaveAttribute('aria-label', '주문 상태: 완료');
  });

  it('forwards its span ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Badge ref={ref}>상태</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('owns a label wrapper for clipping long content', () => {
    render(<Badge data-testid="badge">매우 긴 현지화 상태 레이블</Badge>);
    const badge = screen.getByTestId('badge');

    expect(badge.querySelector('.hds-badge__label')).toHaveTextContent(
      '매우 긴 현지화 상태 레이블',
    );
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Badge tone="neutral">대기</Badge>
        <Badge tone="success" variant="solid">완료</Badge>
        <Badge tone="danger">실패</Badge>
      </div>,
    );
    await expectNoAxeViolations(container);
  });
});
