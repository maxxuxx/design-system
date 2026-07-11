import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
} from 'react';

export type TextFieldSize = 'medium' | 'large';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  description?: string;
  errorMessage?: string;
  size?: TextFieldSize;
}

function mergeIds(...values: Array<string | undefined>): string | undefined {
  const ids = values
    .flatMap((value) => value?.split(/\s+/) ?? [])
    .filter((value, index, all) => value.length > 0 && all.indexOf(value) === index);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
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
  const inputId = id ?? `ds-text-field-${generatedId}`;
  const hasDescription = typeof description === 'string' && description.trim().length > 0;
  const hasError = errorMessage !== undefined;
  const descriptionId = hasDescription ? `${inputId}-description` : undefined;
  const errorId = hasError ? `${inputId}-error` : undefined;
  const describedBy = mergeIds(descriptionId, errorId, ariaDescribedBy);
  const state = disabled ? 'disabled' : hasError ? 'error' : 'default';
  const inputClasses = ['ds-text-field__input', className].filter(Boolean).join(' ');

  return (
    <div className="ds-text-field" data-state={state} data-size={size}>
      <label className="ds-text-field__label" htmlFor={inputId}>{label}</label>
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
      />
      {hasDescription ? (
        <p className="ds-text-field__description" id={descriptionId}>{description}</p>
      ) : null}
      {hasError ? (
        <p className="ds-text-field__error" id={errorId} role="alert">{errorMessage}</p>
      ) : null}
    </div>
  );
});
