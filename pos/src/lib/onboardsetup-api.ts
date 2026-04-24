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
// extracts a human-readable message from Frappe's server error format.
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


// ─── API Implementation ───────────────────────────────────────────────

export const onboardsetupApi = {
  // Check setup status
  checkSetupStatus: async (): Promise<{ needsOnboarding: boolean }> => {
    try {
      const response = await (window as any).frappe.call('ury.setup.api.check_setup_status');
      return { needsOnboarding: !response.message?.setup_complete };
    } catch (e) {
      return { needsOnboarding: true };
    }
  },

  // Organization Setup
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

  // Menu Upload
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

  // Menu Setup
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

  // Printer Setup
  getPrinterContext: async (): Promise<any> => {
    try {
      const response = await call.post('ury.setup.api.get_printer_context', {});
      return response.message;
    } catch (error: any) {
      return { printer_name: '', server_ip: '', port: '9100', bill: true };
    }
  },

  setupPrinter: async (data: any): Promise<SetupResult> => {
    try {
      const response = await call.post('ury.setup.api.setup_printer', data);
      return { success: true, message: response.message };
    } catch (error: any) {
      throw new Error(extractErrorMessage(error, 'Printer setup failed.'));
    }
  },

  // Room Setup
  getRoomContext: async (): Promise<any> => {
    try {
      const response = await call.post('ury.setup.api.get_room_context', {});
      return response.message;
    } catch (error: any) {
      return [];
    }
  },

  setupRoom: async (data: any): Promise<SetupResult> => {
    try {
      const response = await call.post('ury.setup.api.setup_room', data);
      return { success: true, message: response.message };
    } catch (error: any) {
      throw new Error(extractErrorMessage(error, 'Room setup failed.'));
    }
  },

  // Table Setup
  getTableContext: async (): Promise<any> => {
    try {
      const response = await call.post('ury.setup.api.get_table_context', {});
      return response.message;
    } catch (error: any) {
      return { rooms: [], existing_tables: [] };
    }
  },

  setupTable: async (data: any): Promise<SetupResult> => {
    try {
      const response = await call.post('ury.setup.api.setup_table', data);
      return { success: true, message: response.message };
    } catch (error: any) {
      throw new Error(extractErrorMessage(error, 'Table setup failed.'));
    }
  },

  // Mode of Payment
  getMopContext: async (): Promise<any> => {
    try {
      const response = await call.post('ury.setup.api.get_mop_context', {});
      return response.message;
    } catch (error: any) {
      return [];
    }
  },

  setupMop: async (data: any): Promise<SetupResult> => {
    try {
      const response = await call.post('ury.setup.api.setup_mop', data);
      return { success: true, message: response.message };
    } catch (error: any) {
      throw new Error(extractErrorMessage(error, 'Payment setup failed.'));
    }
  },

  // Branch Setup
  getBranchContext: async (): Promise<any> => {
    try {
      const response = await call.post('ury.setup.api.get_branch_context', {});
      return response.message;
    } catch (error: any) {
      return { branch_name: '', branch_phone: '', branch_email: '', branch_address: '' };
    }
  },

  setupBranch: async (data: any): Promise<SetupResult> => {
    try {
      const response = await call.post('ury.setup.api.setup_branch', data);
      return { success: true, message: response.message };
    } catch (error: any) {
      throw new Error(extractErrorMessage(error, 'Branch setup failed.'));
    }
  },

  // Restaurant Setup
  getRestaurantContext: async (): Promise<any> => {
    try {
      const response = await call.post('ury.setup.api.get_restaurant_context', {});
      return response.message;
    } catch (error: any) {
      return { restaurant_name: '', tagline: '' };
    }
  },

  setupRestaurant: async (data: any): Promise<SetupResult> => {
    try {
      const response = await call.post('ury.setup.api.setup_restaurant', data);
      return { success: true, message: response.message };
    } catch (error: any) {
      throw new Error(extractErrorMessage(error, 'Restaurant setup failed.'));
    }
  },

  // User Management
  getUserManagementContext: async (): Promise<any> => {
    try {
      const response = await call.post('ury.setup.api.get_user_management_context', {});
      return response.message;
    } catch (error: any) {
      return { roles: [], existing_users: [] };
    }
  },

  setupUserManagement: async (data: any): Promise<SetupResult> => {
    try {
      const response = await call.post('ury.setup.api.setup_user_management', data);
      return { success: true, message: response.message };
    } catch (error: any) {
      throw new Error(extractErrorMessage(error, 'User setup failed.'));
    }
  },

  // Automatic Demo Setup
  setupUryDemo: async (): Promise<SetupResult> => {
    try {
      await (window as any).frappe.call({
        method: 'ury.setup.setup_wizard.setup_ury_or_erpnext_demo',
        args: {
          setup_ury_demo: 1,
          setup_demo: 0
        }
      });
      return { success: true };
    } catch (error: any) {
      throw new Error(extractErrorMessage(error, 'Automatic setup failed.'));
    }
  },

  // Get Admin Dashboard Stats
  getAdminStats: async (): Promise<any> => {
    try {
      const response = await call.post('ury.setup.api.get_admin_stats', {});
      return response.message;
    } catch (error: any) {
      throw new Error(extractErrorMessage(error, 'Failed to fetch dashboard stats.'));
    }
  },

  // Finalize Onboarding
  completeOnboarding: async (): Promise<SetupResult> => {
    try {
      await call.post('ury.setup.api.complete_onboarding', {});
      return { success: true };
    } catch (error: any) {
      throw new Error(extractErrorMessage(error, 'Failed to complete onboarding.'));
    }
  },
};

