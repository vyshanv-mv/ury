import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  SetupOrganizationPayload, 
  BranchData, 
  RestaurantData, 
  RoomData, 
  TableData, 
  PrinterData, 
  PaymentData, 
  UserData 
} from '../lib/onboardsetup-api';

interface OnboardingState {
  currentStepIndex: number;
  completedSteps: string[];
  skippedSteps: string[];

  // Step Data
  organization: Partial<SetupOrganizationPayload>;
  menu: {
    items: Array<{ item_name: string; price: number }>;
    tax_calculation: 'Inclusive' | 'Exclusive';
    tax_rate: string;
  };
  printer: PrinterData[];
  rooms: RoomData[];
  tables: TableData[];
  payments: PaymentData[];
  branch: BranchData[];
  restaurant: RestaurantData[];
  users: UserData[];
  integrations: any[];

  // Actions
  setStepIndex: (index: number) => void;
  markStepComplete: (stepId: string) => void;
  markStepSkipped: (stepId: string) => void;
  updateData: <K extends keyof Omit<OnboardingState, 'currentStepIndex' | 'completedSteps' | 'skippedSteps' | 'setStepIndex' | 'markStepComplete' | 'markStepSkipped' | 'updateData' | 'resetStore'>>(
    step: K, 
    data: OnboardingState[K] | Partial<OnboardingState[K]>
  ) => void;
  resetStore: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            currentStepIndex: 0,
            completedSteps: [],
            skippedSteps: [],

            organization: {},
            menu: { items: [], tax_calculation: 'Inclusive', tax_rate: '5' },
            printer: [],
            rooms: [],
            tables: [],
            payments: [],
            branch: [],
            restaurant: [],
            users: [],
            integrations: [],

            setStepIndex: (index) => set({ currentStepIndex: index }),
            markStepComplete: (stepId) => set((state) => ({
                completedSteps: state.completedSteps.includes(stepId)
                    ? state.completedSteps
                    : [...state.completedSteps, stepId],
                // Remove from skipped if it was previously skipped
                skippedSteps: state.skippedSteps.filter(id => id !== stepId),
            })),
            markStepSkipped: (stepId) => set((state) => ({
                skippedSteps: state.skippedSteps.includes(stepId)
                    ? state.skippedSteps
                    : [...state.skippedSteps, stepId],
                // Remove from completed if it was previously completed
                completedSteps: state.completedSteps.filter(id => id !== stepId),
            })),
            updateData: (step, data) => set((state) => {
                const currentVal = state[step];
                if (Array.isArray(data)) {
                    return { [step]: data };
                }
                if (typeof data === 'object' && data !== null && !Array.isArray(currentVal)) {
                    return { [step]: { ...currentVal, ...data } };
                }
                return { [step]: data };
            }),
            resetStore: () => set({
                currentStepIndex: 0,
                completedSteps: [],
                skippedSteps: [],
                organization: {},
                menu: { items: [], tax_calculation: 'Inclusive', tax_rate: '5' },
                printer: [],
                rooms: [],
                tables: [],
                payments: [],
                branch: [],
                restaurant: [],
                users: [],
                integrations: []
            }),
    }),
    {
      name: 'onboarding_state',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migrate old object-based state to arrays
          const migrateToArray = (val: any) => {
            if (Array.isArray(val)) return val;
            if (val && typeof val === 'object' && Object.keys(val).length > 0) return [val];
            return [];
          };

          if (persistedState) {
            persistedState.branch = migrateToArray(persistedState.branch);
            persistedState.restaurant = migrateToArray(persistedState.restaurant);
            persistedState.printer = migrateToArray(persistedState.printer);
          }
        }
        return persistedState;
      },
    }
  )
);
