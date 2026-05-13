import type { PickupRequestSummary } from '../types';
import { formatSchedule, placeLabel } from '../utils';

export function RequestCard({
  request,
  onClick,
}: {
  request: PickupRequestSummary;
  onClick: () => void;
}) {
  const isPickedUp = request.status === 'PICK_UP' || request.status === 'PROCESSING';

  return (
    <button
      className={`request-card ${isPickedUp ? 'picked-up' : ''}`}
      type="button"
      onClick={onClick}
    >
      <div className="request-card-header">
        <p className="request-card-address">{request.address ?? '주소 없음'}</p>
        <div className="request-card-badges">
          {request.secondHandPickupRequested ? (
            <span className="badge badge-attention">중고</span>
          ) : null}
          {isPickedUp ? (
            <span className="badge badge-success">수거 완료</span>
          ) : (
            <span className="badge badge-info">수거 대기</span>
          )}
        </div>
      </div>

      <div className="request-card-meta">
        {request.pickupSchedule ? (
          <span className="meta-item">
            🕐 <strong>{formatSchedule(request.pickupSchedule)}</strong>
          </span>
        ) : null}
        <span className="meta-item">
          👕 <strong>{request.itemCount}개</strong>
        </span>
        {request.phoneNumber ? (
          <span className="meta-item">{request.phoneNumber}</span>
        ) : null}
      </div>

      {request.pickupDeliveryPlaceCode ? (
        <div className="request-card-place">
          {placeLabel(request.pickupDeliveryPlaceCode, request.pickupDeliveryPlaceText)}
        </div>
      ) : null}
    </button>
  );
}
