import { useState } from 'react';
import { SearchField } from '@hds/react';
import './examples.css';

const FIXED_RESULTS = Array.from(
  { length: 8 },
  (_, index) => `고정 검색 결과 ${index + 1}`,
);

export default function SearchFieldExample() {
  const [clearCount, setClearCount] = useState(0);
  const [value, setValue] = useState('초기 검색어');

  return (
    <div className="component-demo" data-component-demo="search-field">
      <div className="component-demo__stage component-demo__stage--search-field">
        <form
          className="search-field-demo__form"
          data-search-field-form
          onSubmit={(event) => event.preventDefault()}
        >
          <span className="component-demo__label">Interactive · controlled</span>
          <SearchField
            autoComplete="off"
            clearLabel="상품 검색어 지우기"
            label="상품 검색"
            name="product-query"
            placeholder="상품명 또는 브랜드"
            value={value}
            onClear={() => setClearCount((count) => count + 1)}
            onValueChange={setValue}
          />
          <p aria-live="polite" className="search-field-demo__status">
            clear {clearCount}회 · value &quot;{value}&quot;
          </p>
        </form>

        <div
          aria-label="SearchField 상태 specimen"
          className="search-field-demo__specimens"
        >
          <article className="search-field-demo__specimen" data-search-field-sample="filled">
            <span className="component-demo__label">Filled · uncontrolled</span>
            <SearchField
              clearLabel="최근 검색어 지우기"
              defaultValue="최근 검색어"
              label="최근 검색"
            />
          </article>
          <article className="search-field-demo__specimen" data-search-field-sample="readonly">
            <span className="component-demo__label">ReadOnly</span>
            <SearchField
              clearLabel="읽기 전용 검색어 지우기"
              defaultValue="읽기 전용 결과"
              label="읽기 전용 검색"
              readOnly
            />
          </article>
          <article className="search-field-demo__specimen" data-search-field-sample="disabled">
            <span className="component-demo__label">Disabled</span>
            <SearchField
              clearLabel="비활성 검색어 지우기"
              defaultValue="사용할 수 없음"
              disabled
              label="비활성 검색"
            />
          </article>
        </div>

        <article
          className="search-field-demo__fixed-viewport"
          data-search-field-fixed-viewport
        >
          <SearchField
            className="search-field-demo__fixed-field"
            clearLabel="고정 검색어 지우기"
            defaultValue="고정 검색"
            fixed
            label="고정 검색"
          />
          <div
            aria-label="고정 검색 결과"
            className="search-field-demo__fixed-scroll"
            data-search-field-fixed-scroll
            tabIndex={0}
          >
            {FIXED_RESULTS.map((result) => (
              <div className="search-field-demo__result" key={result}>
                {result}
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
