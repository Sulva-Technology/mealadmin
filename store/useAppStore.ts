import { create } from 'zustand';
import { api } from '@/lib/api';
import {
  OrderDtoSchema, PaymentDtoSchema, CampusDtoSchema, RiderDtoSchema, VendorDtoSchema,
  EscalationDtoSchema, SettlementDtoSchema, UserDtoSchema, AuditLogDtoSchema, listEnvelope,
} from '@/lib/schemas/admin';
import {
  mapOrder, mapPayment, mapCampus, mapRider, mapVendor, mapEscalation, mapSettlement,
  mapUser, mapAuditLog, type NameLookup,
} from '@/lib/mappers/admin';

export type Vendor = {
  id: string;
  name: string;
  campus: string;
  status: 'Active' | 'Pending' | 'Suspended';
  rating: number;
  totalOrders: number;
};

export type Order = {
  id: string;
  vendor: string;
  student: string;
  campus: string;
  status: 'Pending' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  amount: number;
  date: string;
};

export type Student = {
  id: string;
  name: string;
  email: string;
  campus: string;
  orders: number;
  joined: string;
};

export type Campus = {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
};

export type Rider = {
  id: string;
  name: string;
  phone: string;
  campus: string;
  status: 'Active' | 'Offline' | 'Suspended';
  deliveries: number;
  rating: number;
};

export type Subscription = {
  id: string;
  student: string;
  plan: string;
  status: 'Active' | 'Expired' | 'Cancelled';
  startDate: string;
  endDate: string;
};

export type Payment = {
  id: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  date: string;
  method: string;
  reference: string;
};

export type Commission = {
  id: string;
  vendor: string;
  amount: number;
  rate: string;
  status: 'Paid' | 'Pending';
  date: string;
};

export type Complaint = {
  id: string;
  user: string;
  subject: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  date: string;
};

export type SystemLog = {
  id: string;
  action: string;
  user: string;
  date: string;
  level: 'Info' | 'Warning' | 'Error';
};

/** Resources backed by the API, used to track per-resource load status. */
export type ResourceKey =
  | 'orders' | 'vendors' | 'students' | 'riders' | 'payments'
  | 'campuses' | 'commissions' | 'complaints' | 'systemLogs';

export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

type AppState = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  activeCampus: string;
  setActiveCampus: (campus: string) => void;
  logout: () => Promise<void>;

  // Per-resource fetch lifecycle.
  status: Record<ResourceKey, LoadStatus>;
  errors: Record<ResourceKey, string | null>;

  campuses: Campus[];
  setCampuses: (campuses: Campus[]) => void;
  addCampus: (campus: Campus) => void;
  updateCampusStatus: (id: string, status: Campus['status']) => void;
  fetchCampuses: () => Promise<void>;

  vendors: Vendor[];
  setVendors: (vendors: Vendor[]) => void;
  updateVendorStatus: (id: string, status: Vendor['status']) => Promise<void>;
  updateVendor: (id: string, vendor: Partial<Vendor>) => void;
  addVendor: (vendor: Vendor) => void;
  deleteVendor: (id: string) => void;
  fetchVendors: () => Promise<void>;

  orders: Order[];
  setOrders: (orders: Order[]) => void;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  fetchOrders: () => Promise<void>;

  students: Student[];
  setStudents: (students: Student[]) => void;
  addStudent: (student: Student) => void;
  fetchStudents: () => Promise<void>;

  riders: Rider[];
  setRiders: (riders: Rider[]) => void;
  addRider: (rider: Rider) => void;
  updateRider: (id: string, rider: Partial<Rider>) => void;
  deleteRider: (id: string) => void;
  fetchRiders: () => Promise<void>;

  subscriptions: Subscription[];
  setSubscriptions: (subscriptions: Subscription[]) => void;
  addSubscription: (subscription: Subscription) => void;

  payments: Payment[];
  setPayments: (payments: Payment[]) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  fetchPayments: () => Promise<void>;

  commissions: Commission[];
  setCommissions: (commissions: Commission[]) => void;
  addCommission: (commission: Commission) => void;
  fetchCommissions: () => Promise<void>;

  complaints: Complaint[];
  setComplaints: (complaints: Complaint[]) => void;
  addComplaint: (complaint: Complaint) => void;
  fetchComplaints: () => Promise<void>;

  systemLogs: SystemLog[];
  setSystemLogs: (logs: SystemLog[]) => void;
  addSystemLog: (log: SystemLog) => void;
  fetchSystemLogs: () => Promise<void>;
};

const RESOURCE_KEYS: ResourceKey[] = [
  'orders', 'vendors', 'students', 'riders', 'payments',
  'campuses', 'commissions', 'complaints', 'systemLogs',
];

const initStatus = () =>
  Object.fromEntries(RESOURCE_KEYS.map(k => [k, 'idle'])) as Record<ResourceKey, LoadStatus>;
const initErrors = () =>
  Object.fromEntries(RESOURCE_KEYS.map(k => [k, null])) as Record<ResourceKey, string | null>;

/** Build an id -> name resolver from a list (falls back to the id). */
const lookup = (list: { id: string; name: string }[]): NameLookup =>
  (id?: string) => list.find(x => x.id === id)?.name ?? id ?? '—';

export const useAppStore = create<AppState>((set, get) => {
  /**
   * Shared fetch lifecycle: mark loading, fetch, parse the { data: [...] }
   * envelope with zod, map DTOs to UI types, then commit. Parse/network
   * failures surface as an error state instead of silently keeping stale data.
   */
  async function load<Dto, UI>(
    key: ResourceKey,
    fetcher: () => Promise<any>,
    schema: { safeParse: (v: unknown) => { success: boolean; data?: Dto } },
    map: (d: Dto) => UI,
    commit: (items: UI[]) => void
  ) {
    set((s) => ({
      status: { ...s.status, [key]: 'loading' },
      errors: { ...s.errors, [key]: null },
    }));
    try {
      const raw = await fetcher();
      const env = listEnvelope(schema as any).safeParse(raw);
      if (!env.success) {
        throw new Error('Unexpected response shape from server.');
      }
      const items = (env.data!.data as Dto[]).map(map);
      commit(items);
      set((s) => ({ status: { ...s.status, [key]: 'success' } }));
    } catch (e: any) {
      console.warn(`Fetch ${key} failed`, e);
      set((s) => ({
        status: { ...s.status, [key]: 'error' },
        errors: { ...s.errors, [key]: e?.message ?? 'Failed to load.' },
      }));
    }
  }

  return {
    activeTab: 'Overview',
    setActiveTab: (tab) => set({ activeTab: tab }),
    isSidebarOpen: true,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    isCommandPaletteOpen: false,
    setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
    activeCampus: 'All Campuses',
    setActiveCampus: (campus) => set({ activeCampus: campus }),
    logout: async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      } finally {
        window.location.href = '/login';
      }
    },

    status: initStatus(),
    errors: initErrors(),

    campuses: [],
    setCampuses: (campuses) => set({ campuses }),
    addCampus: (campus) => set((state) => ({ campuses: [...state.campuses, campus] })),
    updateCampusStatus: (id, status) => set((state) => ({
      campuses: state.campuses.map(c => c.id === id ? { ...c, status } : c),
    })),
    fetchCampuses: () =>
      load('campuses', () => api.getCampuses(), CampusDtoSchema, mapCampus,
        (items) => set({ campuses: items })),

    vendors: [],
    setVendors: (vendors) => set({ vendors }),
    updateVendorStatus: async (id, status) => {
      const prev = get().vendors.find(v => v.id === id)?.status;
      // Optimistic update.
      set((state) => ({
        vendors: state.vendors.map(v => v.id === id ? { ...v, status } : v),
      }));
      try {
        if (status === 'Active') {
          // Pending -> first approval; otherwise reactivation.
          if (prev === 'Pending') await api.approveVendor(id);
          else await api.activateVendor(id);
        } else if (status === 'Suspended') {
          await api.suspendVendor(id);
        }
      } catch (e) {
        console.warn('Update vendor status failed; rolling back', e);
        if (prev) {
          set((state) => ({
            vendors: state.vendors.map(v => v.id === id ? { ...v, status: prev } : v),
          }));
        }
      }
    },
    updateVendor: (id, vendor) => set((state) => ({
      vendors: state.vendors.map(v => v.id === id ? { ...v, ...vendor } : v),
    })),
    addVendor: (vendor) => set((state) => ({ vendors: [...state.vendors, vendor] })),
    deleteVendor: (id) => set((state) => ({ vendors: state.vendors.filter(v => v.id !== id) })),
    fetchVendors: () =>
      load('vendors', () => api.getVendors(), VendorDtoSchema,
        (d) => mapVendor(d, lookup(get().campuses)),
        (items) => set({ vendors: items })),

    orders: [],
    setOrders: (orders) => set({ orders }),
    updateOrderStatus: async (id, status) => {
      const prev = get().orders.find(o => o.id === id)?.status;
      set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status } : o),
      }));
      try {
        await api.updateOrderStatus(id, status);
      } catch (e) {
        console.warn('Update order status failed; rolling back', e);
        if (prev) {
          set((state) => ({
            orders: state.orders.map(o => o.id === id ? { ...o, status: prev } : o),
          }));
        }
      }
    },
    fetchOrders: () =>
      load('orders', () => api.getOrders(), OrderDtoSchema,
        (d) => mapOrder(d, lookup(get().campuses)),
        (items) => set({ orders: items })),

    students: [],
    setStudents: (students) => set({ students }),
    addStudent: (student) => set((state) => ({ students: [...state.students, student] })),
    fetchStudents: () =>
      load('students', () => api.getUsers(), UserDtoSchema,
        (d) => mapUser(d, lookup(get().campuses)),
        (items) => set({ students: items })),

    riders: [],
    setRiders: (riders) => set({ riders }),
    addRider: (rider) => set((state) => ({ riders: [...state.riders, rider] })),
    updateRider: (id, rider) => set((state) => ({
      riders: state.riders.map(r => r.id === id ? { ...r, ...rider } : r),
    })),
    deleteRider: (id) => set((state) => ({ riders: state.riders.filter(r => r.id !== id) })),
    fetchRiders: () =>
      load('riders', () => api.getRiders(), RiderDtoSchema,
        (d) => mapRider(d, lookup(get().campuses)),
        (items) => set({ riders: items })),

    subscriptions: [],
    setSubscriptions: (subscriptions) => set({ subscriptions }),
    addSubscription: (subscription) => set((state) => ({
      subscriptions: [...state.subscriptions, subscription],
    })),

    payments: [],
    setPayments: (payments) => set({ payments }),
    addPayment: (payment) => set((state) => ({ payments: [...state.payments, payment] })),
    updatePayment: (id, payment) => set((state) => ({
      payments: state.payments.map(p => p.id === id ? { ...p, ...payment } : p),
    })),
    deletePayment: (id) => set((state) => ({ payments: state.payments.filter(p => p.id !== id) })),
    fetchPayments: () =>
      load('payments', () => api.getPayments(), PaymentDtoSchema, mapPayment,
        (items) => set({ payments: items })),

    commissions: [],
    setCommissions: (commissions) => set({ commissions }),
    addCommission: (commission) => set((state) => ({
      commissions: [...state.commissions, commission],
    })),
    fetchCommissions: () =>
      load('commissions', () => api.getSettlements(), SettlementDtoSchema,
        (d) => mapSettlement(d, lookup(get().vendors)),
        (items) => set({ commissions: items })),

    complaints: [],
    setComplaints: (complaints) => set({ complaints }),
    addComplaint: (complaint) => set((state) => ({ complaints: [...state.complaints, complaint] })),
    fetchComplaints: () =>
      load('complaints', () => api.getEscalations(), EscalationDtoSchema, mapEscalation,
        (items) => set({ complaints: items })),

    systemLogs: [],
    setSystemLogs: (systemLogs) => set({ systemLogs }),
    addSystemLog: (log) => set((state) => ({ systemLogs: [...state.systemLogs, log] })),
    fetchSystemLogs: () =>
      load('systemLogs', () => api.getSystemLogs(), AuditLogDtoSchema, mapAuditLog,
        (items) => set({ systemLogs: items })),
  };
});
