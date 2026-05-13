import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HandoffScreen } from './HandoffScreen';
import { useAppStore } from '../store';
import { renderWithProviders } from '../test/renderWithProviders';
import { staffSessionFixture } from '../test/fixtures';

const baseStoreState = {
  session: staffSessionFixture,
  runId: 'run-1',
  vehicleCode: 'PICKUP-VAN-01',
};

describe('HandoffScreen', () => {
  it('only renders a handoff button for CONTAIN bags', () => {
    renderWithProviders(<HandoffScreen session={staffSessionFixture} onBack={() => {}} />, {
      storeState: {
        ...baseStoreState,
        registeredBags: [
          { bagBarcode: 'PICKUP-BAG-001', status: 'CONTAIN' },
          { bagBarcode: 'PICKUP-BAG-002', status: 'TAKE_OUT' },
        ],
      },
    });

    expect(screen.getAllByRole('button', { name: '공장 인도' })).toHaveLength(1);
    expect(screen.getByText('PICKUP-BAG-001')).toBeInTheDocument();
    expect(screen.getByText('PICKUP-BAG-002')).toBeInTheDocument();
    expect(screen.getByText(/미적재 백/)).toBeInTheDocument();
  });

  it('handoff success only flips the target bag to TAKE_BACK', async () => {
    const user = userEvent.setup();
    renderWithProviders(<HandoffScreen session={staffSessionFixture} onBack={() => {}} />, {
      storeState: {
        ...baseStoreState,
        registeredBags: [
          { bagBarcode: 'PICKUP-BAG-001', status: 'CONTAIN' },
          { bagBarcode: 'PICKUP-BAG-002', status: 'CONTAIN' },
        ],
      },
    });

    await user.click(screen.getAllByRole('button', { name: '공장 인도' })[0]);

    await waitFor(() => {
      expect(useAppStore.getState().registeredBags).toEqual([
        { bagBarcode: 'PICKUP-BAG-001', status: 'TAKE_BACK' },
        { bagBarcode: 'PICKUP-BAG-002', status: 'CONTAIN' },
      ]);
    });
  });

  it('shows completion notice and calls clearRun when all bags are handed off', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<HandoffScreen session={staffSessionFixture} onBack={onBack} />, {
      storeState: {
        ...baseStoreState,
        registeredBags: [{ bagBarcode: 'PICKUP-BAG-001', status: 'TAKE_BACK' }],
      },
    });

    expect(screen.getByText('모든 백 인도 완료!')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '런 종료 및 목록으로' }));

    expect(useAppStore.getState().runId).toBeNull();
    expect(useAppStore.getState().registeredBags).toEqual([]);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
