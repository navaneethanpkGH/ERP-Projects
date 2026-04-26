
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  FileText, 
  ShoppingCart, 
  Send, 
  Printer, 
  X, 
  CheckCircle2,
  AlertCircle,
  FileSearch
} from 'lucide-react';
import { Ledger, StockItem, VoucherType, Voucher, VoucherItem, Company } from '../types';
import { numberToWords } from '../src/lib/utils';

interface OrdersProps {
  ledgers: Ledger[];
  inventory: StockItem[];
  activeCompany: Company;
  onAddVoucher: (v: Omit<Voucher, 'id'>) => void;
}

const Orders: React.FC<OrdersProps> = ({ 
  ledgers, 
  inventory, 
  activeCompany,
  onAddVoucher,
}) => {
  const getSymbol = (c: string) => c === 'INR' ? '₹' : c === 'GBP' ? '£' : '$';
  const symbol = getSymbol(activeCompany.currency);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeType, setActiveType] = useState<VoucherType>(VoucherType.QUOTATION);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [lastVoucher, setLastVoucher] = useState<Voucher | null>(null);
  
  const [orderForm, setOrderForm] = useState({
    partyId: '',
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
      activeType === VoucherType.QUOTATION ? l.group === 'Sundry Debtors' : l.group === 'Sundry Creditors'
    );
  }, [ledgers, activeType]);

  const subTotal = useMemo(() => 
    orderForm.items.reduce((acc, item) => acc + (item.quantity * item.rate), 0)
  , [orderForm.items]);

  const taxTotal = useMemo(() => 
    orderForm.items.reduce((acc, item) => acc + item.taxAmount, 0)
  , [orderForm.items]);

  const grandTotal = subTotal + taxTotal;

  const handleAddItem = () => {
    if (!currentItem.itemId) return;
    const stock = inventory.find(i => i.id === currentItem.itemId);
    if (!stock) return;

    const party = ledgers.find(l => l.id === orderForm.partyId);
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

    setOrderForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setCurrentItem({ itemId: '', quantity: 1, rate: 0 });
  };

  const removeItem = (index: number) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handlePrint = () => {
    if (lastVoucher) {
      const typeStr = lastVoucher.type === VoucherType.QUOTATION ? 'Quotation' : 'PurchaseOrder';
      document.title = `${typeStr}_${lastVoucher.refNo}_${lastVoucher.date}`;
    }
    window.print();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.partyId || orderForm.items.length === 0) return;

    const voucher: Omit<Voucher, 'id'> = {
      type: activeType,
      date: orderForm.date,
      refNo: orderForm.refNo,
      partyId: orderForm.partyId,
      items: orderForm.items,
      subTotal,
      taxTotal,
      grandTotal,
      narration: orderForm.narration,
    };

    onAddVoucher(voucher);
    setLastVoucher({ ...voucher, id: 'temp' });
    
    // Note: Orders/Quotations DO NOT update inventory
    setIsModalOpen(false);
    setShowPrintPreview(true);
    setOrderForm({
      partyId: '',
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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Orders & Quotations</h2>
          <p className="text-slate-500">Draft professional proposals and track procurement requests.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { setActiveType(VoucherType.QUOTATION); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Send size={20} />
            New Quotation
          </button>
          <button 
            onClick={() => { setActiveType(VoucherType.PURCHASE_ORDER); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-sm"
          >
            <ShoppingCart size={20} />
            Create Purchase Order
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                 <div className={`p-3 rounded-2xl ${activeType === VoucherType.QUOTATION ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                   {activeType === VoucherType.QUOTATION ? <Send size={28} /> : <ShoppingCart size={28} />}
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{activeType === VoucherType.QUOTATION ? 'Sales Quotation' : 'Purchase Order'}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Pre-Accounting Document</p>
                 </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white text-slate-400 hover:text-slate-600 rounded-2xl border border-slate-100 transition-all">
                 <X size={24} />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{activeType === VoucherType.QUOTATION ? 'Customer Name' : 'Supplier Name'}</label>
                  <select 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none text-sm font-bold text-slate-700"
                    value={orderForm.partyId}
                    onChange={e => setOrderForm({...orderForm, partyId: e.target.value})}
                  >
                    <option value="">Select Account</option>
                    {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Date</label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none text-sm font-bold text-slate-700"
                    value={orderForm.date}
                    onChange={e => setOrderForm({...orderForm, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Order / Quotation No</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none text-sm font-bold text-slate-700 uppercase"
                    value={orderForm.refNo}
                    onChange={e => setOrderForm({...orderForm, refNo: e.target.value})}
                    placeholder={activeType === VoucherType.QUOTATION ? 'QTN-001' : 'PO-001'}
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Item Selection</h4>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                  <div className="md:col-span-3">
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium"
                      value={currentItem.itemId}
                      onChange={e => {
                        const item = inventory.find(i => i.id === e.target.value);
                        setCurrentItem({...currentItem, itemId: e.target.value, rate: item?.rate || 0});
                      }}
                    >
                      <option value="">Select Item...</option>
                      {inventory.map(item => (
                        <option key={item.id} value={item.id}>{item.name} ({item.quantity} {item.unit} in stock)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input 
                      type="number"
                      placeholder="Qty"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium"
                      value={currentItem.quantity}
                      onChange={e => setCurrentItem({...currentItem, quantity: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <input 
                      type="number"
                      placeholder="Rate"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium"
                      value={currentItem.rate}
                      onChange={e => setCurrentItem({...currentItem, rate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <button type="button" onClick={handleAddItem} className="bg-indigo-600 text-white rounded-xl p-3 font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                    <Plus size={18} />
                    Add
                  </button>
                </div>

                <div className="bg-white rounded-2xl overflow-hidden border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-6 py-4">S.No</th>
                        <th className="px-6 py-4">Item</th>
                        <th className="px-6 py-4">Qty</th>
                        <th className="px-6 py-4">Rate</th>
                        <th className="px-6 py-4">Tax</th>
                        <th className="px-6 py-4 text-right">Total</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orderForm.items.map((item, idx) => {
                        const stock = inventory.find(i => i.id === item.itemId);
                        return (
                          <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="px-6 py-4 font-bold text-slate-800">{stock?.name}</td>
                            <td className="px-6 py-4 font-medium">{item.quantity} {stock?.unit}</td>
                            <td className="px-6 py-4 font-mono">{symbol}{item.rate.toLocaleString()}</td>
                            <td className="px-6 py-4 font-mono text-xs">{symbol}{item.taxAmount.toLocaleString()} ({item.taxPercentage}%)</td>
                            <td className="px-6 py-4 text-right font-black text-slate-700">{symbol}{item.total.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">
                              <button type="button" onClick={() => removeItem(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {orderForm.items.length === 0 && (
                        <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-400 italic font-medium">Add items to draft the document.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Narration / Terms & Conditions</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-100 text-sm"
                      rows={4}
                      value={orderForm.narration}
                      onChange={e => setOrderForm({...orderForm, narration: e.target.value})}
                      placeholder="Enter specific terms for this quotation or PO..."
                    />
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
                      <span>Sub Total</span>
                      <span className="font-mono text-lg">{symbol}{subTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
                      <span>Estimated Tax</span>
                      <span className="font-mono text-lg">{symbol}{taxTotal.toLocaleString()}</span>
                    </div>
                    <div className="pt-6 mt-6 border-t border-slate-800 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Estimated Total</p>
                        <p className="text-4xl font-black tracking-tighter">{symbol}{grandTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-10">
                    <button type="submit" className="flex-1 flex items-center justify-center gap-2 py-4 bg-indigo-500 hover:bg-indigo-400 rounded-2xl font-bold transition-all">
                      <CheckCircle2 size={20} />
                      Save Document
                    </button>
                    {lastVoucher && (
                      <button 
                         type="button"
                         onClick={handlePrint}
                         className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold transition-all"
                      >
                         <Printer size={20} /> Print
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPrintPreview && lastVoucher && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <div className="flex items-center gap-3">
                   <Printer size={20} className="text-indigo-600" />
                   <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Preview: {lastVoucher.refNo}</h3>
                 </div>
                <div className="flex gap-2">
                  <button onClick={handlePrint} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">
                     <Printer size={14} /> Print Now
                  </button>
                  <button onClick={() => setShowPrintPreview(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">Close</button>
                </div>
              </div>
              
              <div id="printable-order" className="flex-1 overflow-y-auto p-8 bg-white print:p-0">
                 <div className="border-[1.5px] border-slate-900 p-0 text-slate-900 leading-tight">
                    {/* Header Banner */}
                    <div className="bg-slate-900 text-white p-2 text-center text-sm font-black tracking-[0.3em] uppercase border-b-[1.5px] border-slate-900">
                       {lastVoucher.type.replace('_', ' ')}
                    </div>

                    {/* Header: Company Info & Document Meta */}
                    <div className="grid grid-cols-2 border-b-[1.5px] border-slate-900">
                       <div className="p-4 border-r-[1.5px] border-slate-900 space-y-1">
                          <h2 className="text-xl font-black uppercase leading-tight">{activeCompany.name}</h2>
                          <div className="text-[10px] font-bold leading-relaxed max-w-[250px]">{activeCompany.address}</div>
                          <div className="pt-2 space-y-0.5">
                             <div className="text-[10px] font-black uppercase">GSTIN: <span className="font-mono text-[11px]">{activeCompany.gstin}</span></div>
                             <div className="text-[10px] font-black uppercase text-slate-900">Contact: <span className="font-mono">{activeCompany.phone}</span> | {activeCompany.email}</div>
                          </div>
                       </div>
                       <div className="grid grid-cols-2">
                          <div className="p-4 border-r-[1.5px] border-slate-900 border-b-[1.5px] border-slate-900">
                             <div className="text-[9px] font-black uppercase text-slate-500 mb-1">Document No.</div>
                             <div className="text-sm font-black font-mono">{lastVoucher.refNo}</div>
                          </div>
                          <div className="p-4 border-b-[1.5px] border-slate-900">
                             <div className="text-[9px] font-black uppercase text-slate-500 mb-1">Date</div>
                             <div className="text-sm font-black font-mono">{lastVoucher.date}</div>
                          </div>
                          <div className="p-4 border-r-[1.5px] border-slate-900">
                             <div className="text-[9px] font-black uppercase text-slate-500 mb-1">Currency</div>
                             <div className="text-[10px] font-black uppercase">{activeCompany.currency}</div>
                          </div>
                          <div className="p-4">
                             <div className="text-[9px] font-black uppercase text-slate-500 mb-1">Validity</div>
                             <div className="text-[10px] font-black uppercase">30 Days</div>
                          </div>
                       </div>
                    </div>

                    {/* Parties Section */}
                    <div className="grid grid-cols-2 border-b-[1.5px] border-slate-900 bg-slate-50/30">
                       <div className="p-4 border-r-[1.5px] border-slate-900">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                             {lastVoucher.type === VoucherType.QUOTATION ? 'Prospective Customer' : 'Supplier Details'}
                          </h4>
                          <div className="text-sm font-black uppercase">{ledgers.find(l => l.id === lastVoucher.partyId)?.name}</div>
                          <div className="text-[10px] font-bold leading-relaxed max-w-[250px] mt-1">{ledgers.find(l => l.id === lastVoucher.partyId)?.address || 'Address not provided'}</div>
                          <div className="mt-2 text-[10px] font-black uppercase">
                             GSTIN: <span className="font-mono text-[11px] font-bold">{ledgers.find(l => l.id === lastVoucher.partyId)?.gstin || 'N/A'}</span>
                          </div>
                       </div>
                       <div className="p-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Subject / Reference</h4>
                          <div className="text-[10px] font-bold leading-relaxed">
                             {lastVoucher.type === VoucherType.QUOTATION 
                               ? 'Submission of quote for requirements as discussed.'
                               : 'Purchase Order for the following items as per agreed rates.'}
                          </div>
                          <div className="mt-2 text-[10px] font-bold italic text-slate-500">
                             Please refer to the document number in all future communications.
                          </div>
                       </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full border-collapse">
                       <thead>
                          <tr className="bg-slate-100 border-b-[1.5px] border-slate-900">
                             <th className="border-r-[1.5px] border-slate-900 p-2 text-[9px] font-black uppercase text-center w-12">S.No</th>
                             <th className="border-r-[1.5px] border-slate-900 p-2 text-[9px] font-black uppercase text-left">Product / Service Description</th>
                             <th className="border-r-[1.5px] border-slate-900 p-2 text-[9px] font-black uppercase text-center w-20">HSN</th>
                             <th className="border-r-[1.5px] border-slate-900 p-2 text-[9px] font-black uppercase text-center w-20">Qty</th>
                             <th className="border-r-[1.5px] border-slate-900 p-2 text-[9px] font-black uppercase text-right w-28">Rate</th>
                             <th className="p-2 text-[9px] font-black uppercase text-right w-32">Amount</th>
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
                                 <td className="border-r-[1.5px] border-slate-900 p-2 text-[10px] font-black text-center">{item.quantity} {invItem?.unit}</td>
                                 <td className="border-r-[1.5px] border-slate-900 p-2 text-[10px] font-mono text-right">{symbol}{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                 <td className="p-2 text-[10px] font-mono text-right font-black">{symbol}{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              </tr>
                             );
                          })}
                          {/* Filler rows */}
                          {Array.from({ length: Math.max(0, 12 - (lastVoucher.items?.length || 0)) }).map((_, i) => (
                             <tr key={`pad-${i}`} className="h-6">
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
                             <td colSpan={3} className="border-r-[1.5px] border-slate-900 p-2 text-[10px] text-right uppercase">Total Est. Value</td>
                             <td className="border-r-[1.5px] border-slate-900 p-2 text-[10px] text-center">{lastVoucher.items?.reduce((s, i) => s + i.quantity, 0)} Items</td>
                             <td className="border-r-[1.5px] border-slate-900 p-2"></td>
                             <td className="p-2 text-[10px] font-mono text-right">{symbol}{lastVoucher.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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
                             <div className="text-[9px] font-black uppercase text-slate-500 mb-1">Internal Notes / Instructions</div>
                             <div className="text-[10px] font-bold leading-tight">
                                {lastVoucher.narration || 'No specific instructions provided.'}
                             </div>
                          </div>
                       </div>
                       <div className="flex flex-col">
                          <div className="p-3 border-b-[1.5px] border-slate-900 space-y-1 bg-slate-50/20">
                             <div className="flex justify-between text-[11px] font-bold">
                                <span>Sub Total</span>
                                <span className="font-mono">{symbol}{lastVoucher.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="flex justify-between text-[11px] font-bold">
                                <span>Estim. Taxes</span>
                                <span className="font-mono">{symbol}{lastVoucher.taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="flex justify-between text-base font-black border-t border-slate-400 pt-1 mt-1">
                                <span>Estimated Total</span>
                                <span className="font-mono">{symbol}{lastVoucher.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                             </div>
                          </div>
                          <div className="p-3 flex-1">
                             <div className="text-[9px] font-black uppercase text-slate-500 mb-4">Terms & Conditions</div>
                             <ul className="text-[8px] font-bold space-y-1 list-disc pl-3 leading-tight opacity-70">
                                <li>The prices mentioned are estimates and subject to final confirmation.</li>
                                <li>Delivery will be made within the specified lead time as per agreement.</li>
                                <li>All disputes are subject to the jurisdiction of {activeCompany.country} courts.</li>
                                <li>Payment terms are as per the standard company policy.</li>
                             </ul>
                          </div>
                       </div>
                    </div>

                    {/* Final Signatures */}
                    <div className="grid grid-cols-2 border-t-[1.5px] border-slate-900 min-h-[120px]">
                       <div className="p-4 border-r-[1.5px] border-slate-900 relative">
                          <div className="text-[9px] font-black uppercase text-slate-500">
                             {lastVoucher.type === VoucherType.QUOTATION ? "Customer's Acceptance" : "Recipient's Acknowledgement"}
                          </div>
                          <div className="absolute bottom-4 left-4 right-4 border-t border-dotted border-slate-400"></div>
                       </div>
                       <div className="p-4 flex flex-col justify-between text-right">
                          <div>
                             <div className="text-[9px] font-black uppercase text-slate-500">For {activeCompany.name}</div>
                          </div>
                          <div className="space-y-1">
                             <div className="text-[10px] font-black uppercase">Authorized Signatory</div>
                             <div className="text-[9px] text-slate-400 font-bold italic">This is a draft {lastVoucher.type.replace('_', ' ')}</div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="bg-white rounded-3xl tally-shadow overflow-hidden border border-slate-100">
         <div className="p-8 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800">Pending Order Requests</h3>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl">
               <FileSearch size={16} className="text-indigo-500" />
               <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Internal Tracking Only</span>
            </div>
         </div>
         <div className="p-20 text-center">
            <ShoppingCart size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 italic">No Quotations or Purchase Orders created yet.</p>
         </div>
      </div>
    </div>
  );
};

export default Orders;
