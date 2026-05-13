import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import type { StaffSession } from '../types';
import { useAppStore } from '../store';
import { placeLabel } from '../utils';
import { ErrorNotice } from './ErrorNotice';
import { ItemList } from './ItemList';

export function RequestDetailScreen({
  orderId,
  session,
  onBack,
  onGoToPickupWork,
}: {
  orderId: string;
  session: StaffSession;
  onBack: () => void;
  onGoToPickupWork: (orderId: string) => void;
}) {
  const { runId } = useAppStore();

  const requestQuery = useQuery({
    queryKey: ['pickup-request-detail', orderId, session.accessToken],
    queryFn: () => api.getPickupRequestDetail(session.accessToken, orderId),
  });

  const request = requestQuery.data;
  const isPickedUp = request?.status === 'PICK_UP' || request?.status === 'PROCESSING';

  return (
    <>
      <button className="back-button" style={{ marginBottom: 16 }} type="button" onClick={onBack}>
        ← 목록으로
      </button>

      {requestQuery.isLoading ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="skeleton" style={{ height: 120 }} />
          <div className="skeleton" style={{ height: 200 }} />
        </div>
      ) : requestQuery.error ? (
        <ErrorNotice error={requestQuery.error} />
      ) : request ? (
        <>
          <div className="detail-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
              <h2 style={{ color: 'var(--ink-deep)', fontSize: 20, fontWeight: 700, margin: 0 }}>
                주문 정보
              </h2>
              <div style={{ display: 'flex', gap: 6 }}>
                {request.secondHandPickupRequested ? (
                  <span className="badge badge-attention">중고 수거</span>
                ) : null}
                {isPickedUp ? (
                  <span className="badge badge-success">수거 완료</span>
                ) : (
                  <span className="badge badge-info">수거 대기</span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <div className="detail-row">
                <span className="detail-label">주소</span>
                <span className="detail-value">{request.address ?? '—'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">연락처</span>
                <span className="detail-value">{request.phoneNumber ?? '—'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">수거 장소</span>
                <span className="detail-value">
                  {placeLabel(request.pickupDeliveryPlaceCode, request.pickupDeliveryPlaceText)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">배송 방식</span>
                <span className="detail-value">{request.fulfillmentOptionCode ?? '—'}</span>
              </div>
            </div>

            {request.secondHandPickupRequested ? (
              <div
                style={{
                  background: 'rgba(242, 169, 24, 0.1)',
                  border: '1px solid rgba(242, 169, 24, 0.3)',
                  borderRadius: 12,
                  color: '#8a5c00',
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '10px 14px',
                }}
              >
                ⚠️ 이 주문은 중고 품목 수거가 포함되어 있습니다.
              </div>
            ) : null}
          </div>

          <div className="detail-section" style={{ marginTop: 12 }}>
            <h2 style={{ color: 'var(--ink-deep)', fontSize: 16, fontWeight: 700, margin: 0 }}>
              아이템 목록 ({request.items.length}개)
            </h2>
            <ItemList items={request.items} />
          </div>
        </>
      ) : null}

      <div className="bottom-bar">
        <button className="secondary-button" type="button" onClick={onBack}>
          목록으로
        </button>
        {!isPickedUp && runId ? (
          <button
            className="primary-button"
            disabled={!request}
            type="button"
            onClick={() => onGoToPickupWork(orderId)}
          >
            현장 작업 시작
          </button>
        ) : null}
        {!runId ? (
          <button className="primary-button" disabled type="button">
            런 먼저 시작하세요
          </button>
        ) : null}
      </div>
    </>
  );
}
