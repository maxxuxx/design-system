import { useState } from 'react';
import { Checkbox, type CheckboxSize } from '@maxxuxx/react';

import './examples.css';

const SIZES: CheckboxSize[] = ['small', 'medium'];

export default function CheckboxExample() {
  const [checked, setChecked] = useState(false);
  const [size, setSize] = useState<CheckboxSize>('medium');
  const [indeterminate, setIndeterminate] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [showError, setShowError] = useState(false);

  return (
    <div
      className="component-demo"
      data-component-demo="checkbox"
      data-value={indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked'}
    >
      <div className="component-demo__controls">
        <label className="component-demo__control">
          값
          <select
            value={checked ? 'checked' : 'unchecked'}
            onChange={(event) => {
              setChecked(event.target.value === 'checked');
              setIndeterminate(false);
            }}
          >
            <option value="unchecked">unchecked</option>
            <option value="checked">checked</option>
          </select>
        </label>
        <label className="component-demo__control">
          크기
          <select
            value={size}
            onChange={(event) => setSize(event.target.value as CheckboxSize)}
          >
            {SIZES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="component-demo__toggle">
          <input
            checked={indeterminate}
            type="checkbox"
            onChange={(event) => setIndeterminate(event.target.checked)}
          />
          indeterminate
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

      <div className="component-demo__stage component-demo__stage--checkbox">
        <div className="checkbox-demo">
          <div className="checkbox-demo__interactive">
            <span className="component-demo__label">대화형 예제</span>
            <Checkbox
              checked={checked}
              description="출시 소식과 사용 팁을 보내 드립니다."
              disabled={disabled}
              errorMessage={showError ? '수신 여부를 확인하세요.' : undefined}
              indeterminate={indeterminate}
              label="제품 업데이트 받기"
              size={size}
              onChange={(event) => {
                setChecked(event.target.checked);
                setIndeterminate(false);
              }}
            />
          </div>

          <div className="checkbox-demo__specimens" aria-label="Checkbox 정적 상태">
            <div className="checkbox-demo__specimen">
              <span className="component-demo__label">small · unchecked</span>
              <Checkbox label="선택 안 됨" size="small" />
            </div>
            <div className="checkbox-demo__specimen">
              <span className="component-demo__label">small · checked</span>
              <Checkbox defaultChecked label="선택됨" size="small" />
            </div>
            <div className="checkbox-demo__specimen">
              <span className="component-demo__label">medium · indeterminate</span>
              <Checkbox indeterminate label="일부 선택" />
            </div>
            <div className="checkbox-demo__specimen">
              <span className="component-demo__label">medium · error</span>
              <Checkbox errorMessage="필수 선택입니다." label="오류 상태" />
            </div>
            <div className="checkbox-demo__specimen">
              <span className="component-demo__label">medium · disabled</span>
              <Checkbox defaultChecked disabled label="비활성 상태" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
