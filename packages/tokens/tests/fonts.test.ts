import { access, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const packageRoot = new URL('../', import.meta.url);
const fontsCssUrl = new URL('../fonts.css', import.meta.url);

describe('Pretendard font package', () => {
  it('exports a local variable dynamic-subset stylesheet', async () => {
    const packageJson = JSON.parse(
      await readFile(new URL('../package.json', import.meta.url), 'utf8'),
    ) as { exports: Record<string, string> };
    const css = await readFile(fontsCssUrl, 'utf8');
    const urls = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(
      (match) => match[1]!,
    );

    expect(packageJson.exports['./fonts.css']).toBe('./fonts.css');
    expect(css).toMatch(/font-family:\s*'Pretendard Variable'/);
    expect(css).toMatch(/font-weight:\s*45 920/);
    expect(css).toMatch(/font-display:\s*swap/);
    expect(urls).toHaveLength(92);
    expect(new Set(urls).size).toBe(92);

    await Promise.all(
      urls.map(async (relative) => {
        expect(relative).toMatch(
          /^\.\/fonts\/pretendard\/woff2\/PretendardVariable\.subset\.\d+\.woff2$/,
        );
        await access(new URL(relative, fontsCssUrl));
      }),
    );
    await access(new URL('./fonts/pretendard/LICENSE.txt', packageRoot));
  });
});
