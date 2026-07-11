import { useState } from 'react';
import {
  Button,
  Icon,
  type ButtonSize,
  type ButtonVariant,
  type ButtonWidth,
} from '@maxxuxx/react';
import './examples.css';

const SIZES: ButtonSize[] = ['small', 'medium', 'large'];
const VARIANTS: ButtonVariant[] = ['fill', 'weak', 'outline'];
const WIDTHS: ButtonWidth[] = ['hug', 'full'];

export default function ButtonExample() {
  const [size, setSize] = useState<ButtonSize>('medium');
  const [variant, setVariant] = useState<ButtonVariant>('fill');
  const [width, setWidth] = useState<ButtonWidth>('hug');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [showLeading, setShowLeading] = useState(true);
  const [showTrailing, setShowTrailing] = useState(false);
  const [activationCount, setActivationCount] = useState(0);

  return (
    <div className="component-demo" data-component-demo="button">
      <div className="component-demo__controls">
        <label className="component-demo__control">
          크기
          <select value={size} onChange={(event) => setSize(event.target.value as ButtonSize)}>
            {SIZES.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="component-demo__control">
          변형
          <select value={variant} onChange={(event) => setVariant(event.target.value as ButtonVariant)}>
            {VARIANTS.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="component-demo__control">
          너비
          <select value={width} onChange={(event) => setWidth(event.target.value as ButtonWidth)}>
            {WIDTHS.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="component-demo__toggle">
          <input checked={loading} type="checkbox" onChange={(event) => setLoading(event.target.checked)} />
          loading
        </label>
        <label className="component-demo__toggle">
          <input checked={disabled} type="checkbox" onChange={(event) => setDisabled(event.target.checked)} />
          disabled
        </label>
        <label className="component-demo__toggle">
          <input checked={showLeading} type="checkbox" onChange={(event) => setShowLeading(event.target.checked)} />
          leading icon
        </label>
        <label className="component-demo__toggle">
          <input checked={showTrailing} type="checkbox" onChange={(event) => setShowTrailing(event.target.checked)} />
          trailing icon
        </label>
      </div>

      <div className="component-demo__stage">
        <div className="component-demo__stack">
          <Button
            disabled={disabled}
            leadingIcon={showLeading ? <Icon name="search" size={20} /> : undefined}
            loading={loading}
            size={size}
            trailingIcon={showTrailing ? <Icon name="chevron-right" size={20} /> : undefined}
            variant={variant}
            width={width}
            onClick={() => setActivationCount((count) => count + 1)}
          >
            주문 확인
          </Button>
          <span className="component-demo__label">활성화 횟수: {activationCount}</span>
        </div>

        <div className="component-demo__grid">
          {SIZES.flatMap((buttonSize) =>
            VARIANTS.map((buttonVariant) => (
              <div className="component-demo__item component-demo__item--stacked" key={`${buttonSize}-${buttonVariant}`}>
                <Button size={buttonSize} variant={buttonVariant}>{buttonVariant}</Button>
                <span className="component-demo__label">{buttonSize}</span>
              </div>
            )),
          )}
          <div
            className="component-demo__item component-demo__item--stacked"
            data-button-sample="full-width"
          >
            <Button width="full">full width</Button>
            <span className="component-demo__label">full width</span>
          </div>
          <div className="component-demo__item component-demo__item--stacked">
            <Button disabled>disabled</Button>
            <span className="component-demo__label">disabled state</span>
          </div>
          <div className="component-demo__item component-demo__item--stacked">
            <Button loading>loading</Button>
            <span className="component-demo__label">loading state</span>
          </div>
        </div>
      </div>
    </div>
  );
}
