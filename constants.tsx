
import { Ledger, StockItem, VoucherType, BillOfMaterials, Company } from './types';

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'c1',
    name: 'Forge Manufacturing Ltd',
    address: '123 Industrial Estate, Phase 1, Pune, MH - 411001',
    gstin: '27ABCDE1234F1Z5',
    phone: '+91 20 2543 6789',
    email: 'info@forgemfg.com',
    website: 'www.forgemfg.com',
    financialYearStart: '2026-04-01',
    bookBeginningFrom: '2026-04-01',
    country: 'India',
    currency: 'INR',
    stateCode: '27'
  }
];

export const INITIAL_LEDGERS: Ledger[] = [
  { id: 'l1', name: 'Main Cash', group: 'Cash-in-Hand', balance: 500000 },
  { id: 'l2', name: 'ICICI Bank Ltd', group: 'Bank Accounts', balance: 1200000 },
  { 
    id: 'l3', 
    name: 'Reliance Steel Systems', 
    group: 'Sundry Creditors', 
    balance: -150000,
    address: 'Survey No. 12, Industrial Area, Mumbai',
    gstin: '27AAAAA0000A1Z5',
    phone: '+91 98765 43210',
    stateCode: '27'
  },
  { 
    id: 'l4', 
    name: 'Precision Auto Parts Inc', 
    group: 'Sundry Debtors', 
    balance: 450000,
    address: 'Plot 45, Automotive Hub, Bangalore',
    gstin: '29BBBBB1111B2Z6',
    phone: '+91 88888 77777',
    stateCode: '29'
  },
  { id: 'l5', name: 'Domestic Sales Account', group: 'Sales Accounts', balance: 0 },
  { id: 'l6', name: 'Local Purchase Account', group: 'Purchase Accounts', balance: 0 },
  { id: 'l7', name: 'Factory Rent', group: 'Indirect Expenses', balance: 0 },
  { id: 'l8', name: 'Worker Wages', group: 'Direct Expenses', balance: 0 },
  { id: 'l9', name: 'Output CGST', group: 'Duties & Taxes', balance: 0 },
  { id: 'l10', name: 'Output SGST', group: 'Duties & Taxes', balance: 0 },
  { id: 'l11', name: 'Output IGST', group: 'Duties & Taxes', balance: 0 },
  { id: 'l12', name: 'Input CGST', group: 'Duties & Taxes', balance: 0 },
  { id: 'l13', name: 'Input SGST', group: 'Duties & Taxes', balance: 0 },
  { id: 'l14', name: 'Input IGST', group: 'Duties & Taxes', balance: 0 },
];

export const INITIAL_STOCK: StockItem[] = [
  { id: 's1', name: 'Cold Rolled Steel Coils', unit: 'kg', quantity: 1500, rate: 85, category: 'Raw Material', hsnCode: '7211', taxRate: 18 },
  { id: 's2', name: 'Precision M8 Bolts', unit: 'pcs', quantity: 5000, rate: 12, category: 'Raw Material', hsnCode: '7318', taxRate: 12 },
  { id: 's3', name: 'Hydraulic Press HP-200', unit: 'pcs', quantity: 5, rate: 85000, category: 'Finished Good', hsnCode: '8462', taxRate: 18 },
];

export const INITIAL_UNITS: string[] = ['kg', 'pcs', 'liters', 'meters', 'boxes', 'rolls'];

export const INITIAL_BOMS: BillOfMaterials[] = [
  {
    id: 'b1',
    finishedGoodId: 's3',
    components: [
      { itemId: 's1', quantity: 120 },
      { itemId: 's2', quantity: 50 },
      { itemId: 's4', quantity: 5 },
    ]
  }
];
