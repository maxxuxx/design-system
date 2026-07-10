import axe from 'axe-core';
import { expect } from 'vitest';
export async function expectNoAxeViolations(container: Element): Promise<void> { const results = await axe.run(container); expect(results.violations).toEqual([]); }
