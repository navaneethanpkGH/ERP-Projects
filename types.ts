
export enum VoucherType {
  PAYMENT = 'PAYMENT',
  RECEIPT = 'RECEIPT',
  CONTRA = 'CONTRA',
  JOURNAL = 'JOURNAL',
  SALES = 'SALES',
  PURCHASE = 'PURCHASE',
  PRODUCTION = 'PRODUCTION',
  QUOTATION = 'QUOTATION',
  PURCHASE_ORDER = 'PURCHASE_ORDER'
}

export interface Ledger {
  id: string;
  name: string;
  group: string;
  balance: number;
  address?: string;
  gstin?: string;
  stateCode?: string;
  phone?: string;
  email?: string;
}

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  rate: number;
  category: 'Raw Material' | 'Work In Progress' | 'Finished Good';
  hsnCode?: string;
  taxRate: number; // Percentage
}

export interface VoucherItem {
  itemId: string;
  quantity: number;
  rate: number;
  taxAmount: number;
  total: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  taxPercentage: number;
}

export interface Voucher {
  id: string;
  date: string;
  type: VoucherType;
  refNo: string;
  partyId: string; // The customer or supplier ledger
  contraLedgerId?: string; // For Sales/Purchase, this is the Sales/Purchase account
  items?: VoucherItem[];
  subTotal: number;
  taxTotal: number;
  grandTotal: number;
  narration: string;
  // e-Gov fields
  eInvoiceStatus?: 'NOT_GENERATED' | 'PENDING' | 'GENERATED' | 'CANCELLED';
  irn?: string;
  ackNo?: string;
  eWayBillNo?: string;
  eWayBillStatus?: 'NOT_GENERATED' | 'PENDING' | 'GENERATED';
}

export interface Company {
  id: string;
  name: string;
  address: string;
  gstin: string;
  phone: string;
  email: string;
  website: string;
  logo?: string;
  financialYearStart: string;
  bookBeginningFrom: string;
  country: string;
  currency: string;
  stateCode: string;
}

export type ViewType = 'DASHBOARD' | 'MASTERS' | 'ACCOUNTING' | 'INVOICING' | 'ORDERS' | 'INVENTORY' | 'MANUFACTURING' | 'REPORTS' | 'AI_ASSISTANT' | 'SETTINGS';
