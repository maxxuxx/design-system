import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEventHandler,
  type InputHTMLAttributes,
  type Ref,
} from 'react';

import { Icon } from '../icon';
import { IconButton } from '../icon-button';
import { getSafeLayoutStyle } from '../internal/safe-layout-style';

export interface SearchFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | 'children'
  | 'defaultValue'
  | 'onChange'
  | 'size'
  | 'type'
  | 'value'
> {
  label: string;
  clearLabel: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onClear?: () => void;
  fixed?: boolean;
  takeSpace?: boolean;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  function SearchField(
    {
      className,
      clearLabel,
      dangerouslySetInnerHTML: _dangerouslySetInnerHTML,
      defaultValue,
      disabled = false,
      fixed = false,
      id,
      label,
      onClear,
      onValueChange,
      readOnly = false,
      style,
      takeSpace = true,
      value,
      ...inputProps
    },
    ref,
  ) {
    const accessibleLabel = typeof label === 'string' ? label.trim() : '';
    const accessibleClearLabel = typeof clearLabel === 'string'
      ? clearLabel.trim()
      : '';

    if (accessibleLabel.length === 0) {
      throw new Error('SearchField label must be a non-empty string.');
    }
    if (accessibleClearLabel.length === 0) {
      throw new Error('SearchField clearLabel must be a non-empty string.');
    }

    const generatedId = useId();
    const inputId = id ?? `ds-search-field-${generatedId}`;
    const inputRef = useRef<HTMLInputElement | null>(null);
    const barRef = useRef<HTMLDivElement | null>(null);
    const [uncontrolledValue, setUncontrolledValue] = useState(
      defaultValue ?? '',
    );
    const [spacerHeight, setSpacerHeight] = useState<number>();
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : uncontrolledValue;
    const showClear = currentValue.length > 0 && !disabled && !readOnly;
    const rootClasses = ['ds-search-field', className]
      .filter(Boolean)
      .join(' ');

    const setInputRef = useCallback((node: HTMLInputElement | null) => {
      inputRef.current = node;
      assignRef(ref, node);
    }, [ref]);

    useEffect(() => {
      if (isControlled) return;

      const form = inputRef.current?.form;
      if (!form) return;

      let active = true;
      const handleReset = (event: Event) => {
        queueMicrotask(() => {
          if (active && !event.defaultPrevented) {
            setUncontrolledValue(defaultValue ?? '');
          }
        });
      };
      form.addEventListener('reset', handleReset);
      return () => {
        active = false;
        form.removeEventListener('reset', handleReset);
      };
    }, [defaultValue, isControlled]);

    useEffect(() => {
      const bar = barRef.current;
      if (!fixed || !takeSpace || !bar) {
        setSpacerHeight(undefined);
        return;
      }

      const synchronizeHeight = () => {
        const nextHeight = bar.getBoundingClientRect().height;
        setSpacerHeight(nextHeight > 0 ? nextHeight : undefined);
      };

      synchronizeHeight();
      if (typeof ResizeObserver === 'undefined') return;

      const observer = new ResizeObserver(synchronizeHeight);
      observer.observe(bar);
      return () => observer.disconnect();
    }, [fixed, takeSpace]);

    const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
      const nextValue = event.currentTarget.value;
      if (!isControlled) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);
    };

    const handleClear = () => {
      if (disabled || readOnly) return;
      if (!isControlled) setUncontrolledValue('');
      onValueChange?.('');
      onClear?.();
      inputRef.current?.focus();
    };

    return (
      <div
        className={rootClasses}
        data-fixed={fixed}
        data-state={disabled ? 'disabled' : readOnly ? 'readonly' : 'default'}
        data-take-space={fixed && takeSpace}
        style={getSafeLayoutStyle(style)}
      >
        {fixed && takeSpace ? (
          <div
            aria-hidden="true"
            className="ds-search-field__spacer"
            style={spacerHeight === undefined
              ? undefined
              : { blockSize: `${spacerHeight}px` }}
          />
        ) : null}
        <div className="ds-search-field__bar" ref={barRef}>
          <div className="ds-search-field__control">
            <Icon
              className="ds-search-field__search-icon"
              name="search"
              size={20}
            />
            <label className="ds-search-field__label" htmlFor={inputId}>
              {accessibleLabel}
            </label>
            <input
              {...inputProps}
              ref={setInputRef}
              className="ds-search-field__input"
              dangerouslySetInnerHTML={undefined}
              disabled={disabled}
              id={inputId}
              onChange={handleChange}
              readOnly={readOnly}
              type="search"
              value={currentValue}
            />
            {showClear ? (
              <IconButton
                className="ds-search-field__clear"
                label={accessibleClearLabel}
                name="close"
                onClick={handleClear}
                size="medium"
                type="button"
                variant="clear"
              />
            ) : null}
          </div>
        </div>
      </div>
    );
  },
);
