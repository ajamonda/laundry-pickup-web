import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './msw/server';
import { useAppStore } from '../store';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({
    session: null,
    runId: null,
    vehicleCode: null,
    registeredBags: [],
  });
});
