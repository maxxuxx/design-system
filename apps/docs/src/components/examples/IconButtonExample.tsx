import { useState, type SyntheticEvent } from 'react';
import {
  ICON_NAMES,
  IconButton,
  type IconButtonSize,
  type IconButtonVariant,
  type IconName,
} from '@maxxuxx/react';
import './examples.css';

const SIZES: IconButtonSize[] = ['small', 'medium', 'large'];
const VARIANTS: IconButtonVariant[] = ['clear', 'fill', 'outline'];
const LABELS: Record<IconName, string> = {
  check: '완료',
  'chevron-right': '다음',
  close: '닫기',
  info: '정보',
  search: '검색 열기',
};

export default function IconButtonExample() {
  const [name, setName] = useState<IconName>('search');
  const [size, setSize] = useState<IconButtonSize>('medium');
  const [variant, setVariant] = useState<IconButtonVariant>('clear');
  const [disabled, setDisabled] = useState(false);
  const [activationCount, setActivationCount] = useState(0);
  const [submitCount, setSubmitCount] = useState(0);

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitCount((count) => count + 1);
  }

  return (
    <div className="component-demo" data-component-demo="icon-button">
      <div className="component-demo__controls">
        <label className="component-demo__control">
          아이콘
          <select
            value={name}
            onChange={(event) => setName(event.target.value as IconName)}
          >
            {ICON_NAMES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="component-demo__control">
          크기
          <select
            value={size}
            onChange={(event) =>
              setSize(event.target.value as IconButtonSize)}
          >
            {SIZES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="component-demo__control">
          변형
          <select
            value={variant}
            onChange={(event) =>
              setVariant(event.target.value as IconButtonVariant)}
          >
            {VARIANTS.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
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
      </div>

      <div className="component-demo__stage component-demo__stage--icon-button">
        <div className="icon-button-demo">
          <form
            className="icon-button-demo__interactive"
            onSubmit={handleSubmit}
          >
            <IconButton
              data-icon-button-sample="interactive"
              disabled={disabled}
              label={LABELS[name]}
              name={name}
              size={size}
              variant={variant}
              onClick={() =>
                setActivationCount((count) => count + 1)}
            />
            <IconButton
              data-icon-button-sample="form-submit"
              label="명시적으로 폼 제출"
              name="check"
              type="submit"
              variant="fill"
            />
            <span className="component-demo__label">
              활성화 횟수: {activationCount}
            </span>
            <span className="component-demo__label">
              폼 제출 횟수: {submitCount}
            </span>
          </form>

          <div className="icon-button-demo__specimens">
            {ICON_NAMES.map((iconName) => (
              <div className="icon-button-demo__specimen" key={iconName}>
                <IconButton
                  data-icon-button-name={iconName}
                  data-icon-button-specimen
                  label={LABELS[iconName]}
                  name={iconName}
                />
                <span className="component-demo__label">{iconName}</span>
              </div>
            ))}

            {SIZES.flatMap((buttonSize, sizeIndex) =>
              VARIANTS.map((buttonVariant, variantIndex) => {
                const iconName = ICON_NAMES[
                  (sizeIndex * VARIANTS.length + variantIndex)
                    % ICON_NAMES.length
                ]!;
                return (
                  <div
                    className="icon-button-demo__specimen"
                    key={`${buttonSize}-${buttonVariant}`}
                  >
                    <IconButton
                      data-icon-button-name={iconName}
                      data-icon-button-specimen
                      label={`${buttonSize} ${buttonVariant}`}
                      name={iconName}
                      size={buttonSize}
                      variant={buttonVariant}
                    />
                    <span className="component-demo__label">
                      {buttonSize} · {buttonVariant}
                    </span>
                  </div>
                );
              }),
            )}

            <div className="icon-button-demo__specimen">
              <IconButton
                data-icon-button-name="close"
                data-icon-button-specimen
                disabled
                label="비활성 닫기"
                name="close"
                variant="outline"
              />
              <span className="component-demo__label">disabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
