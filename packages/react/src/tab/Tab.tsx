import {
  forwardRef,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { getSafeLayoutStyle } from '../internal/safe-layout-style';

export type TabSize = 'small' | 'large';
export type TabLayout = 'equal' | 'scroll';

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'defaultValue' | 'onChange'
> {
  ariaLabel: string;
  items: readonly TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  size?: TabSize;
  layout?: TabLayout;
}

function validateItems(items: readonly TabItem[]): void {
  if (items.length === 0) {
    throw new Error('Tab requires at least one item.');
  }

  const values = new Set<string>();
  for (const item of items) {
    if (item.value.trim().length === 0) {
      throw new Error('Tab items must use non-empty values.');
    }
    if (values.has(item.value)) {
      throw new Error('Tab items must use unique values.');
    }
    values.add(item.value);
  }

  if (!items.some((item) => !item.disabled)) {
    throw new Error('Tab requires at least one enabled item.');
  }
}

function enabledItemIndex(items: readonly TabItem[], value: string): number {
  return items.findIndex((item) => item.value === value && !item.disabled);
}

function assertEnabledValue(
  items: readonly TabItem[],
  value: string | undefined,
): void {
  if (value !== undefined && enabledItemIndex(items, value) === -1) {
    throw new Error('Tab value and defaultValue must reference an enabled item value.');
  }
}

function adjacentEnabledIndex(
  items: readonly TabItem[],
  currentIndex: number,
  direction: 1 | -1,
): number {
  let nextIndex = currentIndex;
  do {
    nextIndex = (nextIndex + direction + items.length) % items.length;
  } while (items[nextIndex]?.disabled);
  return nextIndex;
}

function itemValueIdentity(value: string): string {
  let identity = '';
  for (let index = 0; index < value.length; index += 1) {
    identity += value.charCodeAt(index).toString(16).padStart(4, '0');
  }
  return identity;
}

export const Tab = forwardRef<HTMLDivElement, TabProps>(function Tab(
  {
    ariaLabel,
    className,
    defaultValue,
    items,
    layout = 'equal',
    onValueChange,
    size = 'large',
    style,
    value,
    ...rootProps
  },
  ref,
) {
  validateItems(items);
  assertEnabledValue(items, value);
  assertEnabledValue(items, defaultValue);

  const generatedId = useId();
  const tabId = `ds-tab-${generatedId}`;
  const firstEnabledValue = items.find((item) => !item.disabled)!.value;
  const [uncontrolledValue, setUncontrolledValue] = useState(
    () => defaultValue ?? firstEnabledValue,
  );
  const selectedValue = value
    ?? (enabledItemIndex(items, uncontrolledValue) === -1
      ? firstEnabledValue
      : uncontrolledValue);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const classes = ['ds-tab', className].filter(Boolean).join(' ');

  function selectItem(index: number): void {
    const item = items[index];
    if (!item || item.disabled || item.value === selectedValue) return;
    if (value === undefined) setUncontrolledValue(item.value);
    onValueChange?.(item.value);
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ): void {
    let nextIndex: number | undefined;
    if (event.key === 'ArrowRight') {
      nextIndex = adjacentEnabledIndex(items, currentIndex, 1);
    } else if (event.key === 'ArrowLeft') {
      nextIndex = adjacentEnabledIndex(items, currentIndex, -1);
    } else if (event.key === 'Home') {
      nextIndex = items.findIndex((item) => !item.disabled);
    } else if (event.key === 'End') {
      nextIndex = items.findLastIndex((item) => !item.disabled);
    }

    if (nextIndex === undefined || nextIndex < 0) return;
    event.preventDefault();
    selectItem(nextIndex);
    buttonRefs.current[nextIndex]?.focus();
  }

  return (
    <div
      {...rootProps}
      ref={ref}
      className={classes}
      dangerouslySetInnerHTML={undefined}
      data-layout={layout}
      data-size={size}
      style={getSafeLayoutStyle(style)}
    >
      <div
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        className="ds-tab__list"
        role="tablist"
      >
        {items.map((item, index) => {
          const isSelected = item.value === selectedValue;
          const itemIdentity = itemValueIdentity(item.value);
          const itemTabId = `${tabId}-tab-${itemIdentity}`;
          const itemPanelId = `${tabId}-panel-${itemIdentity}`;

          return (
            <button
              ref={(element) => {
                buttonRefs.current[index] = element;
              }}
              aria-controls={itemPanelId}
              aria-selected={isSelected}
              className="ds-tab__button"
              data-state={item.disabled
                ? 'disabled'
                : isSelected ? 'selected' : 'default'}
              disabled={item.disabled}
              id={itemTabId}
              key={item.value}
              role="tab"
              tabIndex={isSelected ? 0 : -1}
              type="button"
              onClick={() => selectItem(index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <span className="ds-tab__label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="ds-tab__panels">
        {items.map((item) => {
          const isSelected = item.value === selectedValue;
          const itemIdentity = itemValueIdentity(item.value);
          return (
            <div
              aria-labelledby={`${tabId}-tab-${itemIdentity}`}
              className="ds-tab__panel"
              hidden={!isSelected}
              id={`${tabId}-panel-${itemIdentity}`}
              key={item.value}
              role="tabpanel"
            >
              {item.content}
            </div>
          );
        })}
      </div>
    </div>
  );
});
