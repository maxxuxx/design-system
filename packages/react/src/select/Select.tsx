import {
  forwardRef,
  useId,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';

import { mergeIds } from '../field/ids';
import { Icon } from '../icon';

export type SelectSize = 'medium' | 'large';

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'children' | 'multiple' | 'size'
> {
  children: ReactNode;
  label: string;
  description?: string;
  errorMessage?: string;
  placeholder?: string;
  size?: SelectSize;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
    'aria-invalid': ariaInvalid,
    children,
    className,
    description,
    disabled = false,
    errorMessage,
    id,
    label,
    placeholder,
    size = 'medium',
    ...selectProps
  },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? `hds-select-${generatedId}`;
  const hasDescription = typeof description === 'string' && description.trim().length > 0;
  const hasError = errorMessage !== undefined;
  const hasPlaceholder = placeholder !== undefined;
  const descriptionId = hasDescription ? `${selectId}-description` : undefined;
  const errorId = hasError ? `${selectId}-error` : undefined;
  const describedBy = mergeIds(descriptionId, errorId, ariaDescribedBy);
  const state = disabled ? 'disabled' : hasError ? 'error' : 'default';
  const controlClasses = ['hds-select__control', className].filter(Boolean).join(' ');

  return (
    <div className="hds-select" data-size={size} data-state={state}>
      <label className="hds-select__label" htmlFor={selectId}>
        {label}
      </label>
      <div className="hds-select__field" data-size={size} data-state={state}>
        <select
          {...selectProps}
          ref={ref}
          aria-describedby={describedBy}
          aria-errormessage={hasError ? errorId : ariaErrorMessage}
          aria-invalid={hasError ? true : ariaInvalid}
          className={controlClasses}
          data-size={size}
          data-state={state}
          disabled={disabled}
          id={selectId}
          multiple={false}
        >
          {hasPlaceholder ? (
            <option disabled value="">
              {placeholder}
            </option>
          ) : null}
          {children}
        </select>
        <Icon className="hds-select__icon" name="chevron-right" size={20} />
      </div>
      {hasDescription ? (
        <p className="hds-select__description" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {hasError ? (
        <p className="hds-select__error" id={errorId} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
});
