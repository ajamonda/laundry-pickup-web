import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { StaffSession } from '../types';
import { useAppStore } from '../store';
import { ErrorNotice } from './ErrorNotice';

export function HandoffScreen({
  session,
  onBack,
}: {
  session: StaffSession;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const { runId, registeredBags, updateBagStatus, clearRun } = useAppStore();

  const handoffMutation = useMutation({
    mutationFn: (bagBarcode: string) =>
      api.handoffBag(session.accessToken, bagBarcode, runId!),
    onSuccess: (result) => {
      updateBagStatus(result.bag.barcode, 'TAKE_BACK');
      void queryClient.invalidateQueries({ queryKey: ['pickup-requests'] });
    },
  });

  const containBags = registeredBags.filter((b) => b.status === 'CONTAIN');
  const takenBackBags = registeredBags.filter((b) => b.status === 'TAKE_BACK');
  const allHandedOff = containBags.length === 0 && takenBackBags.length > 0;

  return (
    <>
      <button className="back-button" style={{ marginBottom: 16 }} type="button" onClick={onBack}>
        ← 요청 목록
      </button>

      <div className="page-header">
        <h1>공장 인도</h1>
        <p>공장 도착 후 백을 하나씩 인도 처리합니다.</p>
      </div>

      {allHandedOff ? (
        <div className="success-notice" style={{ marginBottom: 20 }}>
          <h2>모든 백 인도 완료!</h2>
          <p>오늘 수거 런이 완료되었습니다.</p>
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              clearRun();
              onBack();
            }}
          >
            런 종료 및 목록으로
          </button>
        </div>
      ) : null}

      {handoffMutation.error ? (
        <div style={{ marginBottom: 12 }}>
          <ErrorNotice error={handoffMutation.error} />
        </div>
      ) : null}

      {/* CONTAIN bags — pending handoff */}
      {containBags.length > 0 ? (
        <>
          <div style={{ color: 'var(--ink-deep)', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            인도 대기 ({containBags.length}개)
          </div>
          <div className="handoff-list">
            {containBags.map((bag) => (
              <div key={bag.bagBarcode} className="handoff-bag-card">
                <div className="handoff-bag-header">
                  <span className="handoff-bag-barcode">{bag.bagBarcode}</span>
                  <span className="badge badge-attention">인도 대기</span>
                </div>
                <button
                  className="buy-button"
                  disabled={handoffMutation.isPending}
                  type="button"
                  onClick={() => handoffMutation.mutate(bag.bagBarcode)}
                >
                  {handoffMutation.isPending &&
                  handoffMutation.variables === bag.bagBarcode
                    ? '처리 중…'
                    : '공장 인도'}
                </button>
              </div>
            ))}
          </div>
        </>
      ) : !allHandedOff ? (
        <div className="handoff-empty">
          <p>적재된 백이 없습니다.</p>
          <p style={{ marginTop: 8 }}>현장에서 백에 아이템을 적재한 뒤 돌아오세요.</p>
        </div>
      ) : null}

      {/* TAKE_BACK bags — already handed off */}
      {takenBackBags.length > 0 ? (
        <div style={{ marginTop: 20 }}>
          <div style={{ color: 'var(--steel)', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
            인도 완료 ({takenBackBags.length}개)
          </div>
          <div className="handoff-list">
            {takenBackBags.map((bag) => (
              <div key={bag.bagBarcode} className="handoff-bag-card done">
                <div className="handoff-bag-header">
                  <span className="handoff-bag-barcode">{bag.bagBarcode}</span>
                  <span className="badge badge-success">인도 완료</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* TAKE_OUT bags — not loaded yet */}
      {registeredBags.filter((b) => b.status === 'TAKE_OUT').length > 0 ? (
        <div style={{ marginTop: 20 }}>
          <div style={{ color: 'var(--stone)', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
            미적재 백 (아이템이 아직 없음)
          </div>
          <div className="handoff-list">
            {registeredBags
              .filter((b) => b.status === 'TAKE_OUT')
              .map((bag) => (
                <div key={bag.bagBarcode} className="handoff-bag-card">
                  <div className="handoff-bag-header">
                    <span className="handoff-bag-barcode">{bag.bagBarcode}</span>
                    <span className="badge badge-neutral">미적재</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
