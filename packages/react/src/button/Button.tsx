import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Icon, type IconProps } from '../icon';

export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonVariant = 'fill' | 'weak' | 'outline';
export type ButtonWidth = 'hug' | 'full';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
  width?: ButtonWidth;
  loading?: boolean;
  leadingIcon?: ReactElement<IconProps, typeof Icon>;
  trailingIcon?: ReactElement<IconProps, typeof Icon>;
}

function getOwnedIcon(
  icon: ReactElement<IconProps, typeof Icon> | undefined,
): ReactElement<IconProps, typeof Icon> | null {
  if (!isValidElement<IconProps>(icon) || icon.type !== Icon) {
    return null;
  }

  return cloneElement(icon, { label: undefined }) as ReactElement<
    IconProps,
    typeof Icon
  >;
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
  const classes = ['hds-button', className].filter(Boolean).join(' ');
  const ownedLeadingIcon = getOwnedIcon(leadingIcon);
  const ownedTrailingIcon = getOwnedIcon(trailingIcon);

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
      <span className="hds-button__content">
        {ownedLeadingIcon ? (
          <span className="hds-button__icon">{ownedLeadingIcon}</span>
        ) : null}
        <span className="hds-button__label">{children}</span>
        {ownedTrailingIcon ? (
          <span className="hds-button__icon">{ownedTrailingIcon}</span>
        ) : null}
      </span>
      {loading ? <span aria-hidden="true" className="hds-button__spinner" /> : null}
    </button>
  );
});
