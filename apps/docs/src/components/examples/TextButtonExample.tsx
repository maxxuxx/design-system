import { useState } from 'react';
import {
  TextButton,
  type TextButtonSize,
  type TextButtonTone,
  type TextButtonVariant,
} from '@hds/react';
import './examples.css';

type NativeElement = 'button' | 'anchor';

const ELEMENTS: NativeElement[] = ['button', 'anchor'];
const SIZES: TextButtonSize[] = ['small', 'medium', 'large'];
const VARIANTS: TextButtonVariant[] = ['clear', 'underline', 'arrow'];
const TONES: TextButtonTone[] = ['primary', 'neutral'];

export default function TextButtonExample() {
  const [element, setElement] = useState<NativeElement>('button');
  const [size, setSize] = useState<TextButtonSize>('medium');
  const [variant, setVariant] = useState<TextButtonVariant>('clear');
  const [tone, setTone] = useState<TextButtonTone>('primary');
  const [disabled, setDisabled] = useState(false);
  const [activationCount, setActivationCount] = useState(0);

  return (
    <div className="component-demo" data-component-demo="text-button">
      <div className="component-demo__controls">
        <label className="component-demo__control">
          요소
          <select
            value={element}
            onChange={(event) =>
              setElement(event.target.value as NativeElement)}
          >
            {ELEMENTS.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="component-demo__control">
          크기
          <select
            value={size}
            onChange={(event) =>
              setSize(event.target.value as TextButtonSize)}
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
              setVariant(event.target.value as TextButtonVariant)}
          >
            {VARIANTS.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="component-demo__control">
          톤
          <select
            value={tone}
            onChange={(event) =>
              setTone(event.target.value as TextButtonTone)}
          >
            {TONES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="component-demo__toggle">
          <input
            checked={element === 'button' && disabled}
            disabled={element === 'anchor'}
            type="checkbox"
            onChange={(event) => setDisabled(event.target.checked)}
          />
          disabled
        </label>
      </div>

      <div className="component-demo__stage component-demo__stage--text-button">
        <div className="text-button-demo">
          <div
            className="text-button-demo__interactive"
            data-text-button-sample="interactive"
          >
            {element === 'anchor' ? (
              <TextButton
                href="#text-button-demo-target"
                size={size}
                tone={tone}
                variant={variant}
              >
                상세 안내로 이동
              </TextButton>
            ) : (
              <TextButton
                disabled={disabled}
                size={size}
                tone={tone}
                variant={variant}
                onClick={() =>
                  setActivationCount((count) => count + 1)}
              >
                계속
              </TextButton>
            )}
            <span className="component-demo__label">
              활성화 횟수: {activationCount}
            </span>
          </div>

          <div className="text-button-demo__specimens">
            {SIZES.flatMap((buttonSize, sizeIndex) =>
              VARIANTS.map((buttonVariant, variantIndex) => {
                const buttonTone = TONES[(sizeIndex + variantIndex) % 2]!;
                return (
                  <div
                    className="text-button-demo__specimen"
                    key={`${buttonSize}-${buttonVariant}`}
                  >
                    <TextButton
                      size={buttonSize}
                      tone={buttonTone}
                      variant={buttonVariant}
                    >
                      {buttonVariant}
                    </TextButton>
                    <span className="component-demo__label">
                      {buttonSize} · {buttonTone}
                    </span>
                  </div>
                );
              }),
            )}
            <div className="text-button-demo__specimen">
              <TextButton
                data-text-button-sample="long-label"
                tone="neutral"
                variant="arrow"
              >
                환불정책과개인정보처리방침을확인하고다음단계로계속진행하기
              </TextButton>
              <span className="component-demo__label">긴 localized label</span>
            </div>
            <div className="text-button-demo__specimen">
              <TextButton disabled>disabled</TextButton>
              <span className="component-demo__label">native button state</span>
            </div>
            <div className="text-button-demo__specimen">
              <TextButton href="#text-button-demo-target" variant="underline">
                anchor link
              </TextButton>
              <span className="component-demo__label">native navigation</span>
            </div>
          </div>

          <span
            className="component-demo__label text-button-demo__target"
            id="text-button-demo-target"
          >
            anchor 이동 대상
          </span>
        </div>
      </div>
    </div>
  );
}
