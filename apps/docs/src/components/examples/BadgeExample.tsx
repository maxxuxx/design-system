import { useState } from 'react';
import {
  Badge,
  type BadgeSize,
  type BadgeTone,
  type BadgeVariant,
} from '@maxxuxx/react';
import './examples.css';

const SIZES: BadgeSize[] = ['small', 'medium'];
const VARIANTS: BadgeVariant[] = ['soft', 'solid'];
const TONES: BadgeTone[] = ['neutral', 'primary', 'success', 'danger'];

export default function BadgeExample() {
  const [size, setSize] = useState<BadgeSize>('medium');
  const [variant, setVariant] = useState<BadgeVariant>('soft');
  const [tone, setTone] = useState<BadgeTone>('neutral');

  return (
    <div className="component-demo" data-component-demo="badge">
      <div className="component-demo__controls">
        <label className="component-demo__control">
          크기
          <select value={size} onChange={(event) => setSize(event.target.value as BadgeSize)}>
            {SIZES.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="component-demo__control">
          변형
          <select value={variant} onChange={(event) => setVariant(event.target.value as BadgeVariant)}>
            {VARIANTS.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="component-demo__control">
          톤
          <select value={tone} onChange={(event) => setTone(event.target.value as BadgeTone)}>
            {TONES.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      </div>

      <div className="component-demo__stage">
        <Badge size={size} tone={tone} variant={variant}>선택한 상태</Badge>
        <div className="component-demo__grid">
          {SIZES.flatMap((badgeSize) =>
            VARIANTS.flatMap((badgeVariant) =>
              TONES.map((badgeTone) => (
                <div
                  className="component-demo__item component-demo__item--stacked"
                  key={`${badgeSize}-${badgeVariant}-${badgeTone}`}
                >
                  <Badge size={badgeSize} tone={badgeTone} variant={badgeVariant}>상태</Badge>
                  <span className="component-demo__label">
                    {badgeSize} · {badgeVariant} · {badgeTone}
                  </span>
                </div>
              )),
            ),
          )}
        </div>
      </div>
    </div>
  );
}
