import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ForwardedRef,
  type HTMLAttributes,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
  type RefAttributes,
} from 'react';
import { Icon } from '../icon';
import { getSafeLayoutStyle } from '../internal/safe-layout-style';

type ListRowBaseProps = {
  title: string;
  description?: string;
  left?: ReactNode;
  right?: ReactNode;
  divider?: 'none' | 'indented';
  withArrow?: boolean;
};

type ListRowStaticProps = ListRowBaseProps & {
  href?: never;
  onClick?: never;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onClick'>;

type ListRowButtonProps = ListRowBaseProps & {
  href?: never;
  onClick: MouseEventHandler<HTMLButtonElement>;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick'>;

type ListRowAnchorProps = ListRowBaseProps & {
  href: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'href'>;

export type ListRowProps =
  | ListRowStaticProps
  | ListRowButtonProps
  | ListRowAnchorProps;

type ListRowComponent = {
  (
    props: ListRowStaticProps & RefAttributes<HTMLDivElement>,
  ): ReactElement | null;
  (
    props: ListRowButtonProps & RefAttributes<HTMLButtonElement>,
  ): ReactElement | null;
  (
    props: ListRowAnchorProps & RefAttributes<HTMLAnchorElement>,
  ): ReactElement | null;
};

type ListRowBranch = 'static' | 'button' | 'anchor';

type RuntimeProps = ListRowBaseProps & Record<string, unknown> & {
  className?: string;
  dangerouslySetInnerHTML?: unknown;
  href?: unknown;
  onClick?: unknown;
  style?: HTMLAttributes<HTMLElement>['style'];
};

const INTERACTIVE_DESCENDANT_SELECTOR =
  'a, button, input, select, textarea, summary, [tabindex]';
const NATIVE_INTERACTIVE_SELECTOR =
  'a, button, input, select, textarea, summary';

function findInvalidInteractiveDescendant(
  root: HTMLElement,
): HTMLElement | undefined {
  return Array.from(
    root.querySelectorAll<HTMLElement>(INTERACTIVE_DESCENDANT_SELECTOR),
  ).find((element) => {
    if (element.matches(NATIVE_INTERACTIVE_SELECTOR)) return true;
    const tabIndex = Number(element.getAttribute('tabindex'));
    return Number.isFinite(tabIndex) && tabIndex > 0;
  });
}

function ListRowContent({
  description,
  left,
  right,
  title,
  withArrow,
}: Pick<
  ListRowBaseProps,
  'description' | 'left' | 'right' | 'title' | 'withArrow'
>): ReactElement {
  return (
    <>
      {left !== undefined && left !== null ? (
        <span aria-hidden="true" className="ds-list-row__left">
          {left}
        </span>
      ) : null}
      <span className="ds-list-row__copy">
        <span className="ds-list-row__title">{title}</span>
        {description !== undefined ? (
          <span className="ds-list-row__description">{description}</span>
        ) : null}
      </span>
      {right !== undefined && right !== null ? (
        <span className="ds-list-row__right">{right}</span>
      ) : null}
      {withArrow ? (
        <span aria-hidden="true" className="ds-list-row__arrow">
          <Icon name="chevron-right" size={20} />
        </span>
      ) : null}
    </>
  );
}

const ListRowImpl = forwardRef<
  HTMLDivElement | HTMLButtonElement | HTMLAnchorElement,
  ListRowProps
>(function ListRow(props, forwardedRef) {
  const {
    className,
    description,
    divider = 'none',
    left,
    right,
    style,
    title,
    withArrow = false,
    ...nativeProps
  } = props as RuntimeProps;
  const branch: ListRowBranch = typeof nativeProps.href === 'string'
    ? 'anchor'
    : typeof nativeProps.onClick === 'function'
      ? 'button'
      : 'static';
  const rootRef = useRef<HTMLDivElement | HTMLButtonElement | HTMLAnchorElement>(
    null,
  );
  const setRootRef = useCallback(
    (node: HTMLDivElement | HTMLButtonElement | HTMLAnchorElement | null) => {
      rootRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef],
  );

  useLayoutEffect(() => {
    if (branch === 'static' || process.env.NODE_ENV === 'production') return;
    const root = rootRef.current;
    if (!root) return;
    const invalidDescendant = findInvalidInteractiveDescendant(root);
    if (invalidDescendant) {
      throw new Error(
        'ListRow whole-row link and button branches must not contain nested interactive descendants.',
      );
    }
  });

  const classes = ['ds-list-row', className].filter(Boolean).join(' ');
  const content = (
    <ListRowContent
      description={description}
      left={left}
      right={right}
      title={title}
      withArrow={withArrow}
    />
  );
  const safeStyle = getSafeLayoutStyle(style);

  if (branch === 'anchor') {
    const {
      children: _children,
      dangerouslySetInnerHTML: _dangerousHtml,
      disabled: _disabled,
      form: _form,
      formAction: _formAction,
      formEncType: _formEncType,
      formMethod: _formMethod,
      formNoValidate: _formNoValidate,
      formTarget: _formTarget,
      href,
      name: _name,
      onClick,
      value: _value,
      'data-divider': _dataDivider,
      'data-with-arrow': _dataWithArrow,
      ...anchorProps
    } = nativeProps;
    const safeOnClick = typeof onClick === 'function' ? onClick : undefined;

    return (
      <a
        {...anchorProps as AnchorHTMLAttributes<HTMLAnchorElement>}
        ref={setRootRef as ForwardedRef<HTMLAnchorElement>}
        className={classes}
        dangerouslySetInnerHTML={undefined}
        data-divider={divider}
        data-with-arrow={String(withArrow)}
        href={href as string}
        onClick={safeOnClick as MouseEventHandler<HTMLAnchorElement> | undefined}
        style={safeStyle}
      >
        {content}
      </a>
    );
  }

  if (branch === 'button') {
    const {
      children: _children,
      dangerouslySetInnerHTML: _dangerousHtml,
      download: _download,
      href: _href,
      hrefLang: _hrefLang,
      media: _media,
      onClick,
      ping: _ping,
      referrerPolicy: _referrerPolicy,
      rel: _rel,
      target: _target,
      type = 'button',
      'data-divider': _dataDivider,
      'data-with-arrow': _dataWithArrow,
      ...buttonProps
    } = nativeProps;

    return (
      <button
        {...buttonProps as ButtonHTMLAttributes<HTMLButtonElement>}
        ref={setRootRef as ForwardedRef<HTMLButtonElement>}
        className={classes}
        dangerouslySetInnerHTML={undefined}
        data-divider={divider}
        data-with-arrow={String(withArrow)}
        onClick={onClick as MouseEventHandler<HTMLButtonElement>}
        style={safeStyle}
        type={typeof type === 'string' ? type as 'button' | 'reset' | 'submit' : 'button'}
      >
        {content}
      </button>
    );
  }

  const {
    children: _children,
    dangerouslySetInnerHTML: _dangerousHtml,
    disabled: _disabled,
    download: _download,
    form: _form,
    formAction: _formAction,
    formEncType: _formEncType,
    formMethod: _formMethod,
    formNoValidate: _formNoValidate,
    formTarget: _formTarget,
    href: _href,
    hrefLang: _hrefLang,
    media: _media,
    name: _name,
    onClick: _onClick,
    ping: _ping,
    referrerPolicy: _referrerPolicy,
    rel: _rel,
    target: _target,
    type: _type,
    value: _value,
    'data-divider': _dataDivider,
    'data-with-arrow': _dataWithArrow,
    ...divProps
  } = nativeProps;

  return (
    <div
      {...divProps as HTMLAttributes<HTMLDivElement>}
      ref={setRootRef as ForwardedRef<HTMLDivElement>}
      className={classes}
      dangerouslySetInnerHTML={undefined}
      data-divider={divider}
      data-with-arrow={String(withArrow)}
      style={safeStyle}
    >
      {content}
    </div>
  );
});

export const ListRow = ListRowImpl as ListRowComponent;
