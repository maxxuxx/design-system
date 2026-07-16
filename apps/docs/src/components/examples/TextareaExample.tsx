import { useState } from 'react';
import {
  Textarea,
  type TextareaResize,
  type TextareaSize,
} from '@hds/react';
import './examples.css';

const SIZES: TextareaSize[] = ['medium', 'large'];
const RESIZE_MODES: TextareaResize[] = ['vertical', 'none'];

export default function TextareaExample() {
  const [value, setValue] = useState('');
  const [size, setSize] = useState<TextareaSize>('medium');
  const [resize, setResize] = useState<TextareaResize>('vertical');
  const [disabled, setDisabled] = useState(false);
  const [required, setRequired] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [showError, setShowError] = useState(false);

  return (
    <div className="component-demo" data-component-demo="textarea">
      <div className="component-demo__controls">
        <label className="component-demo__control">
          크기
          <select value={size} onChange={(event) => setSize(event.target.value as TextareaSize)}>
            {SIZES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="component-demo__control">
          크기 조절
          <select
            value={resize}
            onChange={(event) => setResize(event.target.value as TextareaResize)}
          >
            {RESIZE_MODES.map((item) => <option key={item}>{item}</option>)}
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

      <div className="component-demo__stage component-demo__stage--textarea">
        <div className="textarea-demo">
          <form className="textarea-demo__form">
            <Textarea
              description={showDescription ? '배송 담당자에게 전달할 내용을 입력하세요.' : undefined}
              disabled={disabled}
              errorMessage={showError ? '배송 메모를 다시 확인하세요.' : undefined}
              label="배송 메모"
              maxLength={80}
              name="delivery-note"
              required={required}
              resize={resize}
              rows={4}
              size={size}
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </form>
          <Textarea
            defaultValue="여러 줄 자유 입력을 위한 large 예시입니다."
            description="세로 방향으로만 크기를 조절할 수 있습니다."
            label="large vertical"
            resize="vertical"
            size="large"
          />
          <Textarea
            errorMessage="내용을 입력하세요."
            label="medium error"
            resize="none"
            size="medium"
          />
          <Textarea
            defaultValue="수정할 수 없는 내용"
            disabled
            label="large disabled"
            resize="none"
            size="large"
          />
        </div>
      </div>
    </div>
  );
}
