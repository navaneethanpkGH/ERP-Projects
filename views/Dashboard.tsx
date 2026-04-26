
import React from 'react';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  CreditCard 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Ledger, StockItem } from '../types';

interface DashboardProps {
  ledgers: Ledger[];
  inventory: StockItem[];
  currency: string;
}

const Dashboard: React.FC<DashboardProps> = ({ ledgers, inventory, currency }) => {
  const getSymbol = (c: string) => c === 'INR' ? '₹' : c === 'GBP' ? '£' : '$';
  const symbol = getSymbol(currency);
  
  const totalStockValue = inventory.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
  const totalCash = ledgers.filter(l => l.group === 'Cash-in-Hand' || l.group === 'Bank Accounts').reduce((acc, l) => acc + l.balance, 0);
  const accountsReceivable = ledgers.filter(l => l.group === 'Sundry Debtors').reduce((acc, l) => acc + l.balance, 0);
  const accountsPayable = ledgers.filter(l => l.group === 'Sundry Creditors').reduce((acc, l) => acc + Math.abs(l.balance), 0);
  const lowStockItems = inventory.filter(item => item.quantity < 50);

  const chartData = [
    { name: 'Jan', sales: 42000, production: 38000 },
    { name: 'Feb', sales: 38000, production: 41000 },
    { name: 'Mar', sales: 55000, production: 52000 },
    { name: 'Apr', sales: 48000, production: 45000 },
  ];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Business Executive Summary</h2>
          <p className="text-slate-500 font-medium">High-level insights into your company's financial and operational health.</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-2xl flex items-center gap-3">
           <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
           <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Live Data Sync: Active</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Liquidity" 
          value={`${symbol}${totalCash.toLocaleString()}`} 
          icon={<CreditCard className="text-indigo-600" />} 
          trend="Bank + Cash"
        />
        <StatCard 
          label="Accounts Receivable" 
          value={`${symbol}${accountsReceivable.toLocaleString()}`} 
          icon={<TrendingUp className="text-green-600" />} 
          trend="Outstanding"
        />
        <StatCard 
          label="Accounts Payable" 
          value={`${symbol}${accountsPayable.toLocaleString()}`} 
          icon={<AlertTriangle className="text-amber-600" />} 
          trend="Due Bills"
          danger={accountsPayable > totalCash}
        />
        <StatCard 
          label="Inventory Valuation" 
          value={`${symbol}${totalStockValue.toLocaleString()}`} 
          icon={<Package className="text-blue-600" />} 
          trend={`${inventory.length} Stock SKU`}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl tally-shadow">
          <h3 className="text-lg font-semibold mb-6">Production vs Sales</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} 
                />
                <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="production" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl tally-shadow">
          <h3 className="text-lg font-semibold mb-6">Revenue Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} 
                />
                <Line type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, trend, danger = false }: any) => (
  <div className="bg-white p-6 rounded-2xl tally-shadow border border-slate-100">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${danger ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
        {trend}
      </span>
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
    </div>
  </div>
);

export default Dashboard;
