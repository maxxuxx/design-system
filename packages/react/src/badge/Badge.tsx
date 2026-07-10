import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

export type BadgeSize = 'small' | 'medium';
export type BadgeVariant = 'soft' | 'solid';
export type BadgeTone = 'neutral' | 'primary' | 'success' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  size?: BadgeSize;
  variant?: BadgeVariant;
  tone?: BadgeTone;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { children, className, size = 'medium', tone = 'neutral', variant = 'soft', ...spanProps },
  ref,
) {
  const classes = ['ds-badge', className].filter(Boolean).join(' ');

  return (
    <span
      {...spanProps}
      ref={ref}
      className={classes}
      data-size={size}
      data-tone={tone}
      data-variant={variant}
    >
      {children}
    </span>
  );
});
