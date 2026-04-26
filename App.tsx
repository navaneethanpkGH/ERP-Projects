
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import Accounting from './views/Accounting';
import AIAssistant from './views/AIAssistant';
import Manufacturing from './views/Manufacturing';
import Masters from './views/Masters';
import Settings from './views/Settings';
import Invoicing from './views/Invoicing';
import Orders from './views/Orders';
import Reports from './views/Reports';
import { 
  ViewType, 
  Ledger, 
  StockItem, 
  Voucher, 
  VoucherType, 
  BillOfMaterials,
  Company 
} from './types';
import { 
  INITIAL_LEDGERS, 
  INITIAL_STOCK, 
  INITIAL_BOMS,
  INITIAL_UNITS,
  INITIAL_COMPANIES
} from './constants';
import { Package, Factory, BarChart3, Settings as SettingsIcon, Bell, Building2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('DASHBOARD');
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(INITIAL_COMPANIES[0].id);
  
  // Scoped Data State
  const [companyData, setCompanyData] = useState<Record<string, { 
    ledgers: Ledger[]; 
    inventory: StockItem[]; 
    vouchers: Voucher[]; 
    boms: BillOfMaterials[];
    units: string[];
  }>>({
    [INITIAL_COMPANIES[0].id]: {
      ledgers: INITIAL_LEDGERS,
      inventory: INITIAL_STOCK,
      vouchers: [],
      boms: INITIAL_BOMS,
      units: INITIAL_UNITS
    }
  });

  const activeCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];
  const activeData = companyData[selectedCompanyId] || { 
    ledgers: [], 
    inventory: [], 
    vouchers: [], 
    boms: [],
    units: INITIAL_UNITS 
  };

  const updateActiveData = (updater: (prev: typeof activeData) => typeof activeData) => {
    setCompanyData(prev => ({
      ...prev,
      [selectedCompanyId]: updater(prev[selectedCompanyId] || activeData)
    }));
  };

  const handleAddVoucher = (newV: Omit<Voucher, 'id'>) => {
    const voucher: Voucher = { ...newV, id: `v${Date.now()}` };
    updateActiveData(prev => ({
      ...prev,
      vouchers: [...prev.vouchers, voucher],
      ledgers: [VoucherType.QUOTATION, VoucherType.PURCHASE_ORDER, VoucherType.PRODUCTION].includes(voucher.type) 
        ? prev.ledgers 
        : prev.ledgers.map(l => {
        // Accounting update logic
        if (voucher.type === VoucherType.SALES) {
          if (l.id === voucher.partyId) return { ...l, balance: l.balance + voucher.grandTotal }; // Debtor Dr
          if (l.id === voucher.contraLedgerId) return { ...l, balance: l.balance - voucher.subTotal }; // Sales Account Cr
          
          // Automated Tax Posting
          const cgst = voucher.items?.reduce((sum, item) => sum + (item.cgstAmount || 0), 0) || 0;
          const sgst = voucher.items?.reduce((sum, item) => sum + (item.sgstAmount || 0), 0) || 0;
          const igst = voucher.items?.reduce((sum, item) => sum + (item.igstAmount || 0), 0) || 0;
          
          if (l.name === 'Output CGST') return { ...l, balance: l.balance - cgst };
          if (l.name === 'Output SGST') return { ...l, balance: l.balance - sgst };
          if (l.name === 'Output IGST') return { ...l, balance: l.balance - igst };
        } else if (voucher.type === VoucherType.PURCHASE) {
          if (l.id === voucher.partyId) return { ...l, balance: l.balance - voucher.grandTotal }; // Creditor Cr
          if (l.id === voucher.contraLedgerId) return { ...l, balance: l.balance + voucher.subTotal }; // Purchase Account Dr
          
          // Automated Tax Posting
          const cgst = voucher.items?.reduce((sum, item) => sum + (item.cgstAmount || 0), 0) || 0;
          const sgst = voucher.items?.reduce((sum, item) => sum + (item.sgstAmount || 0), 0) || 0;
          const igst = voucher.items?.reduce((sum, item) => sum + (item.igstAmount || 0), 0) || 0;

          if (l.name === 'Input CGST') return { ...l, balance: l.balance + cgst };
          if (l.name === 'Input SGST') return { ...l, balance: l.balance + sgst };
          if (l.name === 'Input IGST') return { ...l, balance: l.balance + igst };
        } else {
          // Journal logic (simplified)
          // For legacy vouchers where we used debitLedgerId and creditLedgerId
          const v = voucher as any;
          if (l.id === v.debitLedgerId) return { ...l, balance: l.balance + (v.amount || v.grandTotal) };
          if (l.id === v.creditLedgerId) return { ...l, balance: l.balance - (v.amount || v.grandTotal) };
        }
        return l;
      })
    }));
  };

  const handleUpdateInventory = (itemId: string, qty: number) => {
    updateActiveData(prev => ({
      ...prev,
      inventory: prev.inventory.map(i => i.id === itemId ? { ...i, quantity: i.quantity + qty } : i)
    }));
  };

  const handleAddLedger = (newL: Omit<Ledger, 'id'>) => {
    const ledger: Ledger = { ...newL, id: `l${Date.now()}` };
    updateActiveData(prev => ({ ...prev, ledgers: [...prev.ledgers, ledger] }));
  };

  const handleAddStockItem = (newS: Omit<StockItem, 'id'>) => {
    const item: StockItem = { ...newS, id: `s${Date.now()}` };
    updateActiveData(prev => ({ ...prev, inventory: [...prev.inventory, item] }));
  };

  const handleUpdateStockItem = (updated: StockItem) => {
    updateActiveData(prev => ({
      ...prev,
      inventory: prev.inventory.map(i => i.id === updated.id ? updated : i)
    }));
  };

  const handleUpdateLedger = (updated: Ledger) => {
    updateActiveData(prev => ({
      ...prev,
      ledgers: prev.ledgers.map(l => l.id === updated.id ? updated : l)
    }));
  };

  const handleAddUnit = (u: string) => {
    updateActiveData(prev => ({
      ...prev,
      units: prev.units.includes(u) ? prev.units : [...prev.units, u]
    }));
  };

  const handleAddCompany = (newC: Omit<Company, 'id'>) => {
    const id = `c${Date.now()}`;
    const company: Company = { ...newC, id };
    setCompanies([...companies, company]);
    setCompanyData(prev => ({
      ...prev,
      [id]: {
        ledgers: INITIAL_LEDGERS.map(l => ({ ...l, balance: 0, id: `l-${id}-${l.id}` })), // Start with 0 balance for new company
        inventory: [],
        vouchers: [],
        boms: [],
        units: INITIAL_UNITS
      }
    }));
    setSelectedCompanyId(id);
  };

  const handleUpdateCompany = (updated: Company) => {
    setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleBackup = () => {
    const data = {
      companies,
      selectedCompanyId,
      companyData,
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ForgeERP_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestore = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.companies && data.companyData) {
        setCompanies(data.companies);
        setCompanyData(data.companyData);
        if (data.selectedCompanyId) {
          setSelectedCompanyId(data.selectedCompanyId);
        }
        alert('Data restored successfully!');
      } else {
        alert('Invalid data format. Restore failed.');
      }
    } catch (error) {
      console.error('Restore error:', error);
      alert('Error parsing restore file.');
    }
  };

  const renderContent = () => {
    const { ledgers, inventory, vouchers, boms, units } = activeData;

    switch (activeView) {
      case 'DASHBOARD':
        return <Dashboard ledgers={ledgers} inventory={inventory} currency={activeCompany.currency} />;
      case 'MASTERS':
        return (
          <Masters 
            ledgers={ledgers}
            inventory={inventory}
            units={units}
            onAddLedger={handleAddLedger}
            onUpdateLedger={handleUpdateLedger}
            onAddStockItem={handleAddStockItem}
            onUpdateStockItem={handleUpdateStockItem}
            onAddUnit={handleAddUnit}
          />
        );
      case 'ACCOUNTING':
        return (
          <Accounting 
            ledgers={ledgers} 
            currency={activeCompany.currency}
            onAddVoucher={handleAddVoucher} 
            onAddLedger={handleAddLedger} 
            activeCompany={activeCompany}
          />
        );
      case 'INVOICING':
        return (
          <Invoicing 
            ledgers={ledgers}
            inventory={inventory}
            activeCompany={activeCompany}
            onAddVoucher={handleAddVoucher}
            onUpdateInventory={handleUpdateInventory}
          />
        );
      case 'ORDERS':
        return (
          <Orders 
            ledgers={ledgers}
            inventory={inventory}
            activeCompany={activeCompany}
            onAddVoucher={handleAddVoucher}
          />
        );
      case 'AI_ASSISTANT':
        return <AIAssistant erpData={{ ledgers, inventory, vouchers, boms }} />;
      case 'SETTINGS':
        return (
          <Settings 
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            onAddCompany={handleAddCompany}
            onUpdateCompany={handleUpdateCompany}
            onSelectCompany={setSelectedCompanyId}
            onBackup={handleBackup}
            onRestore={handleRestore}
          />
        );
      case 'INVENTORY':
        const symbol = activeCompany.currency === 'INR' ? '₹' : activeCompany.currency === 'GBP' ? '£' : '$';
        return (
          <div className="p-8 bg-white rounded-2xl tally-shadow text-center">
            <Package size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold">Inventory Management</h3>
            <p className="text-slate-500">Stock details, categorization, and location tracking.</p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
               {inventory.map(item => (
                 <div key={item.id} className="p-4 border rounded-xl hover:border-indigo-500 transition-colors">
                   <p className="text-xs font-bold text-slate-400 uppercase">{item.category}</p>
                   <h4 className="font-bold text-slate-800">{item.name}</h4>
                   <div className="flex justify-between mt-2">
                     <span className="text-sm text-slate-500">Stock: {item.quantity} {item.unit}</span>
                     <span className="text-sm font-semibold text-indigo-600">{symbol}{item.rate}/{item.unit}</span>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        );
      case 'MANUFACTURING':
        return <Manufacturing boms={boms} inventory={inventory} activeCompany={activeCompany} />;
      case 'REPORTS':
        return <Reports ledgers={ledgers} inventory={inventory} vouchers={vouchers} currency={activeCompany.currency} activeCompany={activeCompany} />;
      default:
        return <Dashboard ledgers={ledgers} inventory={inventory} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Top Bar */}
          <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl tally-shadow h-20">
            <div className="flex items-center gap-4">
               {activeCompany.logo ? (
                 <img src={activeCompany.logo} alt={activeCompany.name} className="w-10 h-10 object-contain rounded-lg border border-slate-100" />
               ) : (
                 <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                   <Building2 size={20} />
                 </div>
               )}
               <div>
                  <h1 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{activeCompany.name}</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                    GSTIN: {activeCompany.gstin || 'NOT SET'}
                  </p>
               </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex flex-col items-end mr-2">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Books Beginning</span>
                 <span className="text-xs font-bold text-slate-600">{activeCompany.bookBeginningFrom}</span>
              </div>
              <button 
                onClick={() => setActiveView('SETTINGS')}
                className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all relative"
              >
                <SettingsIcon size={20} />
              </button>
              <div className="h-8 w-[1px] bg-slate-100 mx-2"></div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold">LIVE PRODUCTION</span>
              </div>
            </div>
          </header>

          <div className="animate-in fade-in duration-500">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
