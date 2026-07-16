import { useState } from 'react';
import { Switch, type SwitchSize } from '@hds/react';

import './examples.css';

const SIZES: SwitchSize[] = ['small', 'medium'];

export default function SwitchExample() {
  const [checked, setChecked] = useState(false);
  const [size, setSize] = useState<SwitchSize>('medium');
  const [disabled, setDisabled] = useState(false);
  const [showError, setShowError] = useState(false);

  return (
    <div
      className="component-demo"
      data-component-demo="switch"
      data-value={checked ? 'on' : 'off'}
    >
      <div className="component-demo__controls">
        <label className="component-demo__control">
          값
          <select
            value={checked ? 'on' : 'off'}
            onChange={(event) => setChecked(event.target.value === 'on')}
          >
            <option value="off">off</option>
            <option value="on">on</option>
          </select>
        </label>
        <label className="component-demo__control">
          크기
          <select
            value={size}
            onChange={(event) => setSize(event.target.value as SwitchSize)}
          >
            {SIZES.map((item) => <option key={item}>{item}</option>)}
          </select>
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

      <div className="component-demo__stage component-demo__stage--switch">
        <div className="switch-demo">
          <form className="switch-demo__interactive">
            <span className="component-demo__label">controlled 예제</span>
            <Switch
              checked={checked}
              description="변경 사항을 자동으로 저장합니다."
              disabled={disabled}
              errorMessage={showError ? '자동 저장 설정을 확인하세요.' : undefined}
              label="자동 저장"
              name="autosave-demo"
              size={size}
              value="enabled"
              onChange={(event) => setChecked(event.target.checked)}
            />
          </form>

          <div className="switch-demo__specimens" aria-label="Switch 정적 상태">
            <div className="switch-demo__specimen">
              <span className="component-demo__label">small · off</span>
              <Switch label="알림 끄기" size="small" />
            </div>
            <div className="switch-demo__specimen">
              <span className="component-demo__label">small · on</span>
              <Switch defaultChecked label="알림 켜기" size="small" />
            </div>
            <div className="switch-demo__specimen">
              <span className="component-demo__label">medium · error</span>
              <Switch defaultChecked errorMessage="저장하지 못했습니다." label="오류 상태" />
            </div>
            <div className="switch-demo__specimen">
              <span className="component-demo__label">medium · disabled</span>
              <Switch defaultChecked disabled label="비활성 상태" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
