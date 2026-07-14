import { forwardRef, type SVGProps } from 'react';
import { ICON_PATHS, type IconName } from './paths';

export type IconSize = 16 | 20 | 24;

export interface IconProps extends Omit<
  SVGProps<SVGSVGElement>,
  | 'aria-hidden'
  | 'aria-label'
  | 'aria-labelledby'
  | 'children'
  | 'dangerouslySetInnerHTML'
  | 'fill'
  | 'focusable'
  | 'height'
  | 'role'
  | 'style'
  | 'stroke'
  | 'strokeLinecap'
  | 'strokeLinejoin'
  | 'tabIndex'
  | 'viewBox'
  | 'width'
> {
  name: IconName;
  size?: IconSize;
  label?: string;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  {
    className,
    label,
    name,
    size = 24,
    strokeWidth = 2,
    ...svgProps
  },
  ref,
) {
  const accessibleLabel = typeof label === 'string' ? label.trim() : '';
  const isLabelled = accessibleLabel.length > 0;

  return (
    <svg
      {...svgProps}
      dangerouslySetInnerHTML={undefined}
      ref={ref}
      aria-hidden={isLabelled ? undefined : true}
      aria-label={isLabelled ? accessibleLabel : undefined}
      aria-labelledby={undefined}
      className={['hds-icon', className].filter(Boolean).join(' ')}
      data-size={size}
      fill="none"
      focusable="false"
      height={size}
      role={isLabelled ? 'img' : undefined}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      style={undefined}
      tabIndex={undefined}
      viewBox="0 0 24 24"
      width={size}
    >
      {ICON_PATHS[name].map((path) => (
        <path d={path} key={path} />
      ))}
    </svg>
  );
});
