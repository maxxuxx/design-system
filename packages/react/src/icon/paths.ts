export const ICON_NAMES = ['check','chevron-right','close','info','search'] as const;
export type IconName = (typeof ICON_NAMES)[number];
export const ICON_PATHS = {check:['M5 12.5 9.5 17 19 7.5'],'chevron-right':['M9 5 16 12 9 19'],close:['M6 6 18 18','M18 6 6 18'],info:['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z','M12 11v5','M12 8h.01'],search:['M10.8 18a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4Z','M16 16 21 21']} as const satisfies Record<IconName, readonly string[]>;
const createSvg=(paths:readonly string[])=>`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths.map(p=>`<path d="${p}"/>`).join('')}</svg>`;
export const ICON_SVGS=Object.fromEntries(ICON_NAMES.map(n=>[n,createSvg(ICON_PATHS[n])])) as Record<IconName,string>;
