import { describe, expect, it } from 'vitest';
import { useAppStore } from './store';
import { staffSessionFixture } from './test/fixtures';

describe('useAppStore', () => {
  it('addBag is idempotent by bagBarcode', () => {
    const { addBag } = useAppStore.getState();
    addBag({ bagBarcode: 'PICKUP-BAG-001', status: 'TAKE_OUT' });
    addBag({ bagBarcode: 'PICKUP-BAG-001', status: 'TAKE_OUT' });
    addBag({ bagBarcode: 'PICKUP-BAG-002', status: 'TAKE_OUT' });

    expect(useAppStore.getState().registeredBags).toEqual([
      { bagBarcode: 'PICKUP-BAG-001', status: 'TAKE_OUT' },
      { bagBarcode: 'PICKUP-BAG-002', status: 'TAKE_OUT' },
    ]);
  });

  it('updateBagStatus only changes the target bag', () => {
    const { addBag, updateBagStatus } = useAppStore.getState();
    addBag({ bagBarcode: 'PICKUP-BAG-001', status: 'TAKE_OUT' });
    addBag({ bagBarcode: 'PICKUP-BAG-002', status: 'TAKE_OUT' });

    updateBagStatus('PICKUP-BAG-001', 'CONTAIN');

    expect(useAppStore.getState().registeredBags).toEqual([
      { bagBarcode: 'PICKUP-BAG-001', status: 'CONTAIN' },
      { bagBarcode: 'PICKUP-BAG-002', status: 'TAKE_OUT' },
    ]);
  });

  it('clearRun resets run/vehicle/bags but preserves session', () => {
    useAppStore.setState({
      session: staffSessionFixture,
      runId: 'run-1',
      vehicleCode: 'PICKUP-VAN-01',
      registeredBags: [{ bagBarcode: 'PICKUP-BAG-001', status: 'CONTAIN' }],
    });

    useAppStore.getState().clearRun();

    const state = useAppStore.getState();
    expect(state.session).toEqual(staffSessionFixture);
    expect(state.runId).toBeNull();
    expect(state.vehicleCode).toBeNull();
    expect(state.registeredBags).toEqual([]);
  });
});
