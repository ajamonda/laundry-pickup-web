import type { ReactNode } from 'react';
import type { AppStep, StaffSession } from '../types';

const stepLabels: Array<{ step: AppStep; label: string }> = [
  { step: 'requests', label: '요청 목록' },
  { step: 'run-setup', label: '런 준비' },
  { step: 'pickup-work', label: '현장 작업' },
  { step: 'handoff', label: '공장 인도' },
];

const workSteps: AppStep[] = ['requests', 'request-detail', 'run-setup', 'pickup-work', 'handoff'];

function activeGroup(step: AppStep): AppStep {
  if (step === 'request-detail') return 'requests';
  return step;
}

export function AppChrome({
  children,
  onLogout,
  session,
  step,
}: {
  children: ReactNode;
  onLogout: () => void;
  session: StaffSession | null;
  step: AppStep;
}) {
  const showNav = step !== 'login';

  return (
    <div className="app-shell">
      <div className="promo-banner">
        <span>세탁 서비스</span>
        <strong>PICKUP</strong>
      </div>

      <nav className="top-nav" aria-label="주요 메뉴">
        <div className="brand-mark">
          <span className="brand-dot" />
          수거 운영
        </div>

        {showNav && workSteps.includes(step) ? (
          <div style={{ display: 'flex', gap: 6 }}>
            {stepLabels.map((item) => (
              <span
                key={item.step}
                style={{
                  background: activeGroup(step) === item.step ? 'var(--ink-deep)' : 'transparent',
                  border: '1px solid var(--hairline)',
                  borderRadius: 100,
                  color: activeGroup(step) === item.step ? 'var(--canvas)' : 'var(--ink)',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '6px 12px',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </span>
            ))}
          </div>
        ) : null}

        <div className="nav-right">
          {session ? (
            <>
              <span className="staff-pill">{session.staff.staffId}</span>
              <button className="logout-button" type="button" onClick={onLogout}>
                로그아웃
              </button>
            </>
          ) : null}
        </div>
      </nav>

      <div className="page-content">{children}</div>
    </div>
  );
}
