import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
} from 'react';

import { mergeIds } from '../field/ids';

export type SwitchSize = 'small' | 'medium';

export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'role' | 'size' | 'type'
> {
  label: string;
  description?: string;
  errorMessage?: string;
  size?: SwitchSize;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  {
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
    'aria-invalid': ariaInvalid,
    className,
    description,
    disabled = false,
    errorMessage,
    id,
    label,
    size = 'medium',
    ...inputProps
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? `ds-switch-${generatedId}`;
  const hasDescription = typeof description === 'string'
    && description.trim().length > 0;
  const hasError = errorMessage !== undefined;
  const descriptionId = hasDescription ? `${inputId}-description` : undefined;
  const errorId = hasError ? `${inputId}-error` : undefined;
  const describedBy = mergeIds(descriptionId, errorId, ariaDescribedBy);
  const state = disabled ? 'disabled' : hasError ? 'error' : 'default';
  const inputClasses = ['ds-switch__input', className].filter(Boolean).join(' ');

  return (
    <div className="ds-switch" data-size={size} data-state={state}>
      <label className="ds-switch__row" htmlFor={inputId}>
        <input
          {...inputProps}
          ref={ref}
          aria-describedby={describedBy}
          aria-errormessage={hasError ? errorId : ariaErrorMessage}
          aria-invalid={hasError ? true : ariaInvalid}
          className={inputClasses}
          data-size={size}
          data-state={state}
          disabled={disabled}
          id={inputId}
          role="switch"
          type="checkbox"
        />
        <span className="ds-switch__label">{label}</span>
      </label>
      {hasDescription ? (
        <p className="ds-switch__description" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {hasError ? (
        <p className="ds-switch__error" id={errorId} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
});
