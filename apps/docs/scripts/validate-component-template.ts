export const REQUIRED_COMPONENT_HEADINGS = [
  '예제',
  '사용해야 할 때',
  '사용하지 말아야 할 때',
  '구조',
  '크기와 변형',
  '상태와 동작',
  '반응형 동작',
  '접근성',
  'React 예제',
  'API',
  '사용 토큰',
  'Figma',
  '지원 상태',
] as const;

function tagDepthDelta(line: string): number {
  const tags = line.match(/<\/?[A-Za-z][^>]*>|<>|<\/>/g) ?? [];
  return tags.reduce((depth, tag) => {
    if (tag.startsWith('</') || tag === '</>') return depth - 1;
    if (tag.endsWith('/>')) return depth;
    return depth + 1;
  }, 0);
}

export function extractSecondLevelHeadings(source: string): string[] {
  const headings: string[] = [];
  let fence: '`' | '~' | null = null;
  let fenceLength = 0;
  let jsxDepth = 0;
  let pendingJsxTag = '';
  let inFrontmatter = false;
  let frontmatterSeen = false;

  for (const line of source.replaceAll('\r\n', '\n').split('\n')) {
    if (!frontmatterSeen && line.trim() === '---') { frontmatterSeen = true; inFrontmatter = true; continue; }
    if (inFrontmatter) { if (line.trim() === '---') inFrontmatter = false; continue; }
    const trimmed = line.trimStart();
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1]!;
      const markerKind = marker[0] as '`' | '~';
      if (fence === null) {
        fence = markerKind;
        fenceLength = marker.length;
        continue;
      }
      if (fence === markerKind && marker.length >= fenceLength) {
        fence = null;
        fenceLength = 0;
      }
      continue;
    }
    if (fence !== null) continue;

    if (pendingJsxTag !== '') {
      pendingJsxTag += `\n${line}`;
      if (line.includes('>')) {
        jsxDepth = Math.max(0, jsxDepth + tagDepthDelta(pendingJsxTag));
        pendingJsxTag = '';
      }
      continue;
    }

    if (trimmed.startsWith('<') && !trimmed.includes('>')) {
      pendingJsxTag = line;
      continue;
    }

    const depthBefore = jsxDepth;
    jsxDepth = Math.max(0, jsxDepth + tagDepthDelta(line));
    if (depthBefore > 0 || trimmed.startsWith('<')) continue;

    const heading = line.match(/^##(?!#)\s+(.+?)\s*#*\s*$/);
    if (heading) headings.push(heading[1]!.trim());
  }
  return headings;
}

export function validateComponentTemplate(source: string, filePath: string): void {
  const actual = extractSecondLevelHeadings(source);
  const count = Math.max(REQUIRED_COMPONENT_HEADINGS.length, actual.length);
  for (let index = 0; index < count; index += 1) {
    const expectedHeading = REQUIRED_COMPONENT_HEADINGS[index];
    const actualHeading = actual[index];
    if (expectedHeading !== actualHeading) {
      throw new Error(
        `${filePath}: component heading ${index + 1} expected "${expectedHeading ?? '<none>'}" but found "${actualHeading ?? '<missing>'}".`,
      );
    }
  }
}
