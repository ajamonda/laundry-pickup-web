import { useState } from 'react';
import type { AppStep, StaffSession } from './types';
import { useAppStore } from './store';
import { AppChrome } from './components/AppChrome';
import { LoginScreen } from './components/LoginScreen';
import { RequestListScreen } from './components/RequestListScreen';
import { RequestDetailScreen } from './components/RequestDetailScreen';
import { RunSetupScreen } from './components/RunSetupScreen';
import { PickupWorkScreen } from './components/PickupWorkScreen';
import { HandoffScreen } from './components/HandoffScreen';

export function App() {
  const { session, setSession, clearRun } = useAppStore();
  const [step, setStep] = useState<AppStep>(() => (session ? 'requests' : 'login'));
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  function handleLoggedIn(nextSession: StaffSession) {
    setSession(nextSession);
    setStep('requests');
  }

  function handleLogout() {
    setSession(null);
    clearRun();
    setStep('login');
  }

  function handleSelectRequest(orderId: string) {
    setSelectedOrderId(orderId);
    setStep('request-detail');
  }

  function handleGoToPickupWork(orderId: string) {
    setSelectedOrderId(orderId);
    setStep('pickup-work');
  }

  function handlePickupDone() {
    setSelectedOrderId(null);
    setStep('requests');
  }

  return (
    <AppChrome onLogout={handleLogout} session={session} step={step}>
      {step === 'login' ? (
        <LoginScreen onLoggedIn={handleLoggedIn} />
      ) : null}

      {step === 'requests' && session ? (
        <RequestListScreen
          session={session}
          onSelectRequest={handleSelectRequest}
          onGoToRunSetup={() => setStep('run-setup')}
          onGoToHandoff={() => setStep('handoff')}
        />
      ) : null}

      {step === 'request-detail' && session && selectedOrderId ? (
        <RequestDetailScreen
          orderId={selectedOrderId}
          session={session}
          onBack={() => setStep('requests')}
          onGoToPickupWork={handleGoToPickupWork}
        />
      ) : null}

      {step === 'run-setup' && session ? (
        <RunSetupScreen
          session={session}
          onDone={() => setStep('requests')}
        />
      ) : null}

      {step === 'pickup-work' && session && selectedOrderId ? (
        <PickupWorkScreen
          orderId={selectedOrderId}
          session={session}
          onBack={() => setStep('request-detail')}
          onDone={handlePickupDone}
        />
      ) : null}

      {step === 'handoff' && session ? (
        <HandoffScreen
          session={session}
          onBack={() => setStep('requests')}
        />
      ) : null}
    </AppChrome>
  );
}
