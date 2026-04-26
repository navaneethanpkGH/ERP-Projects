
import React, { useState } from 'react';
import { 
  Plus, 
  Users, 
  Package, 
  Ruler, 
  Search, 
  X, 
  CheckCircle2,
  Trash2,
  PlusCircle,
  UserCheck,
  Truck,
  Edit2
} from 'lucide-react';
import { Ledger, StockItem } from '../types';

interface MastersProps {
  ledgers: Ledger[];
  inventory: StockItem[];
  units: string[];
  onAddLedger: (l: Omit<Ledger, 'id'>) => void;
  onUpdateLedger: (l: Ledger) => void;
  onAddStockItem: (s: Omit<StockItem, 'id'>) => void;
  onUpdateStockItem: (s: StockItem) => void;
  onAddUnit: (u: string) => void;
}

const LEDGER_GROUPS = [
  'Sundry Debtors',
  'Sundry Creditors',
  'Bank Accounts',
  'Cash-in-Hand',
  'Sales Accounts',
  'Purchase Accounts',
  'Indirect Expenses',
  'Direct Expenses',
  'Fixed Assets'
];

const STOCK_CATEGORIES = ['Raw Material', 'Work In Progress', 'Finished Good'] as const;

type ActiveTab = 'CUSTOMERS' | 'SUPPLIERS' | 'LEDGERS' | 'PRODUCTS' | 'UNITS';

const Masters: React.FC<MastersProps> = ({ 
  ledgers, 
  inventory, 
  units, 
  onAddLedger, 
  onUpdateLedger,
  onAddStockItem, 
  onUpdateStockItem,
  onAddUnit 
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('CUSTOMERS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form States
  const [ledgerForm, setLedgerForm] = useState({ 
    name: '', 
    group: 'Sundry Debtors', 
    balance: 0,
    address: '',
    gstin: '',
    stateCode: '',
    phone: '',
    email: '',
    creditDays: 30
  });
  const [productForm, setProductForm] = useState<Omit<StockItem, 'id'>>({ 
    name: '', 
    unit: units[0] || 'pcs', 
    quantity: 0, 
    rate: 0, 
    category: 'Raw Material',
    hsnCode: '',
    taxRate: 18,
    description: '',
    reorderLevel: 10
  });
  const [unitForm, setUnitForm] = useState('');

  const resetForms = () => {
    setLedgerForm({ 
      name: '', 
      group: 'Sundry Debtors', 
      balance: 0,
      address: '',
      gstin: '',
      stateCode: '',
      phone: '',
      email: '',
      creditDays: 30
    });
    setProductForm({ 
      name: '', 
      unit: units[0] || 'pcs', 
      quantity: 0, 
      rate: 0, 
      category: 'Raw Material',
      hsnCode: '',
      taxRate: 18,
      description: '',
      reorderLevel: 10
    });
    setUnitForm('');
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'CUSTOMERS' || activeTab === 'SUPPLIERS' || activeTab === 'LEDGERS') {
      if (editingId) {
        onUpdateLedger({ ...ledgerForm, id: editingId } as Ledger);
      } else {
        onAddLedger(ledgerForm);
      }
    } else if (activeTab === 'PRODUCTS') {
      if (editingId) {
        onUpdateStockItem({ ...productForm, id: editingId } as StockItem);
      } else {
        onAddStockItem(productForm);
      }
    } else if (activeTab === 'UNITS') {
      if (unitForm.trim()) {
        onAddUnit(unitForm.trim());
      }
    }
    resetForms();
    setIsModalOpen(false);
  };

  const handleOpenModalForAdd = () => {
    resetForms();
    if (activeTab === 'CUSTOMERS') {
      setLedgerForm(prev => ({ ...prev, group: 'Sundry Debtors' }));
    } else if (activeTab === 'SUPPLIERS') {
      setLedgerForm(prev => ({ ...prev, group: 'Sundry Creditors' }));
    }
    setIsModalOpen(true);
  };

  const handleEditLedger = (l: Ledger) => {
    setEditingId(l.id);
    setLedgerForm({
      name: l.name,
      group: l.group,
      balance: l.balance,
      address: l.address || '',
      gstin: l.gstin || '',
      stateCode: l.stateCode || '',
      phone: l.phone || '',
      email: l.email || '',
      creditDays: l.creditDays || 30
    });
    setIsModalOpen(true);
  };

  const handleEditProduct = (p: StockItem) => {
    setEditingId(p.id);
    setProductForm({
      name: p.name,
      unit: p.unit,
      quantity: p.quantity,
      rate: p.rate,
      category: p.category,
      hsnCode: p.hsnCode || '',
      taxRate: p.taxRate || 18,
      description: p.description || '',
      reorderLevel: p.reorderLevel || 10
    });
    setIsModalOpen(true);
  };

  const filteredLedgers = ledgers.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         l.group.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'CUSTOMERS') return matchesSearch && l.group === 'Sundry Debtors';
    if (activeTab === 'SUPPLIERS') return matchesSearch && l.group === 'Sundry Creditors';
    if (activeTab === 'LEDGERS') return matchesSearch && !['Sundry Debtors', 'Sundry Creditors'].includes(l.group);
    return false;
  });

  const filteredProducts = inventory.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getModalTitle = () => {
    const action = editingId ? 'Edit' : 'New';
    switch(activeTab) {
      case 'CUSTOMERS': return `${action} Customer Master`;
      case 'SUPPLIERS': return `${action} Supplier Master`;
      case 'LEDGERS': return `${action} Account Master`;
      case 'PRODUCTS': return `${action} Product Master`;
      case 'UNITS': return 'Create Unit Measure';
      default: return `${action} Master`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Master Data Management</h2>
          <p className="text-slate-500">Centralized database for products, accounts, and configurations.</p>
        </div>
        <button 
          onClick={handleOpenModalForAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus size={20} />
          {activeTab === 'CUSTOMERS' ? 'Add Customer' : activeTab === 'SUPPLIERS' ? 'Add Supplier' : activeTab === 'PRODUCTS' ? 'New Product' : 'New Master'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-200/50 rounded-2xl w-fit">
        <button 
          onClick={() => { setActiveTab('CUSTOMERS'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'CUSTOMERS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserCheck size={18} />
          Customers
        </button>
        <button 
          onClick={() => { setActiveTab('SUPPLIERS'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'SUPPLIERS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Truck size={18} />
          Suppliers
        </button>
        <button 
          onClick={() => { setActiveTab('PRODUCTS'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'PRODUCTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package size={18} />
          Products
        </button>
        <button 
          onClick={() => { setActiveTab('LEDGERS'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'LEDGERS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={18} />
          General Ledger
        </button>
        <button 
          onClick={() => { setActiveTab('UNITS'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'UNITS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Ruler size={18} />
          Units
        </button>
      </div>

      {/* Search Bar (except for Units) */}
      {activeTab !== 'UNITS' && (
        <div className="bg-white p-4 rounded-2xl tally-shadow flex items-center gap-3 border border-slate-100">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            className="bg-transparent border-none focus:ring-0 text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* Grid Content */}
      <div className="bg-white rounded-2xl tally-shadow overflow-hidden border border-slate-100">
        {(activeTab === 'CUSTOMERS' || activeTab === 'SUPPLIERS' || activeTab === 'LEDGERS') && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">{activeTab === 'CUSTOMERS' ? 'Customer Name' : activeTab === 'SUPPLIERS' ? 'Supplier Name' : 'Account Name'}</th>
                  <th className="px-6 py-4">Group</th>
                  {(activeTab === 'CUSTOMERS' || activeTab === 'SUPPLIERS') && (
                    <>
                      <th className="px-6 py-4 text-center">GSTIN</th>
                      <th className="px-6 py-4">Phone</th>
                    </>
                  )}
                  <th className="px-6 py-4 text-right">Balance</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLedgers.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors text-sm group">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-slate-800">{l.name}</div>
                        {l.address && <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{l.address}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                        l.group === 'Sundry Debtors' ? 'bg-green-50 text-green-600' :
                        l.group === 'Sundry Creditors' ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {l.group}
                      </span>
                    </td>
                    {(activeTab === 'CUSTOMERS' || activeTab === 'SUPPLIERS') && (
                      <>
                        <td className="px-6 py-4 text-center font-mono text-[11px] text-slate-500">
                          {l.gstin || '-'}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {l.phone || '-'}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-600">
                      ${Math.abs(l.balance).toLocaleString()} {l.balance >= 0 ? 'Dr' : 'Cr'}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button 
                        onClick={() => handleEditLedger(l)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                       >
                          <Edit2 size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
                {filteredLedgers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                      No {activeTab.toLowerCase()} found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'PRODUCTS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Rate</th>
                  <th className="px-6 py-4 text-center">GST (%)</th>
                  <th className="px-6 py-4 text-right">In Stock</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-700">{p.name}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500">{p.category}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-indigo-600">
                      ${p.rate.toLocaleString()} / {p.unit}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-600">
                      {p.taxRate}%
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">
                      {p.quantity.toLocaleString()} {p.unit}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button 
                        onClick={() => handleEditProduct(p)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                       >
                          <Edit2 size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'UNITS' && (
          <div className="p-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
             {units.map(u => (
               <div key={u} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wider">{u}</span>
                  <CheckCircle2 size={16} className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>
             ))}
             <button 
              onClick={() => { resetForms(); setIsModalOpen(true); }}
              className="p-4 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all font-bold text-xs gap-2"
             >
                <PlusCircle size={20} />
                Add Unit
             </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white rounded-3xl w-full ${(activeTab === 'CUSTOMERS' || activeTab === 'SUPPLIERS' || activeTab === 'PRODUCTS') ? 'max-w-xl' : 'max-w-md'} overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200`}>
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{getModalTitle()}</h3>
              <button 
                onClick={() => { setIsModalOpen(false); setEditingId(null); }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              {(activeTab === 'CUSTOMERS' || activeTab === 'SUPPLIERS' || activeTab === 'LEDGERS') && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                         {activeTab === 'CUSTOMERS' ? 'Customer Name' : activeTab === 'SUPPLIERS' ? 'Supplier Name' : 'Ledger Name'}
                      </label>
                      <input 
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                        value={ledgerForm.name}
                        onChange={e => setLedgerForm({...ledgerForm, name: e.target.value})}
                        placeholder={activeTab === 'CUSTOMERS' ? "e.g. Acme Corp" : activeTab === 'SUPPLIERS' ? "e.g. Global Logistics" : "e.g. Electricity Bill"}
                      />
                    </div>

                    {(activeTab === 'CUSTOMERS' || activeTab === 'SUPPLIERS') && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Detailed Address</label>
                        <textarea 
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                          value={ledgerForm.address}
                          onChange={e => setLedgerForm({...ledgerForm, address: e.target.value})}
                          placeholder="Street, City, ZIP..."
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Group Type</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm disabled:opacity-50 font-bold"
                        value={ledgerForm.group}
                        onChange={e => setLedgerForm({...ledgerForm, group: e.target.value})}
                        disabled={activeTab === 'CUSTOMERS' || activeTab === 'SUPPLIERS'}
                      >
                        {LEDGER_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phone Number</label>
                      <input 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                        value={ledgerForm.phone}
                        onChange={e => setLedgerForm({...ledgerForm, phone: e.target.value})}
                        placeholder="+91 00000 00000"
                      />
                    </div>

                    {(activeTab === 'CUSTOMERS' || activeTab === 'SUPPLIERS') && (
                      <>
                        <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">GSTIN</label>
                              <input 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm uppercase font-mono"
                                value={ledgerForm.gstin}
                                onChange={e => setLedgerForm({...ledgerForm, gstin: e.target.value})}
                                placeholder="27AAAAA0000A1Z5"
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">State Code</label>
                              <input 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
                                value={ledgerForm.stateCode}
                                onChange={e => setLedgerForm({...ledgerForm, stateCode: e.target.value})}
                                placeholder="e.g. 27"
                              />
                           </div>
                        </div>
                      </>
                    )}

                    <div className={(activeTab === 'CUSTOMERS' || activeTab === 'SUPPLIERS') ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Opening Balance</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-slate-400 font-bold text-xs">$</span>
                        <input 
                          type="number"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-7 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono font-bold"
                          value={ledgerForm.balance}
                          onChange={e => setLedgerForm({...ledgerForm, balance: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'PRODUCTS' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Product Name</label>
                    <input 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-bold"
                      value={productForm.name}
                      onChange={e => setProductForm({...productForm, name: e.target.value})}
                      placeholder="e.g. Aluminum Shaft v2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-bold"
                      value={productForm.category}
                      onChange={e => setProductForm({...productForm, category: e.target.value as any})}
                    >
                      {STOCK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unit</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-bold"
                      value={productForm.unit}
                      onChange={e => setProductForm({...productForm, unit: e.target.value})}
                    >
                      {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">HSN/SAC Code</label>
                    <input 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
                      value={productForm.hsnCode}
                      onChange={e => setProductForm({...productForm, hsnCode: e.target.value})}
                      placeholder="e.g. 8481"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">GST Rate (%)</label>
                    <input 
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
                      value={productForm.taxRate}
                      onChange={e => setProductForm({...productForm, taxRate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Opening Stock</label>
                    <input 
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
                      value={productForm.quantity}
                      onChange={e => setProductForm({...productForm, quantity: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unit Rate</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3.5 text-slate-400 font-bold text-xs">$</span>
                        <input 
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-7 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono font-bold"
                        value={productForm.rate}
                        onChange={e => setProductForm({...productForm, rate: parseFloat(e.target.value) || 0})}
                        />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description / Specs</label>
                    <textarea 
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                        value={productForm.description}
                        onChange={e => setProductForm({...productForm, description: e.target.value})}
                        placeholder="Technical details, grades, etc."
                    />
                  </div>
                </div>
              )}

              {activeTab === 'UNITS' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Standard Unit ID</label>
                  <input 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-bold uppercase"
                    value={unitForm}
                    onChange={e => setUnitForm(e.target.value)}
                    placeholder="e.g. sqft, drums, cartons"
                  />
                  <p className="mt-2 text-[10px] text-slate-400">Unique abbreviation for measurement tracking.</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                  className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  {editingId ? 'Update Master' : 'Save Master'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Masters;
