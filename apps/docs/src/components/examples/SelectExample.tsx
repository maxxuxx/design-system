import { useState } from 'react';
import { Select, type SelectSize } from '@maxxuxx/react';
import './examples.css';

const SIZES: SelectSize[] = ['medium', 'large'];

export default function SelectExample() {
  const [value, setValue] = useState('standard');
  const [size, setSize] = useState<SelectSize>('medium');
  const [disabled, setDisabled] = useState(false);
  const [required, setRequired] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [showError, setShowError] = useState(false);

  return (
    <div className="component-demo" data-component-demo="select">
      <div className="component-demo__controls">
        <label className="component-demo__control">
          크기
          <select value={size} onChange={(event) => setSize(event.target.value as SelectSize)}>
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

      <div className="component-demo__stage component-demo__stage--select">
        <div className="select-demo">
          <form className="select-demo__form">
            <Select
              description={showDescription ? '원하는 배송 방식을 선택하세요.' : undefined}
              disabled={disabled}
              errorMessage={showError ? '배송 방식을 선택해야 합니다.' : undefined}
              label="배송 방식"
              name="delivery-method"
              placeholder="선택하세요"
              required={required}
              size={size}
              value={value}
              onChange={(event) => setValue(event.target.value)}
            >
              <option value="standard">일반 배송</option>
              <option value="express">빠른 배송</option>
              <option value="pickup">방문 수령</option>
            </Select>
          </form>
          <Select defaultValue="express" description="native popup을 사용합니다." label="large default" size="large">
            <option value="standard">일반 배송</option>
            <option value="express">빠른 배송</option>
          </Select>
          <Select defaultValue="" errorMessage="국가를 선택하세요." label="medium error" placeholder="선택하세요">
            <optgroup label="아시아">
              <option value="kr">대한민국</option>
              <option value="jp">일본</option>
            </optgroup>
          </Select>
          <Select defaultValue="kr" disabled label="large disabled" size="large">
            <option value="kr">대한민국</option>
          </Select>
        </div>
      </div>
    </div>
  );
}
