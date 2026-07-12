import { useState } from 'react';
import { Icon, ListRow, Switch } from '@maxxuxx/react';
import './examples.css';

const LONG_COPY = 'ListRowLongUnbrokenLocalizedCopyForResponsiveVerification'
  .repeat(8);

export default function ListRowExample() {
  const [activationCount, setActivationCount] = useState(0);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="component-demo" data-component-demo="list-row">
      <div className="component-demo__stage component-demo__stage--list-row">
        <div className="list-row-demo">
          <p aria-live="polite" className="list-row-demo__status">
            버튼 활성화 {activationCount}회 · 배송 알림{' '}
            {notifications ? '켜짐' : '꺼짐'}
          </p>

          <div
            aria-label="ListRow native branch specimen"
            className="list-row-demo__group"
          >
            <ListRow
              data-list-row-sample="static"
              description="오후 8시 이후 주문 상태를 알려드려요."
              divider="indented"
              left={<Icon name="info" size={24} />}
              right={(
                <Switch
                  checked={notifications}
                  label="배송 알림"
                  onChange={(event) => setNotifications(event.target.checked)}
                />
              )}
              title="알림 설정"
            />
            <ListRow
              data-list-row-sample="button"
              description="등록된 카드와 계좌를 확인합니다."
              divider="indented"
              left={<Icon name="check" size={24} />}
              title="결제 수단 변경"
              withArrow
              onClick={() => setActivationCount((count) => count + 1)}
            />
            <ListRow
              data-list-row-sample="link"
              description="native anchor로 같은 문서의 설명으로 이동합니다."
              divider="indented"
              href="#list-row-demo-target"
              title="배송 정책 보기"
              withArrow
            />
            <ListRow
              data-list-row-sample="disabled"
              disabled
              right="준비 중"
              title="정기 배송 변경"
              onClick={() => setActivationCount((count) => count + 1)}
            />
          </div>

          <div className="list-row-demo__group">
            <ListRow
              data-list-row-sample="long-copy"
              description={LONG_COPY}
              divider="indented"
              left={<Icon name="info" size={24} />}
              title={LONG_COPY}
            />
          </div>

          <p
            className="list-row-demo__target"
            id="list-row-demo-target"
            tabIndex={-1}
          >
            링크 대상: ListRow는 native anchor의 실제 href를 유지합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
