import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon, type IconName, type IconSize } from '../icon';
import { getSafeLayoutStyle } from '../internal/safe-layout-style';

export type IconButtonSize = 'small' | 'medium' | 'large';
export type IconButtonVariant = 'clear' | 'fill' | 'outline';

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'children'
> {
  label: string;
  name: IconName;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
}

const ICON_SIZE_BY_BUTTON_SIZE: Record<IconButtonSize, IconSize> = {
  small: 20,
  medium: 24,
  large: 24,
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      className,
      disabled = false,
      label,
      name,
      size = 'medium',
      style,
      type = 'button',
      variant = 'clear',
      ...buttonProps
    },
    ref,
  ) {
    const accessibleLabel = typeof label === 'string' ? label.trim() : '';
    if (accessibleLabel.length === 0) {
      throw new Error('IconButton label must be a non-empty string.');
    }

    const classes = ['ds-icon-button', className].filter(Boolean).join(' ');

    return (
      <button
        {...buttonProps}
        ref={ref}
        aria-label={accessibleLabel}
        className={classes}
        dangerouslySetInnerHTML={undefined}
        data-size={size}
        data-variant={variant}
        disabled={disabled}
        style={getSafeLayoutStyle(style)}
        type={type}
      >
        <Icon name={name} size={ICON_SIZE_BY_BUTTON_SIZE[size]} />
      </button>
    );
  },
);
