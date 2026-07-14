import {
  forwardRef,
  useId,
  type TextareaHTMLAttributes,
} from 'react';

import { mergeIds } from '../field/ids';

export type TextareaSize = 'medium' | 'large';
export type TextareaResize = 'vertical' | 'none';

export interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'children'
> {
  label: string;
  description?: string;
  errorMessage?: string;
  size?: TextareaSize;
  resize?: TextareaResize;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
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
    resize = 'vertical',
    rows = 4,
    size = 'medium',
    ...textareaProps
  },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? `hds-textarea-${generatedId}`;
  const hasDescription = typeof description === 'string' && description.trim().length > 0;
  const hasError = errorMessage !== undefined;
  const descriptionId = hasDescription ? `${textareaId}-description` : undefined;
  const errorId = hasError ? `${textareaId}-error` : undefined;
  const describedBy = mergeIds(descriptionId, errorId, ariaDescribedBy);
  const state = disabled ? 'disabled' : hasError ? 'error' : 'default';
  const controlClasses = ['hds-textarea__control', className].filter(Boolean).join(' ');

  return (
    <div className="hds-textarea" data-size={size} data-state={state}>
      <label className="hds-textarea__label" htmlFor={textareaId}>
        {label}
      </label>
      <textarea
        {...textareaProps}
        ref={ref}
        aria-describedby={describedBy}
        aria-errormessage={hasError ? errorId : ariaErrorMessage}
        aria-invalid={hasError ? true : ariaInvalid}
        className={controlClasses}
        data-resize={resize}
        data-size={size}
        data-state={state}
        disabled={disabled}
        id={textareaId}
        rows={rows}
      />
      {hasDescription ? (
        <p className="hds-textarea__description" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {hasError ? (
        <p className="hds-textarea__error" id={errorId} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
});
