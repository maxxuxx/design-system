import { useState } from 'react';
import {
  RadioGroup,
  type RadioGroupOption,
  type RadioGroupSize,
} from '@maxxuxx/react';

import './examples.css';

const SIZES: RadioGroupSize[] = ['small', 'medium'];

const DELIVERY_OPTIONS = [
  { value: 'standard', label: '일반 배송', description: '영업일 기준 3일 이내' },
  { value: 'express', label: '빠른 배송', description: '다음 영업일 도착' },
  { value: 'pickup', label: '매장 수령', description: '준비 완료 후 방문', disabled: true },
] as const satisfies readonly RadioGroupOption[];

const CONTACT_OPTIONS = [
  { value: 'email', label: '이메일' },
  { value: 'sms', label: '문자 메시지' },
  { value: 'none', label: '연락하지 않음' },
] as const satisfies readonly RadioGroupOption[];

export default function RadioGroupExample() {
  const [value, setValue] = useState('standard');
  const [size, setSize] = useState<RadioGroupSize>('medium');
  const [disabled, setDisabled] = useState(false);
  const [required, setRequired] = useState(false);
  const [showError, setShowError] = useState(false);

  return (
    <div
      className="component-demo"
      data-component-demo="radio-group"
      data-value={value}
    >
      <div className="component-demo__controls">
        <label className="component-demo__control">
          선택
          <select value={value} onChange={(event) => setValue(event.target.value)}>
            <option value="standard">standard</option>
            <option value="express">express</option>
          </select>
        </label>
        <label className="component-demo__control">
          크기
          <select
            value={size}
            onChange={(event) => setSize(event.target.value as RadioGroupSize)}
          >
            {SIZES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="component-demo__toggle">
          <input
            checked={required}
            type="checkbox"
            onChange={(event) => setRequired(event.target.checked)}
          />
          required
        </label>
        <label className="component-demo__toggle">
          <input
            checked={disabled}
            type="checkbox"
            onChange={(event) => setDisabled(event.target.checked)}
          />
          disabled
        </label>
        <label className="component-demo__toggle">
          <input
            checked={showError}
            type="checkbox"
            onChange={(event) => setShowError(event.target.checked)}
          />
          error
        </label>
      </div>

      <div className="component-demo__stage component-demo__stage--radio-group">
        <div className="radio-group-demo">
          <form className="radio-group-demo__interactive">
            <span className="component-demo__label">controlled 예제</span>
            <RadioGroup
              description="주문에 적용할 배송 방법입니다."
              disabled={disabled}
              errorMessage={showError ? '배송 방법을 선택하세요.' : undefined}
              legend="배송 방법"
              name="delivery-demo"
              options={DELIVERY_OPTIONS}
              required={required}
              size={size}
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </form>

          <div className="radio-group-demo__specimens" aria-label="RadioGroup 정적 상태">
            <div className="radio-group-demo__specimen">
              <span className="component-demo__label">small · none</span>
              <RadioGroup
                legend="연락 방법"
                name="contact-none"
                options={CONTACT_OPTIONS}
                size="small"
              />
            </div>
            <div className="radio-group-demo__specimen">
              <span className="component-demo__label">medium · first</span>
              <RadioGroup
                defaultValue="email"
                legend="연락 방법"
                name="contact-first"
                options={CONTACT_OPTIONS}
              />
            </div>
            <div className="radio-group-demo__specimen">
              <span className="component-demo__label">medium · error</span>
              <RadioGroup
                defaultValue="sms"
                errorMessage="연락 방법을 확인하세요."
                legend="연락 방법"
                name="contact-error"
                options={CONTACT_OPTIONS}
              />
            </div>
            <div className="radio-group-demo__specimen">
              <span className="component-demo__label">medium · disabled</span>
              <RadioGroup
                defaultValue="email"
                disabled
                legend="연락 방법"
                name="contact-disabled"
                options={CONTACT_OPTIONS}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
