
import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileSpreadsheet, 
  Printer, 
  Download,
  Filter,
  ChevronRight,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { Ledger, StockItem, Voucher, VoucherType, Company } from '../types';

interface ReportsProps {
  ledgers: Ledger[];
  inventory: StockItem[];
  vouchers: Voucher[];
  currency: string;
  activeCompany: Company;
}

type ReportType = 'BALANCE_SHEET' | 'PROFIT_LOSS' | 'TRIAL_BALANCE' | 'STOCK_SUMMARY' | 'LEDGER_REPORT' | 'GST_SUMMARY';

const Reports: React.FC<ReportsProps> = ({ ledgers, inventory, vouchers, currency, activeCompany }) => {
  const [activeReport, setActiveReport] = useState<ReportType>('BALANCE_SHEET');
  
  const getSymbol = (c: string) => c === 'INR' ? '₹' : c === 'GBP' ? '£' : '$';
  const symbol = getSymbol(currency);
  
  // Ledger Report States
  const [selectedLedgerId, setSelectedLedgerId] = useState<string>(ledgers[0]?.id || '');
  const [startDate, setStartDate] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const balanceSheetData = useMemo(() => {
    const assets = ledgers.filter(l => ['Bank Accounts', 'Cash-in-Hand', 'Fixed Assets', 'Current Assets', 'Sundry Debtors'].includes(l.group));
    const liabilities = ledgers.filter(l => ['Current Liabilities', 'Sundry Creditors', 'Duties & Taxes'].includes(l.group));
    
    const totalAssets = assets.reduce((acc, l) => acc + Math.max(0, l.balance), 0);
    const totalLiabilities = liabilities.reduce((acc, l) => acc + Math.abs(Math.min(0, l.balance)), 0);

    return { assets, liabilities, totalAssets, totalLiabilities, equity: totalAssets - totalLiabilities };
  }, [ledgers]);

  const pnlData = useMemo(() => {
    const revenue = vouchers.filter(v => v.type === VoucherType.SALES).reduce((acc, v) => acc + v.subTotal, 0);
    const costOfGoods = vouchers.filter(v => v.type === VoucherType.PURCHASE).reduce((acc, v) => acc + v.subTotal, 0);
    const expenses = ledgers.filter(l => ['Indirect Expenses', 'Direct Expenses'].includes(l.group)).reduce((acc, l) => acc + Math.abs(l.balance), 0);
    const netProfit = revenue - costOfGoods - expenses;

    return { revenue, costOfGoods, expenses, netProfit };
  }, [vouchers, ledgers]);

  const ledgerReportData = useMemo(() => {
    if (!selectedLedgerId) return { entries: [], openingBalance: 0, closingBalance: 0 };
    
    const ledger = ledgers.find(l => l.id === selectedLedgerId);
    if (!ledger) return { entries: [], openingBalance: 0, closingBalance: 0 };

    // 1. Get all vouchers affecting this ledger
    const ledgerEntries = vouchers.filter(v => {
      // Check if this ledger is involved in the voucher
      if (v.partyId === selectedLedgerId || v.contraLedgerId === selectedLedgerId) return true;
      // Also check legacy/journal fields
      const anyV = v as any;
      if (anyV.debitLedgerId === selectedLedgerId || anyV.creditLedgerId === selectedLedgerId) return true;
      return false;
    }).map(v => {
      let debit = 0;
      let credit = 0;
      let particulars = '';

      // Determine Dr/Cr based on voucher type and ledger role
      if (v.type === VoucherType.SALES) {
        if (v.partyId === selectedLedgerId) {
          debit = v.grandTotal;
          particulars = ledgers.find(l => l.id === v.contraLedgerId)?.name || 'Sales';
        } else if (v.contraLedgerId === selectedLedgerId) {
          credit = v.subTotal;
          particulars = ledgers.find(l => l.id === v.partyId)?.name || 'Party';
        }
      } else if (v.type === VoucherType.PURCHASE) {
        if (v.partyId === selectedLedgerId) {
            credit = v.grandTotal;
            particulars = ledgers.find(l => l.id === v.contraLedgerId)?.name || 'Purchase';
        } else if (v.contraLedgerId === selectedLedgerId) {
            debit = v.subTotal;
            particulars = ledgers.find(l => l.id === v.partyId)?.name || 'Party';
        }
      } else {
        // Journal/Payment/Receipt
        const anyV = v as any;
        if (anyV.debitLedgerId === selectedLedgerId) {
            debit = anyV.amount || anyV.grandTotal;
            particulars = ledgers.find(l => l.id === anyV.creditLedgerId)?.name || 'Credit Account';
        } else if (anyV.creditLedgerId === selectedLedgerId) {
            credit = anyV.amount || anyV.grandTotal;
            particulars = ledgers.find(l => l.id === anyV.debitLedgerId)?.name || 'Debit Account';
        }
      }

      return {
        id: v.id,
        date: v.date,
        refNo: v.refNo,
        type: v.type,
        particulars,
        debit,
        credit
      };
    });

    // 2. Separate into "Before StartDate" (for opening calculation) and "In Range"
    const beforeStart = ledgerEntries.filter(e => e.date < startDate);
    const inRange = ledgerEntries.filter(e => e.date >= startDate && e.date <= endDate).sort((a,b) => a.date.localeCompare(b.date));

    const openingFromVouchers = beforeStart.reduce((acc, e) => acc + (e.debit - e.credit), 0);
    const openingBalance = ledger.balance + openingFromVouchers; // Assumes ledger.balance is initial/current? 
    // In many ERPs, we'd start from 0 if we have all history, but here balance might be the "Starting Balance"
    // Let's assume for this demo that the initial ledger.balance was the balance at the START of the system history.
    
    let runningBalance = openingBalance;
    const entriesWithBalance = inRange.map(e => {
       runningBalance += (e.debit - e.credit);
       return { ...e, balance: runningBalance };
    });

    return { 
      entries: entriesWithBalance, 
      openingBalance, 
      closingBalance: runningBalance 
    };
  }, [vouchers, ledgers, selectedLedgerId, startDate, endDate]);

  const gstData = useMemo(() => {
    const summary = {
      output: { cgst: 0, sgst: 0, igst: 0, total: 0, taxableValue: 0 },
      input: { cgst: 0, sgst: 0, igst: 0, total: 0, taxableValue: 0 },
      byRate: {} as Record<number, { outputTax: number, inputTax: number, taxableOutput: number, taxableInput: number }>
    };

    vouchers.forEach(v => {
      // Filter by date range
      if (v.date < startDate || v.date > endDate) return;

      if (v.type === VoucherType.SALES) {
        summary.output.taxableValue += v.subTotal;
        v.items?.forEach(item => {
          const rate = item.taxPercentage;
          if (!summary.byRate[rate]) summary.byRate[rate] = { outputTax: 0, inputTax: 0, taxableOutput: 0, taxableInput: 0 };
          
          const itemTax = (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0);
          summary.output.cgst += item.cgstAmount || 0;
          summary.output.sgst += item.sgstAmount || 0;
          summary.output.igst += item.igstAmount || 0;
          summary.output.total += itemTax;
          
          summary.byRate[rate].outputTax += itemTax;
          summary.byRate[rate].taxableOutput += (item.rate * item.quantity);
        });
      } else if (v.type === VoucherType.PURCHASE) {
        summary.input.taxableValue += v.subTotal;
        v.items?.forEach(item => {
          const rate = item.taxPercentage;
          if (!summary.byRate[rate]) summary.byRate[rate] = { outputTax: 0, inputTax: 0, taxableOutput: 0, taxableInput: 0 };
          
          const itemTax = (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0);
          summary.input.cgst += item.cgstAmount || 0;
          summary.input.sgst += item.sgstAmount || 0;
          summary.input.igst += item.igstAmount || 0;
          summary.input.total += itemTax;

          summary.byRate[rate].inputTax += itemTax;
          summary.byRate[rate].taxableInput += (item.rate * item.quantity);
        });
      }
    });

    return summary;
  }, [vouchers, startDate, endDate]);

  const handlePrint = () => {
    const reportName = activeReport.charAt(0) + activeReport.slice(1).toLowerCase().replace('_', '');
    document.title = `${reportName}_${startDate}_to_${endDate}`;
    window.print();
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Business Intelligence</h2>
          <p className="text-slate-500 font-medium">Real-time financial analytics and statutory compliance reports.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer size={18} />
            Print Report
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all font-mono"
          >
            <Download size={18} />
            EXPORT.PDF
          </button>
        </div>
      </div>

      {/* Report Switcher Chips */}
      <div className="flex flex-wrap gap-3 p-2 bg-slate-200/50 rounded-3xl w-fit">
        {[
          { id: 'BALANCE_SHEET', label: 'Balance Sheet', icon: BarChart3 },
          { id: 'PROFIT_LOSS', label: 'Profit & Loss', icon: PieChartIcon },
          { id: 'LEDGER_REPORT', label: 'Ledger Book', icon: FileSpreadsheet },
          { id: 'GST_SUMMARY', label: 'GST Summary', icon: ShieldCheck },
          { id: 'TRIAL_BALANCE', label: 'Trial Balance', icon: BarChart3 },
          { id: 'STOCK_SUMMARY', label: 'Stock Summary', icon: ArrowUpRight },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveReport(tab.id as ReportType)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
              activeReport === tab.id ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Report Area */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden min-h-[600px] print:shadow-none print:border-[1.5px] print:border-slate-900 print:rounded-none">
        
        {/* Print Header (Only visible when printing) */}
        <div className="hidden print:block p-8 border-b-[1.5px] border-slate-900 leading-tight">
           <div className="flex justify-between items-start">
              <div>
                 <h1 className="text-2xl font-black uppercase text-slate-900">{activeCompany.name}</h1>
                 <p className="text-[10px] font-bold max-w-sm mt-1">{activeCompany.address}</p>
                 <div className="mt-2 text-[10px] font-black uppercase">
                    GSTIN: {activeCompany.gstin} | State: {activeCompany.country} ({activeCompany.stateCode})
                 </div>
              </div>
              <div className="text-right">
                 <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">{activeReport.replace('_', ' ')}</h2>
                 <p className="text-[10px] font-bold mt-1">Period: {startDate} to {endDate}</p>
                 <p className="text-[9px] text-slate-400 mt-0.5 italic text-slate-500 font-bold">Printed on {new Date().toLocaleString()}</p>
              </div>
           </div>
        </div>

        {activeReport === 'LEDGER_REPORT' && (
          <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 print:p-0">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-10 border-b border-slate-100 print:hidden">
                <div className="flex-1 w-full md:w-auto">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Ledger Account</label>
                   <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-100 focus:outline-none font-bold text-slate-800"
                      value={selectedLedgerId}
                      onChange={e => setSelectedLedgerId(e.target.value)}
                   >
                      {ledgers.map(l => <option key={l.id} value={l.id}>{l.name} ({l.group})</option>)}
                   </select>
                </div>
                <div className="flex gap-4">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">From</label>
                      <input 
                        type="date"
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">To</label>
                      <input 
                        type="date"
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                      />
                   </div>
                </div>
             </div>

             {/* Ledger Summary Cards */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Opening Balance</p>
                   <p className="text-2xl font-black text-slate-800">{symbol}{Math.abs(ledgerReportData.openingBalance).toLocaleString()} {ledgerReportData.openingBalance >= 0 ? 'Dr' : 'Cr'}</p>
                </div>
                <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-600/20">
                   <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Closing Balance</p>
                   <p className="text-2xl font-black text-white">{symbol}{Math.abs(ledgerReportData.closingBalance).toLocaleString()} {ledgerReportData.closingBalance >= 0 ? 'Dr' : 'Cr'}</p>
                </div>
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl text-center flex flex-col justify-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Transactions</p>
                   <p className="text-2xl font-black text-slate-800">{ledgerReportData.entries.length}</p>
                </div>
             </div>

             <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden print:rounded-none print:border-none">
                <table className="w-full text-left print:border-collapse">
                   <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest print:bg-slate-100 print:text-slate-900 print:border-b-[1.5px] print:border-slate-900">
                      <tr>
                         <th className="px-6 py-4 print:px-2 print:py-2 print:border-r-[1px] print:border-slate-300">Date</th>
                         <th className="px-6 py-4 print:px-2 print:py-2 print:border-r-[1px] print:border-slate-300">Ref No</th>
                         <th className="px-6 py-4 print:px-2 print:py-2 print:border-r-[1px] print:border-slate-300">Type</th>
                         <th className="px-6 py-4 text-center print:px-2 print:py-2 print:border-r-[1px] print:border-slate-300">Particulars</th>
                         <th className="px-6 py-4 text-right print:px-2 print:py-2 print:border-r-[1px] print:border-slate-300">Debit ({symbol})</th>
                         <th className="px-6 py-4 text-right print:px-2 print:py-2 print:border-r-[1px] print:border-slate-300">Credit ({symbol})</th>
                         <th className="px-6 py-4 text-right print:px-2 print:py-2">Balance ({symbol})</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                      {/* Opening Balance Row for Print */}
                      <tr className="hidden print:table-row bg-slate-50 font-black text-xs italic">
                         <td colSpan={6} className="px-2 py-2 text-right uppercase tracking-[0.2em]">Opening Balance</td>
                         <td className="px-2 py-2 text-right font-mono">{Math.abs(ledgerReportData.openingBalance).toLocaleString()} {ledgerReportData.openingBalance >= 0 ? 'Dr' : 'Cr'}</td>
                      </tr>
                      {ledgerReportData.entries.map((entry, idx) => (
                         <tr key={idx} className="hover:bg-slate-50 transition-colors text-xs print:hover:bg-transparent">
                            <td className="px-6 py-4 font-mono font-bold text-slate-500 print:px-2 print:py-2 print:border-r-[1px] print:border-slate-300">{entry.date}</td>
                            <td className="px-6 py-4 font-black text-slate-800 print:px-2 print:py-2 print:border-r-[1px] print:border-slate-300">{entry.refNo}</td>
                            <td className="px-6 py-4 print:px-2 print:py-2 print:border-r-[1px] print:border-slate-300">
                               <span className="px-2 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-tighter print:bg-transparent print:p-0 print:text-slate-900">
                                  {entry.type}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-slate-600 print:px-2 print:py-2 print:border-r-[1px] print:border-slate-300">{entry.particulars}</td>
                            <td className="px-6 py-4 text-right font-mono font-black text-green-600 print:text-slate-900 print:px-2 print:py-2 print:border-r-[1px] print:border-slate-300">
                               {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-black text-red-600 print:text-slate-900 print:px-2 print:py-2 print:border-r-[1px] print:border-slate-300">
                               {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-black text-slate-800 print:px-2 print:py-2">
                               {Math.abs(entry.balance).toLocaleString()} {entry.balance >= 0 ? 'Dr' : 'Cr'}
                            </td>
                         </tr>
                      ))}
                      {ledgerReportData.entries.length === 0 && (
                         <tr>
                            <td colSpan={7} className="px-6 py-20 text-center text-slate-300 italic font-medium">No transactions found for the selected period.</td>
                         </tr>
                      )}
                   </tbody>
                   <tfoot className="hidden print:table-footer-group">
                      <tr className="bg-slate-900 text-white font-black text-xs uppercase italic">
                         <td colSpan={6} className="px-2 py-3 text-right">Closing Balance as on {endDate}</td>
                         <td className="px-2 py-3 text-right font-mono">{Math.abs(ledgerReportData.closingBalance).toLocaleString()} {ledgerReportData.closingBalance >= 0 ? 'Dr' : 'Cr'}</td>
                      </tr>
                   </tfoot>
                </table>
             </div>
          </div>
        )}

        {activeReport === 'GST_SUMMARY' && (
          <div className="p-12 animate-in fade-in slide-in-from-bottom-4 duration-500 print:p-0">
             <div className="flex justify-between items-center mb-12 print:hidden">
               <div>
                 <h3 className="text-4xl font-black text-slate-800 tracking-tighter">GST Summary</h3>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">GSTR Analysis: {startDate} to {endDate}</p>
               </div>
               <div className={`p-8 rounded-[2.5rem] ${(gstData.output.total - gstData.input.total) >= 0 ? 'bg-indigo-600' : 'bg-green-600'} text-white shadow-xl`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Net GST { (gstData.output.total - gstData.input.total) >= 0 ? 'Payable' : 'Credit' }</p>
                  <p className="text-3xl font-black tracking-tighter">{symbol}{Math.abs(gstData.output.total - gstData.input.total).toLocaleString()}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 print:gap-4 print:mb-6">
               <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between print:rounded-none print:border-slate-900 print:p-4">
                  <div className="flex justify-between items-start mb-6">
                     <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl print:hidden">
                        <TrendingUp size={24} />
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Output GST (Liability)</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{symbol}{gstData.output.total.toLocaleString()}</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-6">
                     <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">CGST</p>
                        <p className="text-xs font-bold text-slate-700">{symbol}{gstData.output.cgst.toLocaleString()}</p>
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">SGST</p>
                        <p className="text-xs font-bold text-slate-700">{symbol}{gstData.output.sgst.toLocaleString()}</p>
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">IGST</p>
                        <p className="text-xs font-bold text-slate-700">{symbol}{gstData.output.igst.toLocaleString()}</p>
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between print:rounded-none print:border-slate-900 print:p-4">
                  <div className="flex justify-between items-start mb-6">
                     <div className="p-4 bg-green-100 text-green-600 rounded-2xl print:hidden">
                        <TrendingDown size={24} />
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Input GST (ITC)</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{symbol}{gstData.input.total.toLocaleString()}</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-6">
                     <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">CGST</p>
                        <p className="text-xs font-bold text-slate-700">{symbol}{gstData.input.cgst.toLocaleString()}</p>
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">SGST</p>
                        <p className="text-xs font-bold text-slate-700">{symbol}{gstData.input.sgst.toLocaleString()}</p>
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">IGST</p>
                        <p className="text-xs font-bold text-slate-700">{symbol}{gstData.input.igst.toLocaleString()}</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden print:rounded-none print:border-[1.5px] print:border-slate-900">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-100 print:bg-slate-100 print:text-slate-900 print:border-b-[1.5px] print:border-slate-900">
                     <tr>
                        <th className="px-6 py-4 border-r border-slate-100 print:px-2 print:py-2 print:border-slate-900">Tax Rate</th>
                        <th className="px-6 py-4 text-right border-r border-slate-100 print:px-2 print:py-2 print:border-slate-900">Taxable Output</th>
                        <th className="px-6 py-4 text-right border-r border-slate-100 print:px-2 print:py-2 print:border-slate-900">Output Tax</th>
                        <th className="px-6 py-4 text-right border-r border-slate-100 print:px-2 print:py-2 print:border-slate-900">Taxable Input</th>
                        <th className="px-6 py-4 text-right print:px-2 print:py-2">Input tax (ITC)</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 print:divide-slate-900">
                     {Object.entries(gstData.byRate).sort(([a], [b]) => Number(a) - Number(b)).map(([rate, data]) => (
                        <tr key={rate} className="hover:bg-slate-50 transition-colors text-xs print:hover:bg-transparent">
                           <td className="px-6 py-4 font-black text-slate-800 border-r border-slate-100 print:px-2 print:py-2 print:border-slate-900">{rate}% GST</td>
                           <td className="px-6 py-4 text-right font-mono font-bold text-slate-600 border-r border-slate-100 print:px-2 print:py-2 print:border-slate-900">{symbol}{data.taxableOutput.toLocaleString()}</td>
                           <td className="px-6 py-4 text-right font-mono font-black text-indigo-600 border-r border-slate-100 print:px-2 print:py-2 print:border-slate-900">{symbol}{data.outputTax.toLocaleString()}</td>
                           <td className="px-6 py-4 text-right font-mono font-bold text-slate-600 border-r border-slate-100 print:px-2 print:py-2 print:border-slate-900">{symbol}{data.taxableInput.toLocaleString()}</td>
                           <td className="px-6 py-4 text-right font-mono font-black text-green-600 print:px-2 print:py-2">{symbol}{data.inputTax.toLocaleString()}</td>
                        </tr>
                     ))}
                     {Object.keys(gstData.byRate).length === 0 && (
                        <tr>
                           <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No GST transactions found in the selected date range.</td>
                        </tr>
                     )}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest">
                     <tr>
                        <th className="px-6 py-4 border-r border-slate-800 print:px-2 print:py-2 print:border-slate-100">Grand Total</th>
                        <th className="px-6 py-4 text-right border-r border-slate-800 print:px-2 print:py-2 print:border-slate-100">{symbol}{gstData.output.taxableValue.toLocaleString()}</th>
                        <th className="px-6 py-4 text-right border-r border-slate-800 print:px-2 print:py-2 print:border-slate-100">{symbol}{gstData.output.total.toLocaleString()}</th>
                        <th className="px-6 py-4 text-right border-r border-slate-800 print:px-2 print:py-2 print:border-slate-100">{symbol}{gstData.input.taxableValue.toLocaleString()}</th>
                        <th className="px-6 py-4 text-right print:px-2 print:py-2">{symbol}{gstData.input.total.toLocaleString()}</th>
                     </tr>
                  </tfoot>
               </table>
            </div>
          </div>
        )}

        {activeReport === 'BALANCE_SHEET' && (
          <div className="p-12 animate-in fade-in slide-in-from-bottom-4 duration-500 print:p-0">
            <div className="flex justify-between items-center mb-12 print:hidden">
               <div>
                 <h3 className="text-4xl font-black text-slate-800 tracking-tighter">Balance Sheet</h3>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">As on {new Date().toLocaleDateString()}</p>
               </div>
               <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex items-center gap-6">
                  <div className="text-center px-4">
                    <p className="text-[10px] font-black text-indigo-400 uppercase">Working Capital</p>
                    <p className="text-xl font-black text-slate-800">{symbol}{(balanceSheetData.totalAssets - balanceSheetData.totalLiabilities).toLocaleString()}</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-100 rounded-3xl border border-slate-100 overflow-hidden print:rounded-none print:border-t-[1.5px] print:border-slate-900 print:bg-slate-900">
               {/* Liabilities Side */}
               <div className="bg-white p-8 print:p-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4 print:text-slate-900 print:border-slate-900">Liabilities (Capital & Debt)</h4>
                  <div className="space-y-4 print:space-y-2">
                     {balanceSheetData.liabilities.map(l => (
                       <div key={l.id} className="flex justify-between items-center group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all print:p-0">
                          <span className="text-sm font-bold text-slate-600 print:text-[11px] print:font-black">{l.name}</span>
                          <span className="font-mono text-sm font-bold text-slate-800 print:text-[11px]">{symbol}{Math.abs(l.balance).toLocaleString()}</span>
                       </div>
                     ))}
                  </div>
                  <div className="mt-12 pt-6 border-t-[3px] border-double border-slate-200 flex justify-between items-center print:mt-10 print:pt-4">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-widest print:text-[11px]">Total Liabilities + Equity</span>
                    <span className="text-2xl font-black text-slate-800 print:text-lg">{symbol}{balanceSheetData.totalLiabilities.toLocaleString()}</span>
                  </div>
               </div>

               {/* Assets Side */}
               <div className="bg-white p-8 print:p-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4 text-right print:text-slate-900 print:border-slate-900 text-right">Assets (Resources)</h4>
                  <div className="space-y-4 print:space-y-2">
                     {balanceSheetData.assets.map(l => (
                       <div key={l.id} className="flex justify-between items-center group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all print:p-0">
                          <span className="text-sm font-bold text-slate-600 print:text-[11px] print:font-black">{l.name}</span>
                          <span className="font-mono text-sm font-bold text-slate-800 print:text-[11px]">{symbol}{Math.abs(l.balance).toLocaleString()}</span>
                       </div>
                     ))}
                  </div>
                  <div className="mt-12 pt-6 border-t-[3px] border-double border-slate-200 flex justify-between items-center print:mt-10 print:pt-4">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-widest print:text-[11px]">Total Assets</span>
                    <span className="text-2xl font-black text-slate-800 print:text-lg">{symbol}{balanceSheetData.totalAssets.toLocaleString()}</span>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeReport === 'PROFIT_LOSS' && (
          <div className="p-12 animate-in fade-in slide-in-from-bottom-4 duration-500 print:p-0">
             <div className="flex justify-between items-center mb-12 print:hidden">
               <div>
                 <h3 className="text-4xl font-black text-slate-800 tracking-tighter">Profit & Loss A/c</h3>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Condensed Operational Performance</p>
               </div>
               <div className={`p-8 rounded-[2.5rem] ${pnlData.netProfit >= 0 ? 'bg-green-600' : 'bg-red-600'} text-white shadow-xl`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Net {pnlData.netProfit >= 0 ? 'Surplus' : 'Deficit'}</p>
                  <p className="text-3xl font-black tracking-tighter">{symbol}{Math.abs(pnlData.netProfit).toLocaleString()}</p>
               </div>
            </div>

            <div className="max-w-3xl mx-auto space-y-4 print:max-w-none print:space-y-0 print:border-t-[1.5px] print:border-slate-900">
               <div className="p-10 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center print:bg-white print:rounded-none print:border-x-0 print:border-b-[1px] print:border-slate-200 print:p-4">
                  <div className="flex items-center gap-6 print:gap-2">
                    <div className="p-4 bg-indigo-600 text-white rounded-2xl print:hidden">
                      <ArrowUpRight size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase tracking-widest print:text-[11px]">Gross Revenue (Invoiced Sales)</p>
                      <p className="text-xs text-slate-400 uppercase font-bold print:hidden">Total Sales recorded in system</p>
                    </div>
                  </div>
                  <span className="text-3xl font-black text-slate-800 font-mono tracking-tighter print:text-lg">{symbol}{pnlData.revenue.toLocaleString()}</span>
               </div>

               <div className="p-10 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center print:bg-white print:rounded-none print:border-x-0 print:border-b-[1px] print:border-slate-200 print:p-4">
                  <div className="flex items-center gap-6 print:gap-2">
                    <div className="p-4 bg-slate-800 text-white rounded-2xl print:hidden">
                      <ArrowDownLeft size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase tracking-widest print:text-[11px]">Direct / Purchase Costs</p>
                    </div>
                  </div>
                  <span className="text-3xl font-bold text-slate-800 font-mono tracking-tighter print:text-lg">({symbol}{pnlData.costOfGoods.toLocaleString()})</span>
               </div>

               <div className="p-10 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center print:bg-white print:rounded-none print:border-x-0 print:border-b-[3px] print:border-double print:border-slate-900 print:p-4">
                  <div className="flex items-center gap-6 print:gap-2">
                    <div className="p-4 bg-slate-300 text-white rounded-2xl print:hidden">
                      <Filter size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase tracking-widest print:text-[11px]">Operating Expenses (Admin & Selling)</p>
                    </div>
                  </div>
                  <span className="text-3xl font-bold text-slate-800 font-mono tracking-tighter print:text-lg">({symbol}{pnlData.expenses.toLocaleString()})</span>
               </div>

               <div className="hidden print:flex p-6 justify-between items-center bg-slate-100">
                  <p className="text-sm font-black uppercase tracking-widest">Net {pnlData.netProfit >= 0 ? 'Operating Surplus' : 'Operating Loss'}</p>
                  <p className="text-2xl font-black font-mono">{symbol}{pnlData.netProfit.toLocaleString()}</p>
               </div>
            </div>
          </div>
        )}

        {/* Professional Print Signatures */}
        <div className="hidden print:grid grid-cols-3 border-t-[1.5px] border-slate-900 mt-12 bg-slate-50/30">
           <div className="p-8 border-r border-slate-300 text-center space-y-12">
              <div className="text-[10px] font-black uppercase text-slate-500">Prepared By</div>
              <div className="border-t border-dotted border-slate-400 pt-2 text-[9px] font-bold">Accounts Team</div>
           </div>
           <div className="p-8 border-r border-slate-300 text-center space-y-12">
              <div className="text-[10px] font-black uppercase text-slate-500">Verified By</div>
              <div className="border-t border-dotted border-slate-400 pt-2 text-[9px] font-bold">Operations Manager</div>
           </div>
           <div className="p-8 text-center space-y-12">
              <div className="text-[10px] font-black uppercase text-slate-500">Authorized Signatory</div>
              <div className="border-t border-dotted border-slate-400 pt-2 text-[9px] font-black">For {activeCompany.name}</div>
           </div>
        </div>

        {/* Footer (Print Only) */}
        <div className="hidden print:block p-4 bg-slate-100 border-t-[1.5px] border-slate-900 text-center">
           <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">
              Confidentially generated document from ForgeERP. Not for public disclosure.
           </p>
        </div>

        {/* Placeholder for other reports */}
        {(activeReport === 'TRIAL_BALANCE' || activeReport === 'STOCK_SUMMARY') && (
           <div className="p-20 text-center">
              <FileSpreadsheet size={64} className="mx-auto text-slate-200 mb-6" />
              <h4 className="text-2xl font-black text-slate-800 mb-2">Generating Report Engine...</h4>
              <p className="text-slate-400">Our advanced reporting core is currently compiling data points for this specific statement.</p>
           </div>
        )}

      </div>
    </div>
  );
};

export default Reports;
