
import React, { useState } from 'react';
import { Plus, Search, FileText, WalletCards, X, Printer, CheckCircle2 } from 'lucide-react';
import { Ledger, Voucher, VoucherType, Company } from '../types';
import { numberToWords } from '../src/lib/utils';

interface AccountingProps {
  ledgers: Ledger[];
  currency: string;
  onAddVoucher: (v: Omit<Voucher, 'id'>) => void;
  onAddLedger: (l: Omit<Ledger, 'id'>) => void;
  activeCompany: Company;
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
  'Fixed Assets',
  'Current Assets',
  'Current Liabilities'
];

const Accounting: React.FC<AccountingProps> = ({ ledgers, currency, onAddVoucher, onAddLedger, activeCompany }) => {
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [lastVoucher, setLastVoucher] = useState<any>(null);

  const getSymbol = (c: string) => c === 'INR' ? '₹' : c === 'GBP' ? '£' : '$';
  const symbol = getSymbol(currency);

  const [voucherFormData, setVoucherFormData] = useState({
    type: VoucherType.PAYMENT,
    date: new Date().toISOString().split('T')[0],
    debitLedgerId: ledgers[0]?.id || '',
    creditLedgerId: ledgers[1]?.id || '',
    amount: 0,
    refNo: '',
    narration: ''
  });

  const [ledgerFormData, setLedgerFormData] = useState({
    name: '',
    group: LEDGER_GROUPS[0],
    balance: 0
  });

  const handleVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddVoucher(voucherFormData);
    setLastVoucher({ ...voucherFormData, id: 'temp-' + Date.now() });
    setIsVoucherModalOpen(false);
    setShowPrintPreview(true);
  };

  const handleLedgerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLedger(ledgerFormData);
    setIsLedgerModalOpen(false);
    setLedgerFormData({ name: '', group: LEDGER_GROUPS[0], balance: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Chart of Accounts</h2>
          <p className="text-slate-500">Manage ledgers and record financial transactions.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsLedgerModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-semibold hover:bg-indigo-50 transition-all shadow-sm"
          >
            <WalletCards size={18} />
            New Ledger
          </button>
          <button 
            onClick={() => setIsVoucherModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus size={20} />
            New Voucher
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ledgers List */}
        <div className="lg:col-span-2 bg-white rounded-2xl tally-shadow overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search ledgers..." 
              className="bg-transparent border-none focus:ring-0 text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Ledger Name</th>
                  <th className="px-6 py-4">Group</th>
                  <th className="px-6 py-4 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgers.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase())).map((ledger) => (
                  <tr key={ledger.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{ledger.name}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{ledger.group}</td>
                    <td className={`px-6 py-4 text-right font-semibold ${ledger.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {symbol}{Math.abs(ledger.balance).toLocaleString()} {ledger.balance >= 0 ? 'Dr' : 'Cr'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Mini-Panel */}
        <div className="bg-white p-6 rounded-2xl tally-shadow h-fit">
          <h3 className="text-lg font-semibold mb-4">Quick Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-xs text-indigo-600 font-bold uppercase mb-1">Cash Inflow (MTD)</p>
              <p className="text-xl font-bold text-slate-800">{symbol}124,500</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-600 font-bold uppercase mb-1">Accounts Payable</p>
              <p className="text-xl font-bold text-slate-800">{symbol}42,000</p>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500">Total Ledgers: <span className="font-bold text-slate-800">{ledgers.length}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Voucher Print Preview */}
      {showPrintPreview && lastVoucher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <div className="flex items-center gap-3">
                 <Printer size={20} className="text-indigo-600" />
                 <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Voucher Preview</h3>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => window.print()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">
                    <Printer size={14} /> Print
                 </button>
                 <button onClick={() => setShowPrintPreview(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">Close</button>
               </div>
            </div>

            <div id="printable-voucher" className="flex-1 overflow-y-auto p-12 bg-white">
               <div className="border-[1.5px] border-slate-900 p-0 text-slate-900 leading-tight">
                  <div className="bg-slate-900 text-white p-2 text-center text-sm font-black tracking-[0.3em] uppercase border-b-[1.5px] border-slate-900">
                     {lastVoucher.type} VOUCHER
                  </div>
                  
                  <div className="grid grid-cols-2 border-b-[1.5px] border-slate-900">
                     <div className="p-4 border-r-[1.5px] border-slate-900 space-y-1">
                        <h2 className="text-lg font-black uppercase">{activeCompany.name}</h2>
                        <div className="text-[9px] font-bold leading-tight max-w-[200px]">{activeCompany.address}</div>
                     </div>
                     <div className="grid grid-cols-2">
                        <div className="p-4 border-r-[1.5px] border-slate-900 border-b-[1.5px] border-slate-900">
                           <div className="text-[8px] font-black uppercase text-slate-500 mb-1">No.</div>
                           <div className="text-xs font-black font-mono">{lastVoucher.refNo || '---'}</div>
                        </div>
                        <div className="p-4 border-b-[1.5px] border-slate-900">
                           <div className="text-[8px] font-black uppercase text-slate-500 mb-1">Date</div>
                           <div className="text-xs font-black font-mono">{lastVoucher.date}</div>
                        </div>
                        <div className="p-4 col-span-2 bg-slate-50/50">
                           <div className="text-[8px] font-black uppercase text-slate-500 mb-1">Payment Method</div>
                           <div className="text-[10px] font-black uppercase">Standard {lastVoucher.type === VoucherType.PAYMENT ? 'Cash/Bank' : 'Ledger'} Transfer</div>
                        </div>
                     </div>
                  </div>

                  <div className="p-6 space-y-6">
                     <div className="flex justify-between items-center text-sm border-b-[1.5px] border-slate-900 pb-4">
                        <div className="space-y-4 flex-1">
                           <div className="flex items-start">
                              <div className="w-24 text-[10px] font-black uppercase text-slate-500 mt-1">Particulars:</div>
                              <div className="flex-1">
                                 <div className="text-sm font-black uppercase">{ledgers.find(l => l.id === lastVoucher.debitLedgerId)?.name}</div>
                                 <div className="text-[10px] font-black text-slate-400 mt-1">To: {ledgers.find(l => l.id === lastVoucher.creditLedgerId)?.name}</div>
                              </div>
                           </div>
                           <div className="flex items-start mt-4">
                              <div className="w-24 text-[10px] font-black uppercase text-slate-500 mt-1">Through:</div>
                              <div className="text-[10px] font-bold text-slate-700">Financial Ledger Entry</div>
                           </div>
                        </div>
                        <div className="text-right pl-10 border-l-[1.5px] border-slate-900 py-4 h-full">
                           <div className="text-[10px] font-black uppercase text-slate-500 mb-2 whitespace-nowrap">Amount ({currency})</div>
                           <div className="text-2xl font-black font-mono tracking-tighter">{symbol}{lastVoucher.amount.toLocaleString()}</div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="bg-slate-50 p-4 border-[1px] border-slate-200">
                           <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Amount in Words</div>
                           <div className="text-xs font-black uppercase italic tracking-tight">
                              {activeCompany.currency} {numberToWords(lastVoucher.amount, activeCompany.currency)} ONLY
                           </div>
                        </div>
                        <div>
                           <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Narration</div>
                           <div className="text-[11px] font-bold leading-relaxed">
                              {lastVoucher.narration || 'Being amount posted towards accounting transaction.'}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-3 border-t-[1.5px] border-slate-900 min-h-[100px] bg-slate-50/20">
                     <div className="p-4 border-r border-slate-300 relative">
                        <div className="text-[8px] font-black uppercase text-slate-400">Receiver's Signature</div>
                     </div>
                     <div className="p-4 border-r border-slate-300 text-center flex flex-col justify-end">
                        <div className="text-[8px] font-black uppercase text-slate-400 mb-2">Prepared By</div>
                        <div className="text-[9px] font-bold uppercase italic border-t border-dotted border-slate-300 pt-1">Accounts Dept</div>
                     </div>
                     <div className="p-4 flex flex-col justify-between text-right">
                        <div><div className="text-[8px] font-black uppercase text-slate-400">For {activeCompany.name}</div></div>
                        <div className="text-[9px] font-black uppercase border-t border-slate-900 pt-1">Authorised Signatory</div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Create Voucher</h3>
              <button onClick={() => setIsVoucherModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleVoucherSubmit} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Voucher Type</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    value={voucherFormData.type}
                    onChange={(e) => setVoucherFormData({...voucherFormData, type: e.target.value as VoucherType})}
                  >
                    {Object.values(VoucherType).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    value={voucherFormData.date}
                    onChange={(e) => setVoucherFormData({...voucherFormData, date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Debit Ledger (Account Dr)</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  value={voucherFormData.debitLedgerId}
                  onChange={(e) => setVoucherFormData({...voucherFormData, debitLedgerId: e.target.value})}
                >
                  <option value="">Select Ledger</option>
                  {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Credit Ledger (Account Cr)</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  value={voucherFormData.creditLedgerId}
                  onChange={(e) => setVoucherFormData({...voucherFormData, creditLedgerId: e.target.value})}
                >
                  <option value="">Select Ledger</option>
                  {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Amount</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    value={voucherFormData.amount}
                    onChange={(e) => setVoucherFormData({...voucherFormData, amount: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ref No.</label>
                  <input 
                    type="text" 
                    placeholder="INV/001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    value={voucherFormData.refNo}
                    onChange={(e) => setVoucherFormData({...voucherFormData, refNo: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Narration</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  rows={2}
                  value={voucherFormData.narration}
                  onChange={(e) => setVoucherFormData({...voucherFormData, narration: e.target.value})}
                ></textarea>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  Post Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Ledger Modal */}
      {isLedgerModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">New Ledger Account</h3>
              <button onClick={() => setIsLedgerModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleLedgerSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ledger Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Electricity Bill, ABC Corp"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  required
                  value={ledgerFormData.name}
                  onChange={(e) => setLedgerFormData({...ledgerFormData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Under Group</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  value={ledgerFormData.group}
                  onChange={(e) => setLedgerFormData({...ledgerFormData, group: e.target.value})}
                >
                  {LEDGER_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Opening Balance (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold">{symbol}</span>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-7 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    value={ledgerFormData.balance}
                    onChange={(e) => setLedgerFormData({...ledgerFormData, balance: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400 italic">Positive for Debit, Negative for Credit</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsLedgerModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  Create Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounting;
