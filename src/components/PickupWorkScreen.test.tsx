import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PickupWorkScreen } from './PickupWorkScreen';
import { useAppStore } from '../store';
import { renderWithProviders } from '../test/renderWithProviders';
import { staffSessionFixture } from '../test/fixtures';

const baseStoreState = {
  session: staffSessionFixture,
  runId: 'run-1',
  vehicleCode: 'PICKUP-VAN-01',
};

describe('PickupWorkScreen', () => {
  it('defaults all items to selected once detail loads', async () => {
    renderWithProviders(
      <PickupWorkScreen
        orderId="order-1"
        session={staffSessionFixture}
        onBack={() => {}}
        onDone={() => {}}
      />,
      {
        storeState: {
          ...baseStoreState,
          registeredBags: [{ bagBarcode: 'PICKUP-BAG-001', status: 'TAKE_OUT' }],
        },
      },
    );

    await screen.findByText('셔츠');
    expect(screen.getByRole('checkbox', { name: /셔츠/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /바지/ })).toBeChecked();
    expect(screen.getByRole('button', { name: /백에 담기 \(2개\)/ })).toBeInTheDocument();
  });

  it('only lists TAKE_OUT bags in the bag selector', async () => {
    renderWithProviders(
      <PickupWorkScreen
        orderId="order-1"
        session={staffSessionFixture}
        onBack={() => {}}
        onDone={() => {}}
      />,
      {
        storeState: {
          ...baseStoreState,
          registeredBags: [
            { bagBarcode: 'PICKUP-BAG-001', status: 'TAKE_OUT' },
            { bagBarcode: 'PICKUP-BAG-002', status: 'CONTAIN' },
            { bagBarcode: 'PICKUP-BAG-003', status: 'TAKE_BACK' },
          ],
        },
      },
    );

    const select = await screen.findByLabelText('적재할 백 선택');
    const optionValues = within(select)
      .getAllByRole('option')
      .map((o) => (o as HTMLOptionElement).value);

    expect(optionValues).toEqual(['', 'PICKUP-BAG-001']);
  });

  it('on put-items success: flips bag status to CONTAIN and calls onDone', async () => {
    const onDone = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <PickupWorkScreen
        orderId="order-1"
        session={staffSessionFixture}
        onBack={() => {}}
        onDone={onDone}
      />,
      {
        storeState: {
          ...baseStoreState,
          registeredBags: [{ bagBarcode: 'PICKUP-BAG-001', status: 'TAKE_OUT' }],
        },
      },
    );

    await screen.findByText('셔츠');
    await user.selectOptions(
      screen.getByLabelText('적재할 백 선택'),
      'PICKUP-BAG-001',
    );
    await user.click(screen.getByRole('button', { name: /백에 담기/ }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(useAppStore.getState().registeredBags).toEqual([
      { bagBarcode: 'PICKUP-BAG-001', status: 'CONTAIN' },
    ]);
  });
});
