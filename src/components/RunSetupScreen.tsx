import { useMutation } from '@tanstack/react-query';
import { api } from '../api';
import type { StaffSession } from '../types';
import { VEHICLE_OPTIONS } from '../types';
import { useAppStore } from '../store';
import { vehicleLabel } from '../utils';
import { ErrorNotice } from './ErrorNotice';
import { BagScanner } from './BagScanner';

export function RunSetupScreen({
  session,
  onDone,
}: {
  session: StaffSession;
  onDone: () => void;
}) {
  const { runId, vehicleCode, registeredBags, setRun, addBag } = useAppStore();

  const createRunMutation = useMutation({
    mutationFn: (code: string) => api.createRun(session.accessToken, code),
    onSuccess: (run) => setRun(run.runId, run.vehicle.code),
  });

  const registerBagMutation = useMutation({
    mutationFn: (barcode: string) =>
      api.registerBag(session.accessToken, runId!, barcode),
    onSuccess: (bag) =>
      addBag({ bagBarcode: bag.barcode, status: 'TAKE_OUT' }),
  });

  function handleVehicleSelect(code: string) {
    if (runId) return;
    createRunMutation.mutate(code);
  }

  const isRunActive = Boolean(runId);

  return (
    <>
      <div className="page-header">
        <button className="back-button" type="button" onClick={onDone}>
          ← 요청 목록
        </button>
      </div>

      <div className="setup-steps">
        {/* Step 1: Vehicle */}
        <div className={`setup-step ${isRunActive ? 'done' : ''}`}>
          <div className="step-title">
            <span className="step-number">1</span>
            <h2>차량 선택</h2>
            {isRunActive ? <span className="badge badge-success">완료</span> : null}
          </div>

          {isRunActive ? (
            <div className="info-box">
              <span>사용 중인 차량</span>
              <strong>🚐 {vehicleLabel(vehicleCode!)}</strong>
            </div>
          ) : (
            <>
              <div className="vehicle-grid">
                {VEHICLE_OPTIONS.map((v) => (
                  <button
                    key={v.code}
                    className={`vehicle-card ${vehicleCode === v.code ? 'selected' : ''}`}
                    disabled={createRunMutation.isPending}
                    type="button"
                    onClick={() => handleVehicleSelect(v.code)}
                  >
                    <span className="vehicle-icon">🚐</span>
                    <span className="vehicle-label">{v.label}</span>
                  </button>
                ))}
              </div>
              {createRunMutation.error ? (
                <ErrorNotice error={createRunMutation.error} />
              ) : null}
              <p style={{ color: 'var(--steel)', fontSize: 13, margin: 0 }}>
                차량을 선택하면 런이 시작됩니다. 스태프당 활성 런은 1개입니다.
              </p>
            </>
          )}
        </div>

        {/* Step 2: Bags */}
        <div className={`setup-step ${!isRunActive ? '' : ''}`}
          style={{ opacity: isRunActive ? 1 : 0.5 }}>
          <div className="step-title">
            <span className="step-number" style={{ background: isRunActive ? undefined : 'var(--stone)' }}>
              2
            </span>
            <h2>백 등록</h2>
          </div>

          <BagScanner
            bags={registeredBags}
            disabled={!isRunActive}
            error={registerBagMutation.error ?? undefined}
            isPending={registerBagMutation.isPending}
            onScan={(barcode) => registerBagMutation.mutate(barcode)}
          />
        </div>
      </div>

      <div className="bottom-bar">
        <button
          className="primary-button"
          disabled={!isRunActive || registeredBags.length === 0}
          type="button"
          onClick={onDone}
        >
          {registeredBags.length === 0
            ? '백을 1개 이상 등록하세요'
            : `완료 (백 ${registeredBags.length}개)`}
        </button>
      </div>
    </>
  );
}
