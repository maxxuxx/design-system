import { useState } from 'react';
import {
  Button,
  Icon,
  ToastProvider,
  type ToastOptions,
  useToast,
} from '@hds/react';
import './examples.css';

const LONG_MESSAGE =
  'ToastLongUnbrokenLocalizedCopyForThreeHundredTwentyPixelContainment'.repeat(6);

function ToastDemoControls() {
  const toast = useToast();
  const [lastEvent, setLastEvent] = useState('없음');

  const showOnly = (options: ToastOptions) => {
    toast.clear();
    toast.show(options);
  };

  const showFifo = () => {
    toast.clear();
    toast.show({
      action: { label: '다음 알림', onPress: () => setLastEvent('FIFO 첫 번째 완료') },
      duration: 0,
      icon: 'info',
      message: 'FIFO 첫 번째',
    });
    toast.show({
      action: { label: '다음 알림', onPress: () => setLastEvent('FIFO 두 번째 완료') },
      duration: 0,
      icon: 'check',
      message: 'FIFO 두 번째',
      tone: 'success',
    });
    toast.show({
      duration: 0,
      message: 'FIFO 세 번째',
      tone: 'danger',
    });
  };

  return (
    <div className="component-demo" data-component-demo="toast">
      <div className="component-demo__stage component-demo__stage--toast">
        <div className="toast-demo">
          <p aria-live="polite" className="toast-demo__status">
            최근 이벤트: {lastEvent}
          </p>

          <div aria-label="Toast interactive controls" className="toast-demo__controls">
            <Button
              data-toast-trigger="neutral"
              variant="outline"
              onClick={() => showOnly({ duration: 0, icon: 'info', message: '중립 알림입니다.' })}
            >
              중립 알림
            </Button>
            <Button
              data-toast-trigger="success"
              variant="outline"
              onClick={() => showOnly({ duration: 0, icon: 'check', message: '저장했습니다.', tone: 'success' })}
            >
              성공 알림
            </Button>
            <Button
              data-toast-trigger="danger"
              variant="outline"
              onClick={() => showOnly({ duration: 0, icon: 'info', message: '처리하지 못했습니다.', tone: 'danger' })}
            >
              위험 알림
            </Button>
            <Button data-toast-trigger="fifo" variant="outline" onClick={showFifo}>
              FIFO 3개 알림
            </Button>
            <Button
              data-toast-trigger="action"
              variant="outline"
              onClick={() => showOnly({
                action: {
                  label: '되돌리기',
                  onPress: () => setLastEvent('되돌리기 실행'),
                },
                duration: 0,
                icon: 'info',
                message: '작업을 실행했습니다.',
              })}
            >
              실행 취소 알림
            </Button>
            <Button
              data-toast-trigger="top"
              variant="outline"
              onClick={() => showOnly({
                duration: 0,
                icon: 'info',
                message: '상단에서 확인하세요.',
                position: 'top',
              })}
            >
              상단 알림
            </Button>
            <Button
              data-toast-trigger="pause"
              variant="outline"
              onClick={() => showOnly({
                duration: 800,
                icon: 'info',
                message: 'pointer를 올리면 남은 시간이 멈춥니다.',
              })}
            >
              일시정지 확인
            </Button>
            <Button
              data-toast-trigger="long-copy"
              variant="outline"
              onClick={() => showOnly({ duration: 0, message: LONG_MESSAGE })}
            >
              긴 메시지 알림
            </Button>
            <Button data-toast-clear variant="weak" onClick={toast.clear}>
              모두 지우기
            </Button>
          </div>

          <div className="toast-demo__specimens">
            <div
              aria-hidden="true"
              className="hds-toast toast-demo__specimen"
              data-position="bottom"
              data-tone="neutral"
              data-toast-specimen="neutral"
            >
              <span className="hds-toast__icon"><Icon name="info" size={20} /></span>
              <span className="hds-toast__message">중립 · action hidden</span>
            </div>
            <div
              aria-hidden="true"
              className="hds-toast toast-demo__specimen"
              data-position="bottom"
              data-tone="success"
              data-toast-specimen="success"
            >
              <span className="hds-toast__icon"><Icon name="check" size={20} /></span>
              <span className="hds-toast__message">성공 · action visible</span>
              <span className="toast-demo__specimen-action">되돌리기</span>
            </div>
            <div
              aria-hidden="true"
              className="hds-toast toast-demo__specimen"
              data-position="bottom"
              data-tone="danger"
              data-toast-specimen="danger"
            >
              <span className="hds-toast__icon"><Icon name="info" size={20} /></span>
              <span className="hds-toast__message">위험 · assertive alert</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ToastExample() {
  return (
    <ToastProvider>
      <ToastDemoControls />
    </ToastProvider>
  );
}
