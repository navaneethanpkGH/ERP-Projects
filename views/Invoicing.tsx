
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Calculator, 
  Truck, 
  CloudRain, 
  Printer, 
  X, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Ledger, StockItem, VoucherType, Voucher, VoucherItem, Company } from '../types';
import { numberToWords } from '../src/lib/utils';

interface InvoicingProps {
  ledgers: Ledger[];
  inventory: StockItem[];
  activeCompany: Company;
  onAddVoucher: (v: Omit<Voucher, 'id'>) => void;
  onUpdateInventory: (itemId: string, qty: number) => void;
}

const Invoicing: React.FC<InvoicingProps> = ({ 
  ledgers, 
  inventory, 
  activeCompany,
  onAddVoucher,
  onUpdateInventory 
}) => {
  const getSymbol = (c: string) => c === 'INR' ? '₹' : c === 'GBP' ? '£' : '$';
  const symbol = getSymbol(activeCompany.currency);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeType, setActiveType] = useState<VoucherType>(VoucherType.SALES);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [lastVoucher, setLastVoucher] = useState<Voucher | null>(null);
  const [eInvoiceProcessing, setEInvoiceProcessing] = useState(false);
  const [eWayBillProcessing, setEWayBillProcessing] = useState(false);
  
  const [invoiceForm, setInvoiceForm] = useState({
    partyId: '',
    contraLedgerId: '',
    date: new Date().toISOString().split('T')[0],
    refNo: '',
    narration: '',
    items: [] as VoucherItem[]
  });

  const [currentItem, setCurrentItem] = useState({
    itemId: '',
    quantity: 1,
    rate: 0
  });

  // Filter ledgers by group
  const parties = useMemo(() => {
    return ledgers.filter(l => 
      activeType === VoucherType.SALES ? l.group === 'Sundry Debtors' : l.group === 'Sundry Creditors'
    );
  }, [ledgers, activeType]);

  const contraLedgers = useMemo(() => {
    return ledgers.filter(l => 
      activeType === VoucherType.SALES ? l.group === 'Sales Accounts' : l.group === 'Purchase Accounts'
    );
  }, [ledgers, activeType]);

  const subTotal = useMemo(() => 
    invoiceForm.items.reduce((acc, item) => acc + (item.quantity * item.rate), 0)
  , [invoiceForm.items]);

  const taxTotal = useMemo(() => 
    invoiceForm.items.reduce((acc, item) => acc + item.taxAmount, 0)
  , [invoiceForm.items]);

  const grandTotal = subTotal + taxTotal;

  const handleAddItem = () => {
    if (!currentItem.itemId) return;
    const stock = inventory.find(i => i.id === currentItem.itemId);
    if (!stock) return;

    const party = ledgers.find(l => l.id === invoiceForm.partyId);
    const isIntraState = party?.stateCode === activeCompany.stateCode;

    const rowSub = currentItem.quantity * currentItem.rate;
    const rowTax = rowSub * (stock.taxRate / 100);
    
    const newItem: VoucherItem = {
      itemId: currentItem.itemId,
      quantity: currentItem.quantity,
      rate: currentItem.rate,
      taxAmount: rowTax,
      total: rowSub + rowTax,
      taxPercentage: stock.taxRate,
      cgstAmount: isIntraState ? rowTax / 2 : 0,
      sgstAmount: isIntraState ? rowTax / 2 : 0,
      igstAmount: isIntraState ? 0 : rowTax
    };

    setInvoiceForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setCurrentItem({ itemId: '', quantity: 1, rate: 0 });
  };

  const removeItem = (index: number) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handlePrint = () => {
    if (lastVoucher) {
      const typeStr = lastVoucher.type === VoucherType.SALES ? 'Invoice' : 'PurchaseBill';
      document.title = `${typeStr}_${lastVoucher.refNo}_${lastVoucher.date}`;
    }
    window.print();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.partyId || invoiceForm.items.length === 0) return;

    const voucher: Omit<Voucher, 'id'> = {
      type: activeType,
      date: invoiceForm.date,
      refNo: invoiceForm.refNo,
      partyId: invoiceForm.partyId,
      contraLedgerId: invoiceForm.contraLedgerId,
      items: invoiceForm.items,
      subTotal,
      taxTotal,
      grandTotal,
      narration: invoiceForm.narration,
      eInvoiceStatus: 'NOT_GENERATED',
      eWayBillStatus: 'NOT_GENERATED'
    };

    onAddVoucher(voucher);
    setLastVoucher({ ...voucher, id: 'temp' }); // For preview
    
    // Update inventory
    invoiceForm.items.forEach(item => {
      const adjustment = activeType === VoucherType.SALES ? -item.quantity : item.quantity;
      onUpdateInventory(item.itemId, adjustment);
    });

    setIsModalOpen(false);
    setShowPrintPreview(true);
    setInvoiceForm({
      partyId: '',
      contraLedgerId: '',
      date: new Date().toISOString().split('T')[0],
      refNo: '',
      narration: '',
      items: []
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl tally-shadow">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Sales & Purchase Invoicing</h2>
          <p className="text-slate-500">Generate professional GST invoices and track e-governance compliance.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { setActiveType(VoucherType.SALES); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus size={20} />
            Create Sales Invoice
          </button>
          <button 
            onClick={() => { setActiveType(VoucherType.PURCHASE); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-sm"
          >
            <Plus size={20} />
            Log Purchase Bill
          </button>
        </div>
      </div>

      {/* Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${activeType === VoucherType.SALES ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  <FileText size={28} />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 tracking-tight">{activeType === VoucherType.SALES ? 'Tax Invoice' : 'Purchase Bill'}</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Voucher Module v4.0</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-white text-slate-400 hover:text-slate-600 rounded-2xl border border-slate-100 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form Body - Scrollable */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              
              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Party A/c Name (Debtor/Creditor)</label>
                  <select 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none text-sm transition-all font-bold text-slate-700"
                    value={invoiceForm.partyId}
                    onChange={e => setInvoiceForm({...invoiceForm, partyId: e.target.value})}
                  >
                    <option value="">Select Ledger</option>
                    {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Voucher Date</label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none text-sm transition-all font-bold text-slate-700"
                    value={invoiceForm.date}
                    onChange={e => setInvoiceForm({...invoiceForm, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Invoice No / Ref No</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none text-sm transition-all font-bold text-slate-700 uppercase"
                    value={invoiceForm.refNo}
                    onChange={e => setInvoiceForm({...invoiceForm, refNo: e.target.value})}
                    placeholder="INV-2026-001"
                  />
                </div>
              </div>

              {/* Item Entry Grid */}
              <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Line Item Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                  <div className="md:col-span-3">
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:outline-none text-sm font-medium"
                      value={currentItem.itemId}
                      onChange={e => {
                        const item = inventory.find(i => i.id === e.target.value);
                        setCurrentItem({...currentItem, itemId: e.target.value, rate: item?.rate || 0});
                      }}
                    >
                      <option value="">Select Product...</option>
                      {inventory.map(item => (
                        <option key={item.id} value={item.id}>{item.name} ({item.quantity} {item.unit} available)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input 
                      type="number"
                      placeholder="Qty"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:outline-none text-sm font-medium"
                      value={currentItem.quantity}
                      onChange={e => setCurrentItem({...currentItem, quantity: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <input 
                      type="number"
                      placeholder="Rate"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:outline-none text-sm font-medium"
                      value={currentItem.rate}
                      onChange={e => setCurrentItem({...currentItem, rate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddItem}
                    className="bg-indigo-600 text-white rounded-xl p-3 font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    Add
                  </button>
                </div>

                {/* Items Table */}
                <div className="bg-white rounded-2xl overflow-hidden border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-6 py-4">S.No</th>
                        <th className="px-6 py-4">Particulars</th>
                        <th className="px-6 py-4">Qty</th>
                        <th className="px-6 py-4">Rate</th>
                        <th className="px-6 py-4">Tax (GST)</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoiceForm.items.map((item, idx) => {
                        const stock = inventory.find(i => i.id === item.itemId);
                        return (
                          <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="px-6 py-4">
                               <div className="font-bold text-slate-800">{stock?.name}</div>
                               <div className="text-[10px] text-slate-400 italic">HSN: {stock?.hsnCode || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 font-medium">{item.quantity} {stock?.unit}</td>
                            <td className="px-6 py-4 font-mono">{symbol}{item.rate.toLocaleString()}</td>
                            <td className="px-6 py-4 font-mono text-slate-500">
                               <div className="text-[10px] space-y-0.5">
                                 {item.cgstAmount ? <div>CGST: {symbol}{item.cgstAmount.toLocaleString()}</div> : null}
                                 {item.sgstAmount ? <div>SGST: {symbol}{item.sgstAmount.toLocaleString()}</div> : null}
                                 {item.igstAmount ? <div>IGST: {symbol}{item.igstAmount.toLocaleString()}</div> : null}
                                 <div>Total: {symbol}{item.taxAmount.toLocaleString()} ({item.taxPercentage}%)</div>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-right font-black text-slate-700">{symbol}{item.total.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {invoiceForm.items.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-slate-400 italic font-medium">Add items to generate invoice details.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Advanced Modules & Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  {/* e-Governance Cards (Ready for Integration) */}
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm">
                        <CloudRain size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">e-Invoice Portal</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Status: {lastVoucher?.eInvoiceStatus || 'Ready'}</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      disabled={eInvoiceProcessing}
                      onClick={() => {
                        setEInvoiceProcessing(true);
                        setTimeout(() => {
                           alert('e-Invoice Generated Successfully!\nIRN: 8a4c...f2e9\nAck No: 122010...34');
                           setEInvoiceProcessing(false);
                        }, 1500);
                      }}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-indigo-600 uppercase hover:bg-slate-50 transition-all shadow-sm"
                    >
                      {eInvoiceProcessing ? 'Processing...' : 'Generate IRN'}
                    </button>
                  </div>
                  
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm">
                        <Truck size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">e-Way Bill Generation</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Transport: Part A Pending</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      disabled={eWayBillProcessing}
                      onClick={() => {
                        setEWayBillProcessing(true);
                        setTimeout(() => {
                           alert('e-Way Bill 4510...9902 Generated!');
                           setEWayBillProcessing(false);
                        }, 1500);
                      }}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-amber-600 uppercase hover:bg-slate-50 transition-all shadow-sm"
                    >
                      {eWayBillProcessing ? 'Filing Part A...' : 'Generate EWB'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Narration / Special Instructions</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-100 focus:outline-none text-sm transition-all"
                      rows={3}
                      value={invoiceForm.narration}
                      onChange={e => setInvoiceForm({...invoiceForm, narration: e.target.value})}
                      placeholder="Enter narration for your ledger records..."
                    />
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-xs uppercase font-bold tracking-widest">Sub Total</span>
                        <span className="font-mono text-lg">{symbol}{subTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-xs uppercase font-bold tracking-widest">GST Total</span>
                        <span className="font-mono text-lg">{symbol}{taxTotal.toLocaleString()}</span>
                      </div>
                      <div className="pt-6 mt-6 border-t border-slate-800 flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Grand Total</p>
                          <p className="text-4xl font-black tracking-tighter">{symbol}{grandTotal.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Currency / Region</p>
                          <p className="text-xs font-bold bg-slate-800 px-3 py-1 rounded-lg">{activeCompany.currency} ({activeCompany.country})</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-10">
                      <button 
                        type="button"
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold transition-all"
                      >
                        <Printer size={20} />
                        Save & Print
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-indigo-500 hover:bg-indigo-400 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20"
                      >
                        <CheckCircle2 size={20} />
                        Finish Posting
                      </button>
                    </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Print Preview Modal */}
      {showPrintPreview && lastVoucher && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <div className="flex items-center gap-3">
                   <Printer size={20} className="text-indigo-600" />
                   <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Print Preview: {lastVoucher.refNo}</h3>
                 </div>
                 <div className="flex gap-2">
                   <button onClick={handlePrint} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all">Print Now</button>
                   <button onClick={() => setShowPrintPreview(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">Close</button>
                 </div>
              </div>
              
              <div id="printable-invoice" className="flex-1 overflow-y-auto p-8 bg-white print:p-0">
                 <div className="border-[1.5px] border-slate-900 p-0 text-slate-900 leading-tight">
                    {/* Invoice Banner */}
                    <div className="bg-slate-900 text-white p-2 text-center text-sm font-black tracking-[0.3em] uppercase border-b-[1.5px] border-slate-900">
                       {activeType === VoucherType.SALES ? 'Tax Invoice' : 'Purchase Bill'}
                    </div>

                    {/* Header: Company Info & Invoice Meta */}
                    <div className="grid grid-cols-2 border-b-[1.5px] border-slate-900">
                       <div className="p-4 border-r-[1.5px] border-slate-900 space-y-1">
                          <h2 className="text-xl font-black uppercase leading-tight">{activeCompany.name}</h2>
                          <div className="text-[10px] font-bold leading-relaxed max-w-[250px]">{activeCompany.address}</div>
                          <div className="pt-2 space-y-0.5">
                             <div className="text-[10px] font-black uppercase">GSTIN: <span className="font-mono text-[11px]">{activeCompany.gstin}</span></div>
                             <div className="text-[10px] font-black uppercase">State: <span className="font-bold">{activeCompany.country}</span> | Code: <span className="font-mono">{activeCompany.stateCode}</span></div>
                             <div className="text-[10px] font-black uppercase">Contact: <span className="font-mono">{activeCompany.phone}</span> | {activeCompany.email}</div>
                          </div>
                       </div>
                       <div className="grid grid-cols-2">
                          <div className="p-4 border-r-[1.5px] border-slate-900 border-b-[1.5px] border-slate-900">
                             <div className="text-[9px] font-black uppercase text-slate-500 mb-1">Invoice No.</div>
                             <div className="text-sm font-black font-mono">{lastVoucher.refNo}</div>
                          </div>
                          <div className="p-4 border-b-[1.5px] border-slate-900">
                             <div className="text-[9px] font-black uppercase text-slate-500 mb-1">Date</div>
                             <div className="text-sm font-black font-mono">{lastVoucher.date}</div>
                          </div>
                          <div className="p-4 border-r-[1.5px] border-slate-900">
                             <div className="text-[9px] font-black uppercase text-slate-500 mb-1">Place of Supply</div>
                             <div className="text-[10px] font-black uppercase">{activeCompany.country} ({activeCompany.stateCode})</div>
                          </div>
                          <div className="p-4">
                             <div className="text-[9px] font-black uppercase text-slate-500 mb-1">Reverse Charge</div>
                             <div className="text-[10px] font-black uppercase">No</div>
                          </div>
                       </div>
                    </div>

                    {/* Parties Section */}
                    <div className="grid grid-cols-2 border-b-[1.5px] border-slate-900 bg-slate-50/30">
                       <div className="p-4 border-r-[1.5px] border-slate-900">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Details of Receiver (Billed To)</h4>
                          <div className="text-sm font-black uppercase">{ledgers.find(l => l.id === lastVoucher.partyId)?.name}</div>
                          <div className="text-[10px] font-bold leading-relaxed max-w-[250px] mt-1">{ledgers.find(l => l.id === lastVoucher.partyId)?.address || 'Address not registered'}</div>
                          <div className="mt-2 space-y-0.5">
                             <div className="text-[10px] font-black uppercase text-slate-900">GSTIN: <span className="font-mono text-[11px] font-bold">{ledgers.find(l => l.id === lastVoucher.partyId)?.gstin || 'N/A'}</span></div>
                             <div className="text-[10px] font-black uppercase text-slate-900">State: <span className="font-bold">India</span> | Code: <span className="font-mono">{ledgers.find(l => l.id === lastVoucher.partyId)?.stateCode || '00'}</span></div>
                          </div>
                       </div>
                       <div className="p-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Details of Consignee (Shipped To)</h4>
                          <div className="text-sm font-black uppercase">{ledgers.find(l => l.id === lastVoucher.partyId)?.name}</div>
                          <div className="text-[10px] font-bold leading-relaxed max-w-[250px] mt-1">{ledgers.find(l => l.id === lastVoucher.partyId)?.address || 'Same as Billing Address'}</div>
                          <div className="mt-2 space-y-0.5">
                             <div className="text-[10px] font-black uppercase text-slate-900">GSTIN: <span className="font-mono text-[11px] font-bold">{ledgers.find(l => l.id === lastVoucher.partyId)?.gstin || 'N/A'}</span></div>
                             <div className="text-[10px] font-black uppercase text-slate-900">Contact: <span className="font-mono">{ledgers.find(l => l.id === lastVoucher.partyId)?.phone || 'N/A'}</span></div>
                          </div>
                       </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full border-collapse">
                       <thead>
                          <tr className="bg-slate-100 border-b-[1.5px] border-slate-900">
                             <th className="border-r-[1.5px] border-slate-900 p-2 text-[9px] font-black uppercase text-center w-12">S.No</th>
                             <th className="border-r-[1.5px] border-slate-900 p-2 text-[9px] font-black uppercase text-left">Description of Goods/Services</th>
                             <th className="border-r-[1.5px] border-slate-900 p-2 text-[9px] font-black uppercase text-center w-20">HSN/SAC</th>
                             <th className="border-r-[1.5px] border-slate-900 p-2 text-[9px] font-black uppercase text-center w-16">Qty</th>
                             <th className="border-r-[1.5px] border-slate-900 p-2 text-[9px] font-black uppercase text-center w-12">Unit</th>
                             <th className="border-r-[1.5px] border-slate-900 p-2 text-[9px] font-black uppercase text-right w-24">Rate</th>
                             <th className="border-r-[1.5px] border-slate-900 p-2 text-[9px] font-black uppercase text-right w-24">Taxable Value</th>
                             <th className="p-2 text-[9px] font-black uppercase text-right w-28">Amount</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y-[1px] divide-slate-400">
                          {lastVoucher.items?.map((item, i) => {
                             const invItem = inventory.find(inv => inv.id === item.itemId);
                             return (
                              <tr key={i} className="min-h-[30px]">
                                 <td className="border-r-[1.5px] border-slate-900 p-2 text-[10px] font-mono text-center">{i + 1}</td>
                                 <td className="border-r-[1.5px] border-slate-900 p-2 text-[11px] font-black uppercase leading-tight">
                                    {invItem?.name}
                                 </td>
                                 <td className="border-r-[1.5px] border-slate-900 p-2 text-[10px] font-mono text-center">{invItem?.hsnCode || '---'}</td>
                                 <td className="border-r-[1.5px] border-slate-900 p-2 text-[10px] font-black text-center">{item.quantity}</td>
                                 <td className="border-r-[1.5px] border-slate-900 p-2 text-[10px] font-black text-center uppercase">{invItem?.unit}</td>
                                 <td className="border-r-[1.5px] border-slate-900 p-2 text-[10px] font-mono text-right">{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                 <td className="border-r-[1.5px] border-slate-900 p-2 text-[10px] font-mono text-right">{(item.quantity * item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                 <td className="p-2 text-[10px] font-mono text-right font-black">{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              </tr>
                             );
                          })}
                          {/* Pad with empty rows to ensure consistent height */}
                          {Array.from({ length: Math.max(0, 10 - (lastVoucher.items?.length || 0)) }).map((_, i) => (
                             <tr key={`pad-${i}`} className="h-6">
                                <td className="border-r-[1.5px] border-slate-900 p-2"></td>
                                <td className="border-r-[1.5px] border-slate-900 p-2"></td>
                                <td className="border-r-[1.5px] border-slate-900 p-2"></td>
                                <td className="border-r-[1.5px] border-slate-900 p-2"></td>
                                <td className="border-r-[1.5px] border-slate-900 p-2"></td>
                                <td className="border-r-[1.5px] border-slate-900 p-2"></td>
                                <td className="border-r-[1.5px] border-slate-900 p-2"></td>
                                <td className="p-2"></td>
                             </tr>
                          ))}
                       </tbody>
                       <tfoot>
                          <tr className="border-t-[1.5px] border-slate-900 bg-slate-50 font-black">
                             <td colSpan={3} className="border-r-[1.5px] border-slate-900 p-2 text-[10px] text-right uppercase">Total</td>
                             <td className="border-r-[1.5px] border-slate-900 p-2 text-[10px] text-center">{lastVoucher.items?.reduce((s, i) => s + i.quantity, 0)}</td>
                             <td className="border-r-[1.5px] border-slate-900 p-2"></td>
                             <td className="border-r-[1.5px] border-slate-900 p-2"></td>
                             <td className="border-r-[1.5px] border-slate-900 p-2 text-[10px] font-mono text-right">{lastVoucher.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                             <td className="p-2 text-[10px] font-mono text-right">{lastVoucher.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                       </tfoot>
                    </table>

                    {/* Summary & Signatures */}
                    <div className="grid grid-cols-2 border-t-[1.5px] border-slate-900">
                       <div className="border-r-[1.5px] border-slate-900">
                          <div className="p-3 border-b-[1.5px] border-slate-900">
                             <div className="text-[9px] font-black uppercase text-slate-500 mb-1">Total Amount in Words</div>
                             <div className="text-[11px] font-black uppercase italic leading-tight">
                                {activeCompany.currency} {numberToWords(lastVoucher.grandTotal, activeCompany.currency)}
                             </div>
                          </div>
                          <div className="p-3 bg-slate-50/50">
                             <div className="text-[9px] font-black uppercase text-slate-500 mb-1">Bank Account Details (NEFT/RTGS)</div>
                             <div className="text-[10px] font-bold space-y-0.5">
                                <div>Bank Name: <span className="uppercase">{activeCompany.name} Operating Bank</span></div>
                                <div>A/c No: <span className="font-mono">99881122334455</span></div>
                                <div>IFSC Code: <span className="font-mono">FORG0001234</span></div>
                                <div>Branch: Main Business Hub</div>
                             </div>
                          </div>
                       </div>
                       <div className="flex flex-col">
                          <div className="p-3 border-b-[1.5px] border-slate-900 space-y-1 bg-slate-50/20">
                             <div className="flex justify-between text-[11px] font-bold">
                                <span>Total Taxable Value</span>
                                <span className="font-mono">{symbol}{lastVoucher.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="flex justify-between text-[11px] font-bold">
                                <span>Total Tax (GST)</span>
                                <span className="font-mono">{symbol}{lastVoucher.taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="flex justify-between text-base font-black border-t border-slate-400 pt-1 mt-1">
                                <span>Grand Total</span>
                                <span className="font-mono">{symbol}{lastVoucher.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                             </div>
                          </div>
                          <div className="p-3 flex-1">
                             <div className="text-[9px] font-black uppercase text-slate-500 mb-4">Terms & Conditions</div>
                             <ul className="text-[8px] font-bold space-y-1 list-disc pl-3 leading-tight opacity-70">
                                <li>Subject to Realization of Cheque.</li>
                                <li>Subject to local Jurisdictional court only.</li>
                                <li>Goods once sold will not be taken back or exchanged.</li>
                                <li>Interest @ 18% p.a will be charged for delayed payments.</li>
                             </ul>
                          </div>
                       </div>
                    </div>

                    {/* Final Signatures */}
                    <div className="grid grid-cols-2 border-t-[1.5px] border-slate-900 min-h-[120px]">
                       <div className="p-4 border-r-[1.5px] border-slate-900 relative">
                          <div className="text-[9px] font-black uppercase text-slate-500">Receiver's Signature & Seal</div>
                          <div className="absolute bottom-4 left-4 right-4 border-t border-dotted border-slate-400"></div>
                       </div>
                       <div className="p-4 flex flex-col justify-between text-right">
                          <div>
                             <div className="text-[9px] font-black uppercase text-slate-500">For {activeCompany.name}</div>
                             <div className="text-[8px] font-bold italic mt-2">Digitally Signed Document</div>
                          </div>
                          <div className="space-y-1">
                             <div className="text-[10px] font-black uppercase">Authorized Signatory</div>
                             <div className="text-[9px] text-slate-400 font-bold italic">Computer Generated Invoice</div>
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 {/* Declaration Footer */}
                 <div className="mt-4 p-4 border-[1px] border-slate-300 rounded-xl bg-slate-50 text-center">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                       Declaration: We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}
      <div className="bg-white rounded-3xl tally-shadow overflow-hidden border border-slate-100">
         <div className="p-8 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800">Recent Transaction History</h3>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl">
               <AlertCircle size={16} className="text-indigo-500" />
               <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Displaying last 30 days</span>
            </div>
         </div>
         <div className="p-20 text-center">
            <Calculator size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 italic">No itemized invoices found in this account yet.</p>
         </div>
      </div>
    </div>
  );
};

export default Invoicing;
