import { FormEvent, useState } from 'react';
import type { RegisteredBag } from '../types';

export function BagScanner({
  bags,
  disabled,
  error,
  isPending,
  onScan,
}: {
  bags: RegisteredBag[];
  disabled?: boolean;
  error?: unknown;
  isPending: boolean;
  onScan: (barcode: string) => void;
}) {
  const [barcode, setBarcode] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = barcode.trim();
    if (trimmed) {
      onScan(trimmed);
      setBarcode('');
    }
  }

  return (
    <div className="bag-scanner">
      <form className="bag-input-row" onSubmit={handleSubmit}>
        <input
          autoComplete="off"
          disabled={disabled || isPending}
          placeholder="PICKUP-BAG-001"
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />
        <button
          className="ghost-button"
          disabled={disabled || isPending || !barcode.trim()}
          type="submit"
        >
          {isPending ? '등록 중…' : '등록'}
        </button>
      </form>

      {error ? <div className="error-notice">{errorMessage(error)}</div> : null}

      {bags.length > 0 ? (
        <div className="bag-list">
          {bags.map((bag) => (
            <div key={bag.bagBarcode} className="bag-row">
              <span className="bag-barcode">{bag.bagBarcode}</span>
              <BagStatusBadge status={bag.status} />
            </div>
          ))}
        </div>
      ) : (
        <p className="bag-empty">등록된 백이 없습니다.</p>
      )}
    </div>
  );
}

function BagStatusBadge({ status }: { status: RegisteredBag['status'] }) {
  if (status === 'TAKE_OUT')
    return <span className="badge badge-info">출고 준비</span>;
  if (status === 'CONTAIN')
    return <span className="badge badge-attention">적재 완료</span>;
  if (status === 'TAKE_BACK')
    return <span className="badge badge-success">인도 완료</span>;
  return null;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return '백 등록에 실패했어요.';
}
