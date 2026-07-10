import { forwardRef, type SVGProps } from 'react';
import { ICON_PATHS, type IconName } from './paths';
export type IconSize=16|20|24;
export interface IconProps extends Omit<SVGProps<SVGSVGElement>,'children'|'role'|'aria-label'|'aria-hidden'>{name:IconName;size?:IconSize;label?:string}
export const Icon=forwardRef<SVGSVGElement,IconProps>(function Icon({className,label,name,size=24,strokeWidth=2,...svgProps},ref){const l=typeof label==='string'?label.trim():'';const labelled=l.length>0;return <svg {...svgProps} ref={ref} aria-hidden={labelled?undefined:true} aria-label={labelled?l:undefined} className={['ds-icon',className].filter(Boolean).join(' ')} data-size={size} fill="none" focusable="false" height={size} role={labelled?'img':undefined} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} viewBox="0 0 24 24" width={size}>{ICON_PATHS[name].map(path=><path d={path} key={path}/>)}</svg>});
