import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

import { BRAND } from '../../src/config/brand';

const publicRoot = new URL('../../public/', import.meta.url);

function pngSize(buffer: Buffer): { width: number; height: number } {
  expect(buffer.subarray(1, 4).toString('ascii')).toBe('PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

describe('HDS brand contract', () => {
  it('publishes the approved name, copy, version, and canonical origin', () => {
    expect(BRAND).toEqual({
      name: 'Haru Design System',
      shortName: 'HDS',
      version: '0.1.0',
      site: 'https://hds.haru-dev.com',
      headline: 'Haru의 제품 경험을 일관되게 만드는 디자인 시스템',
      description:
        '토큰, 접근 가능한 React 컴포넌트, Figma 라이브러리와 AI용 메타데이터를 하나의 계약으로 연결합니다.',
    });
  });

  it('ships the monogram, favicon, touch icon, and social image at exact paths', async () => {
    const [mark, favicon, touchIcon, openGraph] = await Promise.all([
      readFile(new URL('brand/hds-mark.svg', publicRoot), 'utf8'),
      readFile(new URL('favicon.svg', publicRoot), 'utf8'),
      readFile(new URL('apple-touch-icon.png', publicRoot)),
      readFile(new URL('brand/hds-og.png', publicRoot)),
    ]);

    expect(mark).toContain('aria-label="HDS"');
    expect(mark).toContain('#245BE0');
    expect(favicon).toContain('#245BE0');
    expect(pngSize(touchIcon)).toEqual({ width: 180, height: 180 });
    expect(pngSize(openGraph)).toEqual({ width: 1200, height: 630 });
  });
});
