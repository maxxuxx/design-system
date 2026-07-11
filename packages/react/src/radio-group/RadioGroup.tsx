import {
  forwardRef,
  useId,
  type ChangeEventHandler,
  type FieldsetHTMLAttributes,
} from 'react';

import { mergeIds } from '../field/ids';

export type RadioGroupSize = 'small' | 'medium';

export interface RadioGroupOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps extends Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'children' | 'onChange'
> {
  legend: string;
  name: string;
  options: readonly RadioGroupOption[];
  description?: string;
  errorMessage?: string;
  size?: RadioGroupSize;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  function RadioGroup(
    {
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
      'aria-invalid': ariaInvalid,
      className,
      defaultValue,
      description,
      disabled = false,
      errorMessage,
      id,
      legend,
      name,
      onChange,
      options,
      required = false,
      size = 'medium',
      value,
      ...fieldsetProps
    },
    ref,
  ) {
    const generatedId = useId();
    const groupId = id ?? `ds-radio-group-${generatedId}`;
    const hasDescription = typeof description === 'string'
      && description.trim().length > 0;
    const hasError = errorMessage !== undefined;
    const descriptionId = hasDescription ? `${groupId}-description` : undefined;
    const errorId = hasError ? `${groupId}-error` : undefined;
    const describedBy = mergeIds(descriptionId, errorId, ariaDescribedBy);
    const state = disabled ? 'disabled' : hasError ? 'error' : 'default';
    const fieldsetClasses = ['ds-radio-group', className].filter(Boolean).join(' ');
    const firstEnabledOptionIndex = options.findIndex((option) => !option.disabled);

    return (
      <fieldset
        {...fieldsetProps}
        ref={ref}
        aria-describedby={describedBy}
        aria-errormessage={hasError ? errorId : ariaErrorMessage}
        aria-invalid={hasError ? true : ariaInvalid}
        className={fieldsetClasses}
        data-size={size}
        data-state={state}
        disabled={disabled}
        id={groupId}
      >
        <legend className="ds-radio-group__legend">{legend}</legend>
        {hasDescription ? (
          <p className="ds-radio-group__description" id={descriptionId}>
            {description}
          </p>
        ) : null}
        <div className="ds-radio-group__options">
          {options.map((option, index) => {
            const optionId = `${groupId}-option-${index}`;
            const optionLabelId = `${optionId}-label`;
            const hasOptionDescription = typeof option.description === 'string'
              && option.description.trim().length > 0;
            const optionDescriptionId = hasOptionDescription
              ? `${optionId}-description`
              : undefined;
            const optionDescribedBy = mergeIds(
              optionDescriptionId,
              describedBy,
            );
            const optionState = disabled || option.disabled
              ? 'disabled'
              : hasError ? 'error' : 'default';
            const selectionProps = value === undefined
              ? { defaultChecked: defaultValue === option.value }
              : { checked: value === option.value };

            return (
              <label
                className="ds-radio-group__option"
                data-disabled={disabled || option.disabled ? 'true' : undefined}
                htmlFor={optionId}
                key={option.value}
              >
                <input
                  {...selectionProps}
                  aria-describedby={optionDescribedBy}
                  aria-errormessage={hasError ? errorId : ariaErrorMessage}
                  aria-invalid={hasError ? true : ariaInvalid}
                  aria-labelledby={optionLabelId}
                  className="ds-radio-group__input"
                  data-size={size}
                  data-state={optionState}
                  disabled={option.disabled}
                  id={optionId}
                  name={name}
                  onChange={onChange}
                  required={required && index === firstEnabledOptionIndex}
                  type="radio"
                  value={option.value}
                />
                <span className="ds-radio-group__option-copy">
                  <span className="ds-radio-group__option-label" id={optionLabelId}>
                    {option.label}
                  </span>
                  {hasOptionDescription ? (
                    <span
                      className="ds-radio-group__option-description"
                      id={optionDescriptionId}
                    >
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
        {hasError ? (
          <p className="ds-radio-group__error" id={errorId} role="alert">
            {errorMessage}
          </p>
        ) : null}
      </fieldset>
    );
  },
);
