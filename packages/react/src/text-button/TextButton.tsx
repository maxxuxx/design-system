import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ForwardedRef,
  type ReactElement,
  type RefAttributes,
} from 'react';
import { Icon } from '../icon';
import { getSafeLayoutStyle } from '../internal/safe-layout-style';

export type TextButtonSize = 'small' | 'medium' | 'large';
export type TextButtonVariant = 'clear' | 'underline' | 'arrow';
export type TextButtonTone = 'primary' | 'neutral';

type TextButtonBaseProps = {
  children: string;
  size?: TextButtonSize;
  variant?: TextButtonVariant;
  tone?: TextButtonTone;
};

type TextButtonAnchorProps = TextButtonBaseProps &
  { href: string } &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'href'>;

type TextButtonNativeButtonProps = TextButtonBaseProps &
  { href?: undefined } &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

export type TextButtonProps =
  | TextButtonAnchorProps
  | TextButtonNativeButtonProps;

type TextButtonComponent = {
  (
    props: TextButtonAnchorProps & RefAttributes<HTMLAnchorElement>,
  ): ReactElement | null;
  (
    props: TextButtonNativeButtonProps & RefAttributes<HTMLButtonElement>,
  ): ReactElement | null;
};

function TextButtonContent({
  children,
  variant,
}: Pick<TextButtonBaseProps, 'children'> & {
  variant: TextButtonVariant;
}): ReactElement {
  return (
    <>
      <span className="ds-text-button__label">{children}</span>
      {variant === 'arrow' ? (
        <span aria-hidden="true" className="ds-text-button__icon">
          <Icon name="chevron-right" size={16} />
        </span>
      ) : null}
    </>
  );
}

const TextButtonImpl = forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  TextButtonProps
>(function TextButton(
  {
    children,
    className,
    size = 'medium',
    tone = 'primary',
    variant = 'clear',
    ...nativeProps
  },
  ref,
) {
  const classes = ['ds-text-button', className].filter(Boolean).join(' ');
  const content = (
    <TextButtonContent variant={variant}>{children}</TextButtonContent>
  );

  if (typeof nativeProps.href === 'string') {
    const {
      disabled: _disabled,
      href,
      style,
      ...anchorProps
    } = nativeProps as Omit<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      'children' | 'href'
    > & {
      disabled?: unknown;
      href: string;
    };

    return (
      <a
        {...anchorProps}
        ref={ref as ForwardedRef<HTMLAnchorElement>}
        className={classes}
        dangerouslySetInnerHTML={undefined}
        data-size={size}
        data-tone={tone}
        data-variant={variant}
        href={href}
        style={getSafeLayoutStyle(style)}
      >
        {content}
      </a>
    );
  }

  const {
    href: _href,
    style,
    type = 'button',
    ...buttonProps
  } = nativeProps as Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'children'
  > & {
    href?: unknown;
  };

  return (
    <button
      {...buttonProps}
      ref={ref as ForwardedRef<HTMLButtonElement>}
      className={classes}
      dangerouslySetInnerHTML={undefined}
      data-size={size}
      data-tone={tone}
      data-variant={variant}
      style={getSafeLayoutStyle(style)}
      type={type}
    >
      {content}
    </button>
  );
});

export const TextButton = TextButtonImpl as TextButtonComponent;
