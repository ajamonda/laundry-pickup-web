import type { PickupRequestItem, RegisteredBag } from '../types';

export function ItemChecklist({
  availableBags,
  items,
  selectedBag,
  selectedItemIds,
  onBagChange,
  onToggleAll,
  onToggleItem,
}: {
  availableBags: RegisteredBag[];
  items: PickupRequestItem[];
  selectedBag: string;
  selectedItemIds: Set<string>;
  onBagChange: (barcode: string) => void;
  onToggleAll: () => void;
  onToggleItem: (itemId: string) => void;
}) {
  const allSelected = items.every((i) => selectedItemIds.has(i.itemId));

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="bag-select-row">
        <label htmlFor="bag-select">적재할 백 선택</label>
        <select
          id="bag-select"
          value={selectedBag}
          onChange={(e) => onBagChange(e.target.value)}
        >
          <option value="">백을 선택하세요</option>
          {availableBags.map((bag) => (
            <option key={bag.bagBarcode} value={bag.bagBarcode}>
              {bag.bagBarcode}
            </option>
          ))}
        </select>
      </div>

      <div className="checklist-actions">
        <span style={{ color: 'var(--ink-deep)', fontSize: 14, fontWeight: 700 }}>
          아이템 선택 ({selectedItemIds.size}/{items.length})
        </span>
        <button className="select-all-button" type="button" onClick={onToggleAll}>
          {allSelected ? '전체 해제' : '전체 선택'}
        </button>
      </div>

      <div className="checklist">
        {items.map((item) => {
          const checked = selectedItemIds.has(item.itemId);
          return (
            <label
              key={item.itemId}
              className={`checklist-item ${checked ? 'checked' : ''}`}
              style={{ cursor: 'pointer' }}
            >
              <input
                checked={checked}
                className="checklist-checkbox"
                type="checkbox"
                onChange={() => onToggleItem(item.itemId)}
              />
              <div className="checklist-item-body">
                <span className="item-name">{item.displayNameSnapshot}</span>
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
            </label>
          );
        })}
      </div>
    </div>
  );
}
