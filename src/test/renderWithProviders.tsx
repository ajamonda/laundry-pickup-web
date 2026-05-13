import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { useAppStore } from '../store';

type StoreState = Partial<ReturnType<typeof useAppStore.getState>>;

export function renderWithProviders(
  ui: ReactElement,
  options: { storeState?: StoreState } = {},
) {
  if (options.storeState) {
    useAppStore.setState(options.storeState);
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}
