import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../test/accessibility';
import { Icon } from './Icon';
import { ICON_NAMES, ICON_PATHS, ICON_SVGS } from './paths';
describe('Icon', () => {
 it('renders default decorative',()=>{render(<Icon data-testid="icon" name="check"/>);const i=screen.getByTestId('icon');expect(i).toHaveAttribute('viewBox','0 0 24 24');expect(i).toHaveAttribute('width','24');expect(i).toHaveAttribute('height','24');expect(i).toHaveAttribute('fill','none');expect(i).toHaveAttribute('stroke','currentColor');expect(i).toHaveAttribute('aria-hidden','true');expect(i).toHaveAttribute('focusable','false');expect(i).not.toHaveAttribute('role');});
 it('owns paths',()=>{for(const n of ICON_NAMES){const {container,unmount}=render(<Icon name={n}/>);expect(container.querySelectorAll('path')).toHaveLength(ICON_PATHS[n].length);expect(ICON_SVGS[n]).toContain('<svg');unmount();}});
 it('size wins and forwards',()=>{render(<Icon data-testid="icon" name="search" size={16} width={99} height={99} strokeWidth={1.5}/>);const i=screen.getByTestId('icon');expect(i).toHaveAttribute('width','16');expect(i).toHaveAttribute('height','16');expect(i).toHaveAttribute('stroke-width','1.5');});
 it('labels',()=>{render(<Icon data-testid="icon" label="  Search  " name="search"/>);const i=screen.getByTestId('icon');expect(i).toHaveAttribute('role','img');expect(i).toHaveAttribute('aria-label','Search');});
 it('whitespace decorative',()=>{render(<Icon data-testid="icon" label="   " name="info"/>);expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden','true');});
 it('forwards ref',()=>{const r=createRef<SVGSVGElement>();render(<Icon ref={r} name="close"/>);expect(r.current).toBeInstanceOf(SVGSVGElement);});
 it('axe clean',async()=>{const {container}=render(<div><Icon name="check"/><Icon label="Info" name="info"/></div>);await expectNoAxeViolations(container);});
});
