import { useState } from 'react';
import { TextField, type TextFieldSize } from '@maxxuxx/react';
import './examples.css';

const SIZES: TextFieldSize[] = ['medium', 'large'];

export default function TextFieldExample() {
  const [value, setValue] = useState('김토큰');
  const [size, setSize] = useState<TextFieldSize>('medium');
  const [disabled, setDisabled] = useState(false);
  const [required, setRequired] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [showError, setShowError] = useState(false);

  return (
    <div className="component-demo" data-component-demo="text-field">
      <div className="component-demo__controls">
        <label className="component-demo__control">
          크기
          <select value={size} onChange={(event) => setSize(event.target.value as TextFieldSize)}>
            {SIZES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="component-demo__toggle">
          <input checked={disabled} type="checkbox" onChange={(event) => setDisabled(event.target.checked)} />
          disabled
        </label>
        <label className="component-demo__toggle">
          <input checked={required} type="checkbox" onChange={(event) => setRequired(event.target.checked)} />
          required
        </label>
        <label className="component-demo__toggle">
          <input checked={showDescription} type="checkbox" onChange={(event) => setShowDescription(event.target.checked)} />
          description
        </label>
        <label className="component-demo__toggle">
          <input checked={showError} type="checkbox" onChange={(event) => setShowError(event.target.checked)} />
          error
        </label>
      </div>

      <div className="component-demo__stage">
        <div className="component-demo__stack" style={{ width: '100%' }}>
          <TextField
            description={showDescription ? '주문자 확인에 사용합니다.' : undefined}
            disabled={disabled}
            errorMessage={showError ? '이름을 다시 확인하세요.' : undefined}
            label="이름"
            required={required}
            size={size}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <TextField description="기본 도움말" label="기본 상태" placeholder="내용 입력" size="large" />
          <TextField errorMessage="필수 항목입니다." label="오류 상태" />
          <TextField disabled label="비활성 상태" value="수정할 수 없음" readOnly />
        </div>
      </div>
    </div>
  );
}
