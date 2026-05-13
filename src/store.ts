import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RegisteredBag, StaffSession } from './types';

type AppState = {
  session: StaffSession | null;
  runId: string | null;
  vehicleCode: string | null;
  registeredBags: RegisteredBag[];

  setSession: (session: StaffSession | null) => void;
  setRun: (runId: string, vehicleCode: string) => void;
  addBag: (bag: RegisteredBag) => void;
  updateBagStatus: (bagBarcode: string, status: RegisteredBag['status']) => void;
  clearRun: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      session: null,
      runId: null,
      vehicleCode: null,
      registeredBags: [],

      setSession: (session) => set({ session }),

      setRun: (runId, vehicleCode) => set({ runId, vehicleCode }),

      addBag: (bag) =>
        set((state) => ({
          registeredBags: state.registeredBags.some((b) => b.bagBarcode === bag.bagBarcode)
            ? state.registeredBags
            : [...state.registeredBags, bag],
        })),

      updateBagStatus: (bagBarcode, status) =>
        set((state) => ({
          registeredBags: state.registeredBags.map((b) =>
            b.bagBarcode === bagBarcode ? { ...b, status } : b,
          ),
        })),

      clearRun: () => set({ runId: null, vehicleCode: null, registeredBags: [] }),
    }),
    {
      name: 'laundry-pickup-web-state',
      partialize: (state) => ({
        session: state.session,
        runId: state.runId,
        vehicleCode: state.vehicleCode,
        registeredBags: state.registeredBags,
      }),
    },
  ),
);
