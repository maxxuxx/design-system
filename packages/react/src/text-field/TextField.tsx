import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
} from 'react';

import { mergeIds } from '../field/ids';

export type TextFieldSize = 'medium' | 'large';
export type TextFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'search'
  | 'tel'
  | 'url';

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type'
> {
  label: string;
  description?: string;
  errorMessage?: string;
  size?: TextFieldSize;
  type?: TextFieldType;
}

const TEXT_FIELD_TYPES: readonly TextFieldType[] = [
  'text',
  'email',
  'password',
  'search',
  'tel',
  'url',
];

function normalizeType(type: unknown): TextFieldType {
  if (typeof type !== 'string') {
    return 'text';
  }

  return TEXT_FIELD_TYPES.includes(type as TextFieldType)
    ? (type as TextFieldType)
    : 'text';
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
    type = 'text',
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
  const inputType = normalizeType(type);

  return (
    <div className="ds-text-field" data-state={state} data-size={size}>
      <label className="ds-text-field__label" htmlFor={inputId}>
        {label}
      </label>
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
        type={inputType}
      />
      {hasDescription ? (
        <p className="ds-text-field__description" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {hasError ? (
        <p className="ds-text-field__error" id={errorId} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
});
