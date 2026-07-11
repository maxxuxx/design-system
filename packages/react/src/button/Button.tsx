import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { IconProps } from '../icon';

export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonVariant = 'fill' | 'weak' | 'outline';
export type ButtonWidth = 'hug' | 'full';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
  width?: ButtonWidth;
  loading?: boolean;
  leadingIcon?: ReactElement<IconProps>;
  trailingIcon?: ReactElement<IconProps>;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    'aria-busy': ariaBusy,
    children,
    className,
    disabled = false,
    leadingIcon,
    loading = false,
    size = 'medium',
    trailingIcon,
    type = 'button',
    variant = 'fill',
    width = 'hug',
    ...buttonProps
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const classes = ['ds-button', className].filter(Boolean).join(' ');

  return (
    <button
      {...buttonProps}
      ref={ref}
      aria-busy={loading ? true : ariaBusy}
      className={classes}
      data-loading={loading}
      data-size={size}
      data-variant={variant}
      data-width={width}
      disabled={isDisabled}
      type={type}
    >
      <span className="ds-button__content">
        {leadingIcon ? <span className="ds-button__icon">{leadingIcon}</span> : null}
        <span className="ds-button__label">{children}</span>
        {trailingIcon ? <span className="ds-button__icon">{trailingIcon}</span> : null}
      </span>
      {loading ? <span aria-hidden="true" className="ds-button__spinner" /> : null}
    </button>
  );
});
