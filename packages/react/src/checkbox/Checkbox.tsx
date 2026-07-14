import {
  forwardRef,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type InputHTMLAttributes,
} from 'react';

import { mergeIds } from '../field/ids';

export type CheckboxSize = 'small' | 'medium';

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type'
> {
  label: string;
  description?: string;
  errorMessage?: string;
  indeterminate?: boolean;
  size?: CheckboxSize;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
    'aria-invalid': ariaInvalid,
    className,
    description,
    disabled = false,
    errorMessage,
    id,
    indeterminate = false,
    label,
    size = 'medium',
    ...inputProps
  },
  ref,
) {
  const generatedId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = id ?? `hds-checkbox-${generatedId}`;
  const hasDescription = typeof description === 'string'
    && description.trim().length > 0;
  const hasError = errorMessage !== undefined;
  const descriptionId = hasDescription ? `${inputId}-description` : undefined;
  const errorId = hasError ? `${inputId}-error` : undefined;
  const describedBy = mergeIds(descriptionId, errorId, ariaDescribedBy);
  const state = disabled ? 'disabled' : hasError ? 'error' : 'default';
  const inputClasses = ['hds-checkbox__input', className].filter(Boolean).join(' ');

  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  useLayoutEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <div className="hds-checkbox" data-size={size} data-state={state}>
      <label className="hds-checkbox__row" htmlFor={inputId}>
        <input
          {...inputProps}
          ref={inputRef}
          aria-describedby={describedBy}
          aria-errormessage={hasError ? errorId : ariaErrorMessage}
          aria-invalid={hasError ? true : ariaInvalid}
          className={inputClasses}
          data-size={size}
          data-state={state}
          disabled={disabled}
          id={inputId}
          type="checkbox"
        />
        <span className="hds-checkbox__label">{label}</span>
      </label>
      {hasDescription ? (
        <p className="hds-checkbox__description" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {hasError ? (
        <p className="hds-checkbox__error" id={errorId} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
});
