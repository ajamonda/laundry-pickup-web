import type { PickupRequestItem } from '../types';

export function ItemList({ items }: { items: PickupRequestItem[] }) {
  return (
    <div className="item-list">
      {items.map((item) => (
        <div key={item.itemId} className="item-row">
          <div className="item-row-header">
            <span className="item-name">{item.displayNameSnapshot}</span>
            <ItemStatusBadge status={item.status} />
          </div>

          {item.options.length > 0 ? (
            <div className="item-options">
              {item.options.map((opt, i) => (
                <span key={i} className="option-chip">
                  {opt.displayNameSnapshot}
                </span>
              ))}
            </div>
          ) : null}

          {item.inputs.map((inp) => (
            <p key={inp.inputCode} className="item-input">
              <strong>{inp.inputCode}: </strong>
              {inp.inputValue}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

function ItemStatusBadge({ status }: { status: string }) {
  if (status === 'PICK_UP') return <span className="badge badge-success">수거 완료</span>;
  if (status === 'INIT') return <span className="badge badge-neutral">수거 대기</span>;
  return <span className="badge badge-neutral">{status}</span>;
}
