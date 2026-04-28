import { call } from './frappe-sdk';

// ─── Types ────────────────────────────────────────────────────────────

export interface SetupResult {
  success: boolean;
  message?: string;
  data?: unknown;
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
  language?: string;
  tax_system?: string;
  tax_number?: string;
  installation_type?: 'minimal' | 'advanced';
  generate_demo_data?: boolean | number;
}

export interface SetupOrganizationResponse {
  status: 'success' | 'error';
  message: string;
  home_url?: string;
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

export interface BranchData {
  branch_name: string;
  branch_phone: string;
  branch_email: string;
  branch_address: string;
}

export interface RestaurantData {
  restaurant_name: string;
  tagline: string;
  type: string;
  opening_time: string;
  closing_time: string;
}

export interface RoomData {
  name: string;
  seats: number;
}

export interface TableData {
  name: string;
  seats: number;
  room: string;
}

export interface PrinterData {
  printer_name: string;
  server_ip: string;
  port: string;
  bill: boolean;
}

export interface PaymentData {
  name: string;
  type: string;
}

export interface UserData {
  name: string;
  role: string;
}

export interface AdminStats {
  restaurants: number;
  branches: number;
  items: number;
  users: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────

const MAX_CSV_SIZE_MB = 5;

/**
 * Extracts a human-readable message from Frappe's server error format.
 */
function extractErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback;

  const err = error as Record<string, unknown>;

  if (err._server_messages && typeof err._server_messages === 'string') {
    try {
      const messages = JSON.parse(err._server_messages) as string[];
      const first = JSON.parse(messages[0]) as { message?: string };
      if (first?.message) return first.message;
    } catch {
      // malformed, fall through
    }
  }

  if (typeof err.exception === 'string') return err.exception;
  if (typeof err.message === 'string' && err.message !== 'undefined') return err.message;

  return fallback;
}


// ─── API Implementation ───────────────────────────────────────────────

export const onboardsetupApi = {
  // Check setup status
  checkSetupStatus: async (): Promise<{ needsOnboarding: boolean }> => {
    try {
      const frappe = (window as any).frappe;
      const response = await frappe.call('ury.setup.setup_organization.check_setup_status');
      return { needsOnboarding: !response.message?.setup_complete };
    } catch (e) {
      return { needsOnboarding: true };
    }
  },

  // Organization Setup
  setupOrganization: async (payload: SetupOrganizationPayload): Promise<SetupOrganizationResponse> => {
    try {
      const response = await call.post<{ message: SetupOrganizationResponse }>(
        'ury.setup.setup_organization.setup_organization',
        payload
      );
      return response.message;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Organization setup failed.'));
    }
  },

  // Menu Upload
  uploadMenuCSV: async (file: File): Promise<UploadMenuCSVResponse['message']> => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      throw new Error('Only CSV files are supported.');
    }
    const maxBytes = MAX_CSV_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) throw new Error(`File too large (max ${MAX_CSV_SIZE_MB}MB).`);
    if (file.size === 0) throw new Error('File is empty.');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const frappe = (window as any).frappe;
      const csrfToken = frappe?.csrf_token ||
        document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1] || '';

      const res = await fetch('/api/method/ury.setup.setup_organization.upload_menu_csv', {
        method: 'POST',
        headers: { 'X-Frappe-CSRF-Token': csrfToken },
        body: formData,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(extractErrorMessage(errBody, 'CSV upload failed.'));
      }

      const json = await res.json() as UploadMenuCSVResponse;
      return json.message;
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error(extractErrorMessage(error, 'Failed to upload CSV.'));
    }
  },

  // Menu Setup
  setupMenu: async (payload: SetupMenuPayload): Promise<SetupResult> => {
    try {
      const response = await call.post<SetupMenuResponse>(
        'ury.setup.setup_organization.setup_menu',
        payload
      );
      return { success: true, message: response.message.message };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Menu setup failed.'));
    }
  },

  // Printer Setup
  getPrinterContext: async (): Promise<PrinterData> => {
    try {
      const response = await call.post<{ message: PrinterData }>('ury.setup.setup_organization.get_printer_context', {});
      return response.message;
    } catch (error) {
      return { printer_name: '', server_ip: '', port: '9100', bill: true };
    }
  },

  setupPrinter: async (data: PrinterData): Promise<SetupResult> => {
    try {
      const response = await call.post<{ message: string }>('ury.setup.setup_organization.setup_printer', data);
      return { success: true, message: response.message };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Printer setup failed.'));
    }
  },

  // Room Setup
  getRoomContext: async (): Promise<{ rooms: RoomData[] }> => {
    try {
      const response = await call.post<{ message: { rooms: RoomData[] } }>('ury.setup.setup_organization.get_room_context', {});
      return response.message;
    } catch (error) {
      return { rooms: [] };
    }
  },

  setupRoom: async (data: RoomData[]): Promise<SetupResult> => {
    try {
      await onboardsetupApi.updateBusinessSetup({
        rooms: data.map(r => ({
          name: r.name,
          seats: r.seats
        }))
      });
      return { success: true };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Room setup failed.'));
    }
  },

  // Table Setup
  getTableContext: async (): Promise<{ rooms: string[]; tables: TableData[] }> => {
    try {
      const response = await call.post<{ message: { rooms: string[]; tables: TableData[] } }>('ury.setup.setup_organization.get_table_context', {});
      return response.message;
    } catch (error) {
      return { rooms: [], tables: [] };
    }
  },

  setupTable: async (data: { tables: TableData[] }): Promise<SetupResult> => {
    try {
      await onboardsetupApi.updateBusinessSetup({
        tables: data.tables.map(t => ({
          name: t.name,
          seats: t.seats,
          room: t.room
        }))
      });
      return { success: true };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Table setup failed.'));
    }
  },

  // Mode of Payment
  getMopContext: async (): Promise<{ payment_methods: PaymentData[] }> => {
    try {
      const response = await call.post<{ message: { payment_methods: PaymentData[] } }>('ury.setup.setup_organization.get_mop_context', {});
      return response.message;
    } catch (error) {
      return { payment_methods: [] };
    }
  },

  setupMop: async (data: { payments: PaymentData[] }): Promise<SetupResult> => {
    try {
      const response = await call.post<{ message: string }>('ury.setup.setup_organization.setup_mop', data);
      return { success: true, message: response.message };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Payment setup failed.'));
    }
  },

  // Branch Setup
  getBranchContext: async (): Promise<BranchData> => {
    try {
      const response = await onboardsetupApi.getBusinessSetup();
      if (response.data.branches.length > 0) {
        const b = response.data.branches[0];
        return {
          branch_name: b.branch || '',
          branch_phone: '',
          branch_email: '',
          branch_address: b.address || ''
        };
      }
      return { branch_name: '', branch_phone: '', branch_email: '', branch_address: '' };
    } catch (error) {
      return { branch_name: '', branch_phone: '', branch_email: '', branch_address: '' };
    }
  },

  setupBranch: async (data: BranchData): Promise<SetupResult> => {
    try {
      await onboardsetupApi.updateBusinessSetup({
        branches: [{
          branch: data.branch_name,
          address: data.branch_address
        }]
      });
      return { success: true };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Branch setup failed.'));
    }
  },

  // Restaurant Setup
  getRestaurantContext: async (): Promise<RestaurantData> => {
    try {
      const response = await onboardsetupApi.getBusinessSetup();
      const r = response.data.restaurant;
      return {
        restaurant_name: r.restaurant_name || '',
        tagline: r.tagline || '',
        type: r.type || 'casual_dining',
        opening_time: r.opening_time || '09:00',
        closing_time: r.closing_time || '23:00'
      };
    } catch (error) {
      return { restaurant_name: '', tagline: '', type: 'casual_dining', opening_time: '09:00', closing_time: '23:00' };
    }
  },

  setupRestaurant: async (data: RestaurantData): Promise<SetupResult> => {
    try {
      await onboardsetupApi.updateBusinessSetup({
        restaurant: {
          restaurant_name: data.restaurant_name,
          tagline: data.tagline,
          type: data.type,
          opening_time: data.opening_time,
          closing_time: data.closing_time
        }
      });
      return { success: true };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Restaurant setup failed.'));
    }
  },

  // Business Setup Unified
  getBusinessSetup: async (): Promise<{ status: string; data: any }> => {
    const res = await call.post<{ message: any }>('ury.setup.setup_organization.get_business_setup', {});
    return res.message;
  },

  updateBusinessSetup: async (data: any): Promise<{ status: string }> => {
    const res = await call.post<{ message: any }>('ury.setup.setup_organization.update_business_setup', data);
    return res.message;
  },

  // User Management
  getUserManagementContext: async (): Promise<{ roles: string[]; existing_users: UserData[] }> => {
    try {
      const response = await call.post<{ message: { roles: string[]; existing_users: UserData[] } }>('ury.setup.setup_organization.get_user_management_context', {});
      return response.message;
    } catch (error) {
      return { roles: [], existing_users: [] };
    }
  },

  setupUserManagement: async (data: { users: UserData[] }): Promise<SetupResult> => {
    try {
      const response = await call.post<{ message: string }>('ury.setup.setup_organization.setup_user_management', data);
      return { success: true, message: response.message };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'User setup failed.'));
    }
  },

  // Automatic Demo Setup
  setupUryDemo: async (): Promise<SetupResult> => {
    try {
      const frappe = (window as any).frappe;
      await frappe.call({
        method: 'ury.setup.setup_wizard.setup_ury_or_erpnext_demo',
        args: {
          setup_ury_demo: 1,
          setup_demo: 0
        }
      });
      return { success: true };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Automatic setup failed.'));
    }
  },

  // Get Admin Dashboard Stats
  getAdminStats: async (): Promise<AdminStats> => {
    try {
      const response = await call.post<{ message: AdminStats }>('ury.setup.setup_organization.get_admin_stats', {});
      return response.message;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Failed to fetch dashboard stats.'));
    }
  },

  getOrganizationContext: async (): Promise<SetupOrganizationPayload & { has_company?: boolean }> => {
    const res = await call.post<{ message: SetupOrganizationPayload & { has_company?: boolean } }>('ury.setup.setup_organization.get_organization_context', {});
    return res.message;
  },

  getMenuContext: async (): Promise<{ message: SetupMenuPayload }> => {
    return await call.post('ury.setup.setup_organization.get_menu_context', {});
  },

  getUserContext: async (): Promise<{ message: UserData }> => {
    return await call.post('ury.setup.setup_organization.get_user_context', {});
  },

  // Finalize Onboarding
  completeOnboarding: async (): Promise<SetupResult> => {
    try {
      await call.post('ury.setup.setup_organization.complete_onboarding', {});
      return { success: true };
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Failed to complete onboarding.'));
    }
  },

};


