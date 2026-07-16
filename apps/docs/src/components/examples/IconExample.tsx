import { useState } from 'react';
import { ICON_NAMES, Icon, type IconName, type IconSize } from '@hds/react';
import './examples.css';

const ICON_SIZES: IconSize[] = [16, 20, 24];

export default function IconExample() {
  const [name, setName] = useState<IconName>('search');
  const [size, setSize] = useState<IconSize>(24);
  const [labelled, setLabelled] = useState(true);

  return (
    <div className="component-demo" data-component-demo="icon">
      <div className="component-demo__controls">
        <label className="component-demo__control">
          이름
          <select value={name} onChange={(event) => setName(event.target.value as IconName)}>
            {ICON_NAMES.map((iconName) => (
              <option key={iconName} value={iconName}>{iconName}</option>
            ))}
          </select>
        </label>
        <label className="component-demo__control">
          크기
          <select value={size} onChange={(event) => setSize(Number(event.target.value) as IconSize)}>
            {ICON_SIZES.map((iconSize) => (
              <option key={iconSize} value={iconSize}>{iconSize}px</option>
            ))}
          </select>
        </label>
        <label className="component-demo__toggle">
          <input
            checked={labelled}
            type="checkbox"
            onChange={(event) => setLabelled(event.target.checked)}
          />
          단독 아이콘 이름 제공
        </label>
      </div>

      <div className="component-demo__stage">
        <Icon label={labelled ? `선택한 ${name} 아이콘` : undefined} name={name} size={size} />
        <div className="component-demo__grid">
          {ICON_NAMES.map((iconName) => (
            <div className="component-demo__item component-demo__item--stacked" key={iconName}>
              <Icon name={iconName} size={size} />
              <span className="component-demo__label">{iconName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
