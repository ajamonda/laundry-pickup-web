import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import type { StaffSession } from '../types';
import { useAppStore } from '../store';
import { ErrorNotice } from './ErrorNotice';
import { RequestCard } from './RequestCard';

export function RequestListScreen({
  session,
  onSelectRequest,
  onGoToRunSetup,
  onGoToHandoff,
}: {
  session: StaffSession;
  onSelectRequest: (orderId: string) => void;
  onGoToRunSetup: () => void;
  onGoToHandoff: () => void;
}) {
  const { runId, registeredBags } = useAppStore();
  const containBags = registeredBags.filter((b) => b.status === 'CONTAIN');

  const requestsQuery = useQuery({
    queryKey: ['pickup-requests', session.accessToken],
    queryFn: () => api.getPickupRequests(session.accessToken),
    refetchInterval: 30_000,
  });

  const requests = requestsQuery.data?.items ?? [];
  const totalCount = requestsQuery.data?.totalCount ?? 0;

  return (
    <>
      <div className="page-header-row">
        <div>
          <h1 style={{ color: 'var(--ink-deep)', fontSize: 24, fontWeight: 500, margin: 0 }}>
            오늘의 수거 요청
          </h1>
          {requestsQuery.data ? (
            <p style={{ color: 'var(--steel)', fontSize: 13, margin: '4px 0 0' }}>
              전체 {totalCount}건
            </p>
          ) : null}
        </div>
        <button
          className="ghost-button"
          style={{ minHeight: 38, padding: '8px 16px', fontSize: 13 }}
          type="button"
          onClick={() => void requestsQuery.refetch()}
        >
          새로고침
        </button>
      </div>

      {runId ? (
        <div className="run-status-bar">
          <span>
            🚐 런 활성 · 백 {registeredBags.length}개 등록
            {containBags.length > 0 ? ` · 적재 ${containBags.length}개` : ''}
          </span>
          {containBags.length > 0 ? (
            <button
              className="ghost-button"
              style={{ minHeight: 34, padding: '7px 14px', fontSize: 13 }}
              type="button"
              onClick={onGoToHandoff}
            >
              공장 인도 →
            </button>
          ) : null}
        </div>
      ) : null}

      {requestsQuery.isLoading ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" />
          ))}
        </div>
      ) : requestsQuery.error ? (
        <ErrorNotice error={requestsQuery.error} />
      ) : requests.length === 0 ? (
        <div style={{ color: 'var(--stone)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
          오늘 수거 요청이 없습니다.
        </div>
      ) : (
        <div className="request-list">
          {requests.map((request) => (
            <RequestCard
              key={request.orderId}
              request={request}
              onClick={() => onSelectRequest(request.orderId)}
            />
          ))}
        </div>
      )}

      <div className="bottom-bar">
        {runId ? (
          <button className="secondary-button" type="button" onClick={onGoToRunSetup}>
            백 관리
          </button>
        ) : (
          <button className="primary-button" type="button" onClick={onGoToRunSetup}>
            런 시작하기
          </button>
        )}
      </div>
    </>
  );
}
