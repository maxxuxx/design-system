import { readFileSync } from 'node:fs';
import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import {
  Tab,
  type TabItem,
  type TabLayout,
  type TabProps,
  type TabSize,
} from './Tab';
import { expectNoAxeViolations } from '../test/accessibility';

const items = [
  { value: 'overview', label: '요약', content: <p>요약 패널</p> },
  { value: 'history', label: '내역', content: <p>내역 패널</p> },
  {
    value: 'receipts',
    label: '영수증',
    content: <p>영수증 패널</p>,
    disabled: true,
  },
  { value: 'settings', label: '설정', content: <p>설정 패널</p> },
] as const satisfies readonly TabItem[];

describe('Tab', () => {
  it.each([
    { name: 'empty items', items: [], message: 'at least one item' },
    {
      name: 'empty values',
      items: [{ value: '   ', label: '빈 값', content: '내용' }],
      message: 'non-empty values',
    },
    {
      name: 'duplicate values',
      items: [
        { value: 'same', label: '첫째', content: '첫째 내용' },
        { value: 'same', label: '둘째', content: '둘째 내용' },
      ],
      message: 'unique values',
    },
    {
      name: 'all-disabled items',
      items: [
        { value: 'one', label: '첫째', content: '첫째 내용', disabled: true },
        { value: 'two', label: '둘째', content: '둘째 내용', disabled: true },
      ],
      message: 'one enabled item',
    },
  ])('rejects $name', ({ items: invalidItems, message }) => {
    expect(() => render(
      <Tab ariaLabel="잘못된 탭" items={invalidItems} />,
    )).toThrow(message);
  });

  it.each([
    { prop: 'value', props: { value: 'missing' } },
    { prop: 'defaultValue', props: { defaultValue: 'missing' } },
    { prop: 'value', props: { value: 'receipts' } },
    { prop: 'defaultValue', props: { defaultValue: 'receipts' } },
  ] as const)('rejects an unknown or disabled $prop', ({ props }) => {
    expect(() => render(
      <Tab ariaLabel="선택 검증" items={items} {...props} />,
    )).toThrow('enabled item value');
  });

  it('defaults to the first enabled item and owns roving tabIndex', () => {
    const firstDisabled = [
      { value: 'blocked', label: '사용 불가', content: '사용 불가', disabled: true },
      ...items,
    ] satisfies readonly TabItem[];

    render(<Tab ariaLabel="주문 정보" items={firstDisabled} />);
    const tablist = screen.getByRole('tablist', { name: '주문 정보' });
    const tabs = screen.getAllByRole('tab');

    expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');
    expect(tabs[0]).toBeDisabled();
    expect(tabs[0]).toHaveAttribute('tabindex', '-1');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('tabindex', '0');
    expect(tabs.slice(2).every((tab) => tab.tabIndex === -1)).toBe(true);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('요약 패널');
  });

  it('supports uncontrolled defaultValue and pointer activation', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Tab
        ariaLabel="주문 정보"
        defaultValue="history"
        items={items}
        onValueChange={onValueChange}
      />,
    );

    expect(screen.getByRole('tab', { name: '내역' }))
      .toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: '설정' }));
    expect(screen.getByRole('tab', { name: '설정' }))
      .toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('설정 패널');
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenLastCalledWith('settings');
  });

  it('supports controlled selection without maintaining mirror state', async () => {
    const user = userEvent.setup();

    function ControlledTab() {
      const [value, setValue] = useState('overview');
      return (
        <Tab
          ariaLabel="제어 탭"
          items={items}
          onValueChange={setValue}
          value={value}
        />
      );
    }

    render(<ControlledTab />);
    await user.click(screen.getByRole('tab', { name: '내역' }));
    expect(screen.getByRole('tab', { name: '내역' }))
      .toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('내역 패널');
  });

  it('does not change controlled selection when the owner ignores a request', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Tab
        ariaLabel="고정된 제어 탭"
        items={items}
        onValueChange={onValueChange}
        value="overview"
      />,
    );

    await user.click(screen.getByRole('tab', { name: '내역' }));
    expect(onValueChange).toHaveBeenCalledWith('history');
    expect(screen.getByRole('tab', { name: '요약' }))
      .toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('요약 패널');
  });

  it('automatically selects on Arrow keys, skips disabled tabs, and wraps', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Tab
        ariaLabel="키보드 탭"
        items={items}
        onValueChange={onValueChange}
      />,
    );
    const overview = screen.getByRole('tab', { name: '요약' });
    const history = screen.getByRole('tab', { name: '내역' });
    const settings = screen.getByRole('tab', { name: '설정' });

    overview.focus();
    await user.keyboard('{ArrowRight}');
    expect(history).toHaveFocus();
    expect(history).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowRight}');
    expect(settings).toHaveFocus();
    expect(settings).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowRight}');
    expect(overview).toHaveFocus();
    expect(overview).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowLeft}');
    expect(settings).toHaveFocus();
    expect(settings).toHaveAttribute('aria-selected', 'true');
    expect(onValueChange.mock.calls.map(([value]) => value))
      .toEqual(['history', 'settings', 'overview', 'settings']);
  });

  it('selects the first and last enabled tabs with Home and End', async () => {
    const user = userEvent.setup();
    render(<Tab ariaLabel="키보드 탭" defaultValue="history" items={items} />);
    const overview = screen.getByRole('tab', { name: '요약' });
    const history = screen.getByRole('tab', { name: '내역' });
    const settings = screen.getByRole('tab', { name: '설정' });

    history.focus();
    await user.keyboard('{End}');
    expect(settings).toHaveFocus();
    expect(settings).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Home}');
    expect(overview).toHaveFocus();
    expect(overview).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps disabled tabs out of pointer and keyboard activation', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Tab
        ariaLabel="비활성 탭"
        items={items}
        onValueChange={onValueChange}
      />,
    );
    const disabledTab = screen.getByRole('tab', { name: '영수증' });

    expect(disabledTab).toBeDisabled();
    expect(disabledTab).toHaveAttribute('aria-selected', 'false');
    expect(disabledTab).toHaveAttribute('tabindex', '-1');
    await user.click(disabledTab);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('요약 패널');
  });

  it('connects every tab and panel with stable generated IDs', () => {
    const { rerender } = render(
      <Tab ariaLabel="관계 탭" id="consumer-root" items={items} />,
    );
    const firstTabs = screen.getAllByRole('tab');
    const firstPanels = screen.getAllByRole('tabpanel', { hidden: true });
    const relationships = firstTabs.map((tab, index) => ({
      tabId: tab.id,
      panelId: firstPanels[index]?.id,
    }));

    expect(firstTabs).toHaveLength(items.length);
    expect(firstPanels).toHaveLength(items.length);
    for (const [index, tab] of firstTabs.entries()) {
      const panel = firstPanels[index]!;
      expect(tab.id).toMatch(/^hds-tab-/);
      expect(tab).toHaveAttribute('aria-controls', panel.id);
      expect(panel).toHaveAttribute('aria-labelledby', tab.id);
      expect(panel.hidden).toBe(index !== 0);
    }

    rerender(<Tab ariaLabel="관계 탭" id="consumer-root" items={items} />);
    expect(screen.getAllByRole('tab').map((tab, index) => ({
      tabId: tab.id,
      panelId: screen.getAllByRole('tabpanel', { hidden: true })[index]?.id,
    }))).toEqual(relationships);
  });

  it('keeps each value ID and relationship stable when items reorder', () => {
    const { rerender } = render(
      <Tab ariaLabel="재정렬 탭" items={items} />,
    );
    const relationshipFor = (label: string) => {
      const tab = screen.getByRole('tab', { name: label });
      return { tabId: tab.id, panelId: tab.getAttribute('aria-controls') };
    };
    const overview = relationshipFor('요약');
    const history = relationshipFor('내역');

    rerender(<Tab ariaLabel="재정렬 탭" items={[...items].reverse()} />);
    expect(relationshipFor('요약')).toEqual(overview);
    expect(relationshipFor('내역')).toEqual(history);
    expect(document.getElementById(overview.panelId!))
      .toHaveAttribute('aria-labelledby', overview.tabId);
    expect(document.getElementById(history.panelId!))
      .toHaveAttribute('aria-labelledby', history.tabId);
  });

  it('creates relationships for every non-empty JavaScript string value', () => {
    const unusualItems = [
      { value: 'value-\uD800', label: '특수 값', content: '특수 패널' },
    ] satisfies readonly TabItem[];

    expect(() => render(
      <Tab ariaLabel="특수 값 탭" items={unusualItems} />,
    )).not.toThrow();
    const tab = screen.getByRole('tab', { name: '특수 값' });
    const panel = screen.getByRole('tabpanel');
    expect(tab).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', tab.id);
  });

  it('forwards native div props, className, style, and ref to the root', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Tab
        ariaLabel="전달 탭"
        className="consumer-tab"
        data-consumer="native"
        items={items}
        layout="scroll"
        ref={ref}
        size="small"
        style={{ backgroundColor: 'red', color: 'red', marginTop: 1, minHeight: 1 }}
      />,
    );
    const root = screen.getByRole('tablist').parentElement;

    expect(ref.current).toBe(root);
    expect(root).toHaveClass('hds-tab', 'consumer-tab');
    expect(root).toHaveAttribute('data-consumer', 'native');
    expect(root).toHaveAttribute('data-layout', 'scroll');
    expect(root).toHaveAttribute('data-size', 'small');
    expect(root).toHaveStyle('margin-top: 1px');
    expect(root?.style.backgroundColor).toBe('');
    expect(root?.style.color).toBe('');
    expect(root?.style.minHeight).toBe('');
  });

  it('keeps owned tabs and panels when a native dangerous HTML prop is supplied', () => {
    const { container } = render(
      <Tab
        ariaLabel="주입 방어 탭"
        dangerouslySetInnerHTML={{
          __html: '<button data-injected="true">주입</button>',
        }}
        items={items}
      />,
    );

    expect(screen.getAllByRole('tab')).toHaveLength(items.length);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('요약 패널');
    expect(container.querySelector('[data-injected="true"]')).toBeNull();
  });

  it('owns equal and scroll layout hooks plus long-copy-safe panels', () => {
    const longCopy = 'TabLongUnbrokenLocalizedCopy'.repeat(12);
    const longItems = [
      { value: 'long', label: longCopy, content: longCopy },
      { value: 'short', label: '짧은 탭', content: '짧은 패널' },
    ] satisfies readonly TabItem[];
    const { rerender } = render(
      <Tab ariaLabel="레이아웃 탭" items={longItems} />,
    );

    expect(screen.getByRole('tablist')).toHaveClass('hds-tab__list');
    expect(screen.getByRole('tablist').parentElement)
      .toHaveAttribute('data-layout', 'equal');
    expect(screen.getByRole('tabpanel')).toHaveClass('hds-tab__panel');
    expect(screen.getByRole('tabpanel')).toHaveTextContent(longCopy);

    rerender(<Tab ariaLabel="레이아웃 탭" items={longItems} layout="scroll" />);
    expect(screen.getByRole('tablist').parentElement)
      .toHaveAttribute('data-layout', 'scroll');
  });

  it('uses token-backed 44px and 52px layouts with forced colors and reduced motion', () => {
    const componentCss = readFileSync('src/tab/Tab.css', 'utf8');

    expect(componentCss).toContain('var(--hds-size-control-small)');
    expect(componentCss).toContain(
      'calc(var(--hds-size-control-small) + var(--hds-space-8))',
    );
    expect(componentCss).toContain('var(--hds-motion-duration-fast)');
    expect(componentCss).toContain('var(--hds-motion-easing-standard)');
    expect(componentCss).toContain('@media (forced-colors: active)');
    expect(componentCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(componentCss).toContain('overflow-wrap: anywhere');
    expect(componentCss).not.toMatch(/(?:^|[;{]\s*)(?:height|min-height):\s*(?:44|52)px/m);
  });

  it('exposes the exact public API contract', () => {
    expectTypeOf<TabSize>().toEqualTypeOf<'small' | 'large'>();
    expectTypeOf<TabLayout>().toEqualTypeOf<'equal' | 'scroll'>();
    expectTypeOf<TabProps['items']>().toEqualTypeOf<readonly TabItem[]>();
    expectTypeOf<TabItem>().toEqualTypeOf<{
      value: string;
      label: string;
      content: React.ReactNode;
      disabled?: boolean;
    }>();
  });

  it('is available from the component and package entrypoints with registered styles', async () => {
    const [componentEntry, packageEntry] = await Promise.all([
      import('./index'),
      import('../index'),
    ]);
    const stylesheet = readFileSync('src/styles.css', 'utf8');

    expect(componentEntry.Tab).toBe(Tab);
    expect(packageEntry.Tab).toBe(Tab);
    expect(stylesheet).toContain("@import './tab/Tab.css';");
  });

  it('has no axe violations with disabled tabs and associated panels', async () => {
    const { container } = render(
      <Tab ariaLabel="접근 가능한 주문 탭" items={items} />,
    );

    await expectNoAxeViolations(container);
  });
});
