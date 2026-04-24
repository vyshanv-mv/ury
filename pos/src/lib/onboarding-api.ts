import { call } from './frappe-sdk';

// ─── Types ────────────────────────────────────────────────────────────

export interface SetupResult {
  success: boolean;
  message?: string;
  data?: any;
}

export interface SetupOrganizationPayload {
  company_name: string;
  abbr: string;
  country: string;
  timezone: string;
  currency: string;
  user_name: string;
  email: string;
  password?: string;
  tax_system?: string;
  generate_demo_data?: boolean | number;
}

export interface SetupOrganizationResponse {
  message: {
    status: 'success';
    message: string;
  };
}

export interface UploadMenuCSVResponse {
  message: {
    status: 'success';
    items: Array<{ item_name: string; price: number }>;
  };
}

export interface SetupMenuPayload {
  items: Array<{ item_name: string; price: number }>;
  tax_calculation: 'Inclusive' | 'Exclusive';
  company_name?: string;
}

export interface SetupMenuResponse {
  message: {
    status: 'success';
    message: string;
    created_items: string[];
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────

const MAX_CSV_SIZE_MB = 5;

/**
 * Extracts a human-readable message from Frappe's server error format.
 */
function extractErrorMessage(error: any, fallback: string): string {
  if (error?._server_messages) {
    try {
      const messages: string[] = JSON.parse(error._server_messages);
      const first = JSON.parse(messages[0]);
      if (first?.message) return first.message;
    } catch {
      // malformed, fall through
    }
  }
  if (typeof error?.exception === 'string') return error.exception;
  if (typeof error?.message === 'string' && error.message !== 'undefined') return error.message;
  return fallback;
}

// Helper to simulate API delay and success for mocks
const mockSuccess = async (data: any = {}): Promise<SetupResult> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return { success: true, data };
};

// ─── API Implementation ───────────────────────────────────────────────

export const onboardingApi = {
  // REAL: Check setup status
  checkSetupStatus: async (): Promise<{ needsOnboarding: boolean }> => {
    try {
      const response = await (window as any).frappe.call('ury.setup.api.check_setup_status');
      return { needsOnboarding: !response.message?.setup_complete };
    } catch (e) {
      return { needsOnboarding: true };
    }
  },

  // REAL: Organization Setup
  setupOrganization: async (payload: SetupOrganizationPayload): Promise<SetupResult> => {
    try {
      const response = await call.post<SetupOrganizationResponse>(
        'ury.setup.api.setup_organization',
        payload
      );
      return { success: true, message: response.message.message };
    } catch (error: any) {
      throw new Error(extractErrorMessage(error, 'Organization setup failed.'));
    }
  },

  // REAL: Menu Upload
  uploadMenuCSV: async (file: File): Promise<any> => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      throw new Error('Only CSV files are supported.');
    }
    const maxBytes = MAX_CSV_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) throw new Error(`File too large (max ${MAX_CSV_SIZE_MB}MB).`);
    if (file.size === 0) throw new Error('File is empty.');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const csrfToken = (window as any).frappe?.csrf_token || 
                       document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1] || '';

      const res = await fetch('/api/method/ury.setup.api.upload_menu_csv', {
        method: 'POST',
        headers: { 'X-Frappe-CSRF-Token': csrfToken },
        body: formData,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(extractErrorMessage(errBody, 'CSV upload failed.'));
      }

      const json = await res.json();
      return json.message;
    } catch (error: any) {
      if (error instanceof Error) throw error;
      throw new Error(extractErrorMessage(error, 'Failed to upload CSV.'));
    }
  },

  // REAL: Menu Setup
  setupMenu: async (payload: SetupMenuPayload): Promise<SetupResult> => {
    try {
      const response = await call.post<SetupMenuResponse>(
        'ury.setup.api.setup_menu',
        payload
      );
      return { success: true, message: response.message.message };
    } catch (error: any) {
      throw new Error(extractErrorMessage(error, 'Menu setup failed.'));
    }
  },

  // MOCK: Printer Setup
  setupPrinter: async (data: any): Promise<SetupResult> => {
    console.log('Mock setupPrinter:', data);
    return mockSuccess();
  },

  getPrinterContext: async (): Promise<any> => {
    return { printer_name: '', server_ip: '127.0.0.1', port: '9100', bill: true };
  },

  // MOCK: Room Setup
  getRoomContext: async (): Promise<any> => {
    return [
      { name: 'Main Hall', table_count: 10 },
      { name: 'Terrace', table_count: 5 }
    ];
  },

  setupRoom: async (data: any): Promise<SetupResult> => {
    console.log('Mock setupRoom:', data);
    return mockSuccess();
  },

  // MOCK: Table Setup
  getTableContext: async (): Promise<any> => {
    return { rooms: ['Main Hall', 'Terrace'], existing_tables: [] };
  },

  setupTable: async (data: any): Promise<SetupResult> => {
    console.log('Mock setupTable:', data);
    return mockSuccess();
  },

  // MOCK: Mode of Payment
  getMopContext: async (): Promise<any> => {
    return [
      { name: 'Cash', type: 'Cash' },
      { name: 'Card', type: 'Bank' },
      { name: 'UPI', type: 'Bank' }
    ];
  },

  setupMop: async (data: any): Promise<SetupResult> => {
    console.log('Mock setupMop:', data);
    return mockSuccess();
  },

  // MOCK: Branch
  getBranchContext: async (): Promise<any> => {
    return { branch_name: 'Main Branch', branch_phone: '', branch_email: '', branch_address: '' };
  },

  setupBranch: async (data: any): Promise<SetupResult> => {
    console.log('Mock setupBranch:', data);
    return mockSuccess();
  },

  // MOCK: Restaurant
  getRestaurantContext: async (): Promise<any> => {
    return { restaurant_name: 'URY Kitchen', tagline: '' };
  },

  setupRestaurant: async (data: any): Promise<SetupResult> => {
    console.log('Mock setupRestaurant:', data);
    return mockSuccess();
  },

  // MOCK: User Management
  getUserManagementContext: async (): Promise<any> => {
    return { roles: ['Cashier', 'Manager', 'Admin'], existing_users: [] };
  },

  setupUserManagement: async (data: any): Promise<SetupResult> => {
    console.log('Mock setupUserManagement:', data);
    return mockSuccess();
  },
};
