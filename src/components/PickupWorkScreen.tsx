import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { StaffSession } from '../types';
import { useAppStore } from '../store';
import { ErrorNotice } from './ErrorNotice';
import { ItemChecklist } from './ItemChecklist';

export function PickupWorkScreen({
  orderId,
  session,
  onBack,
  onDone,
}: {
  orderId: string;
  session: StaffSession;
  onBack: () => void;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const { runId, registeredBags, updateBagStatus } = useAppStore();

  const [photoUrl, setPhotoUrl] = useState('');
  const [photoRegistered, setPhotoRegistered] = useState(false);
  const [selectedBag, setSelectedBag] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  const requestQuery = useQuery({
    queryKey: ['pickup-request-detail', orderId, session.accessToken],
    queryFn: () => api.getPickupRequestDetail(session.accessToken, orderId),
  });

  useEffect(() => {
    if (requestQuery.data) {
      setSelectedItemIds(new Set(requestQuery.data.items.map((i) => i.itemId)));
    }
  }, [requestQuery.data]);

  const photoMutation = useMutation({
    mutationFn: () =>
      api.recordPhoto(session.accessToken, orderId, runId!, photoUrl.trim()),
    onSuccess: () => {
      setPhotoRegistered(true);
      setPhotoUrl('');
    },
  });

  const putItemsMutation = useMutation({
    mutationFn: () =>
      api.putItemsIntoBag(
        session.accessToken,
        selectedBag,
        runId!,
        orderId,
        Array.from(selectedItemIds),
      ),
    onSuccess: () => {
      updateBagStatus(selectedBag, 'CONTAIN');
      void queryClient.invalidateQueries({ queryKey: ['pickup-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['pickup-request-detail', orderId] });
      onDone();
    },
  });

  const request = requestQuery.data;
  const availableBags = registeredBags.filter((b) => b.status === 'TAKE_OUT');
  const canSubmit =
    selectedBag &&
    selectedItemIds.size > 0 &&
    !putItemsMutation.isPending;

  function handleToggleItem(itemId: string) {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function handleToggleAll() {
    if (!request) return;
    const allIds = new Set<string>(request.items.map((i) => i.itemId));
    const allSelected = request.items.every((i) => selectedItemIds.has(i.itemId));
    setSelectedItemIds(allSelected ? new Set<string>() : allIds);
  }

  return (
    <>
      <button className="back-button" style={{ marginBottom: 16 }} type="button" onClick={onBack}>
        ← 주문 상세
      </button>

      {request ? (
        <div
          className="info-box"
          style={{ marginBottom: 16 }}
        >
          <span>현장 주소</span>
          <strong>{request.address ?? '주소 없음'}</strong>
        </div>
      ) : null}

      <div className="work-screen">
        {/* Photo section */}
        <div className="work-section">
          <h2>① 현장 사진 등록</h2>

          {photoRegistered ? (
            <div className="photo-registered">
              <span>✓ 사진 등록 완료</span>
            </div>
          ) : (
            <>
              <div className="photo-input-row">
                <input
                  placeholder="https://storage.example.com/photo.jpg"
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
                <button
                  className="ghost-button"
                  disabled={!photoUrl.trim() || photoMutation.isPending}
                  type="button"
                  onClick={() => photoMutation.mutate()}
                >
                  {photoMutation.isPending ? '등록 중…' : '등록'}
                </button>
              </div>
              {photoMutation.error ? <ErrorNotice error={photoMutation.error} /> : null}
              <p style={{ color: 'var(--stone)', fontSize: 12, margin: 0 }}>
                사진 등록은 선택 사항입니다. 건너뛰고 아이템을 바로 적재할 수 있습니다.
              </p>
            </>
          )}
        </div>

        {/* Item checklist */}
        <div className="work-section">
          <h2>② 아이템 백 적재</h2>

          {requestQuery.isLoading ? (
            <div className="skeleton" style={{ height: 80 }} />
          ) : requestQuery.error ? (
            <ErrorNotice error={requestQuery.error} />
          ) : request && request.items.length > 0 ? (
            <ItemChecklist
              availableBags={availableBags}
              items={request.items}
              selectedBag={selectedBag}
              selectedItemIds={selectedItemIds}
              onBagChange={setSelectedBag}
              onToggleAll={handleToggleAll}
              onToggleItem={handleToggleItem}
            />
          ) : (
            <p style={{ color: 'var(--stone)', fontSize: 14 }}>아이템이 없습니다.</p>
          )}

          {putItemsMutation.error ? <ErrorNotice error={putItemsMutation.error} /> : null}

          {availableBags.length === 0 ? (
            <div className="form-error">
              TAKE_OUT 상태의 백이 없습니다. 런 준비에서 백을 등록하거나, 이미 적재된 백은 공장
              인도 후 사용 가능합니다.
            </div>
          ) : null}
        </div>
      </div>

      <div className="bottom-bar">
        <button className="secondary-button" type="button" onClick={onBack}>
          취소
        </button>
        <button
          className="primary-button"
          disabled={!canSubmit}
          type="button"
          onClick={() => putItemsMutation.mutate()}
        >
          {putItemsMutation.isPending
            ? '처리 중…'
            : `백에 담기 (${selectedItemIds.size}개)`}
        </button>
      </div>
    </>
  );
}
