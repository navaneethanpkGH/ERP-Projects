
import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Factory, 
  BarChart3, 
  Bot,
  Database,
  Menu,
  X,
  Settings,
  FileText,
  BookText,
  ShoppingCart
} from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'MASTERS', label: 'Masters', icon: Database },
    { id: 'INVOICING', label: 'Invoicing', icon: FileText },
    { id: 'ORDERS', label: 'Orders & Quotations', icon: ShoppingCart },
    { id: 'ACCOUNTING', label: 'Journal', icon: BookText },
    { id: 'INVENTORY', label: 'Inventory', icon: Package },
    { id: 'MANUFACTURING', label: 'Manufacturing', icon: Factory },
    { id: 'REPORTS', label: 'Reports', icon: BarChart3 },
    { id: 'AI_ASSISTANT', label: 'AI Assistant', icon: Bot },
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
  ];

  const handleNav = (id: ViewType) => {
    onViewChange(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Content */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        overflow-y-auto custom-scrollbar flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex-1">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-xl">F</div>
            <h1 className="text-xl font-bold tracking-tight">ForgeERP</h1>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id as ViewType)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${activeView === item.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
