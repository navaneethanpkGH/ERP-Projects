
import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Phone, 
  Mail, 
  Calendar, 
  Upload, 
  Plus, 
  Check, 
  Building,
  Image as ImageIcon,
  Database,
  Download,
  RefreshCw
} from 'lucide-react';
import { Company } from '../types';

interface SettingsProps {
  companies: Company[];
  selectedCompanyId: string;
  onAddCompany: (c: Omit<Company, 'id'>) => void;
  onUpdateCompany: (c: Company) => void;
  onSelectCompany: (id: string) => void;
  onBackup: () => void;
  onRestore: (json: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  companies, 
  selectedCompanyId, 
  onAddCompany, 
  onUpdateCompany, 
  onSelectCompany,
  onBackup,
  onRestore
}) => {
  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const [formData, setFormData] = useState<Company>(selectedCompany);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingNew) {
      const { id, ...newCompany } = formData;
      onAddCompany(newCompany);
      setIsAddingNew(false);
    } else {
      onUpdateCompany(formData);
      setIsEditing(false);
    }
  };

  const startEditing = () => {
    setFormData(selectedCompany);
    setIsEditing(true);
    setIsAddingNew(false);
  };

  const startAdding = () => {
    setFormData({
      id: '',
      name: '',
      address: '',
      gstin: '',
      phone: '',
      email: '',
      website: '',
      financialYearStart: new Date().getFullYear() + '-04-01',
      bookBeginningFrom: new Date().getFullYear() + '-04-01',
      country: 'India',
      currency: 'INR',
      stateCode: ''
    });
    setIsAddingNew(true);
    setIsEditing(true);
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onRestore(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Company Settings</h2>
          <p className="text-slate-500">Manage your company profiles and account identities.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={startAdding}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus size={20} />
            Create New Company
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Company List */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl tally-shadow border border-slate-100 flex flex-col h-fit">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="text-indigo-600" size={20} />
              <h3 className="text-lg font-bold">Your Companies</h3>
            </div>
            <div className="space-y-3">
              {companies.map(c => (
                <button 
                  key={c.id}
                  onClick={() => {
                    onSelectCompany(c.id);
                    setIsEditing(false);
                    setIsAddingNew(false);
                  }}
                  className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${
                    selectedCompanyId === c.id 
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                      : 'border-slate-100 hover:border-slate-300 bg-slate-50/30'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-white border border-slate-100 ${selectedCompanyId === c.id ? 'ring-2 ring-indigo-100' : ''}`}>
                    {c.logo ? (
                      <img src={c.logo} alt={c.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <Building className="text-slate-300" size={24} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{c.name}</p>
                    <p className="text-xs text-slate-500 truncate">{c.gstin}</p>
                  </div>
                  {selectedCompanyId === c.id && (
                    <Check className="text-indigo-600 shrink-0" size={18} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Backup & Restore Section */}
          <div className="bg-white p-6 rounded-3xl tally-shadow border border-slate-100 space-y-6">
             <div className="flex items-center gap-2">
                <Database className="text-indigo-600" size={20} />
                <h3 className="text-lg font-bold">Data Management</h3>
             </div>
             
             <div className="space-y-3">
                <button 
                  onClick={onBackup}
                  className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all"
                >
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Download size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">Backup Data</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Export all records to JSON</p>
                  </div>
                </button>

                <label className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all cursor-pointer">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                    <RefreshCw size={18} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold text-slate-800">Restore Data</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Import from backup file</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".json"
                    onChange={handleFileRestore}
                  />
                </label>
             </div>

             <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                  NOTE: Restoring data will overwrite all current company records, ledgers, and transactions. Please backup your current data before proceeding.
                </p>
             </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl tally-shadow overflow-hidden border border-slate-100">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {isAddingNew ? 'Create New Company' : isEditing ? 'Edit Company Profile' : 'Company Profile Details'}
              </h3>
              {!isEditing && (
                <button 
                  onClick={startEditing}
                  className="px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="p-8">
              <div className="flex flex-col md:flex-row gap-8 mb-8 items-start">
                {/* Logo Section */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
                    {(formData.logo || selectedCompany.logo) && !isAddingNew ? (
                      <img src={isEditing ? formData.logo : selectedCompany.logo} alt="Logo" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                    ) : (
                      <>
                        <ImageIcon className="text-slate-300 mb-1" size={24} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-2">No Logo</span>
                      </>
                    )}
                    {isEditing && (
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col items-center justify-center text-white">
                        <Upload size={20} className="mb-1" />
                        <span className="text-[10px] font-bold uppercase">Change</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Company Logo</p>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Company Registered Name</label>
                    <input 
                      required
                      disabled={!isEditing}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-medium disabled:bg-white disabled:border-transparent"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter legal business name"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mailing Address</label>
                    <textarea 
                      required
                      disabled={!isEditing}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-medium disabled:bg-white disabled:border-transparent"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      placeholder="Complete business address..."
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
                    <Globe size={14} className="text-slate-400" /> GSTIN Number
                  </label>
                  <input 
                    disabled={!isEditing}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono uppercase disabled:bg-white disabled:border-transparent"
                    value={formData.gstin}
                    onChange={e => setFormData({...formData, gstin: e.target.value})}
                    placeholder="27AAAAA0000A1Z5"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
                    <Phone size={14} className="text-slate-400" /> Contact Number
                  </label>
                  <input 
                    disabled={!isEditing}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm disabled:bg-white disabled:border-transparent"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="+91 22 2345 6789"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
                    <Mail size={14} className="text-slate-400" /> Business Email
                  </label>
                  <input 
                    disabled={!isEditing}
                    type="email"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm disabled:bg-white disabled:border-transparent"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="accounts@business.com"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
                    <Globe size={14} className="text-slate-400" /> Website URL
                  </label>
                  <input 
                    disabled={!isEditing}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm disabled:bg-white disabled:border-transparent"
                    value={formData.website}
                    onChange={e => setFormData({...formData, website: e.target.value})}
                    placeholder="www.business.com"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
                    Country
                  </label>
                  <select 
                    disabled={!isEditing}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm disabled:bg-white disabled:border-transparent"
                    value={formData.country}
                    onChange={e => setFormData({...formData, country: e.target.value})}
                  >
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
                    Base Currency
                  </label>
                  <select 
                    disabled={!isEditing}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm disabled:bg-white disabled:border-transparent"
                    value={formData.currency}
                    onChange={e => setFormData({...formData, currency: e.target.value})}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
                    State Code (Place of Supply)
                  </label>
                  <input 
                    disabled={!isEditing}
                    maxLength={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono disabled:bg-white disabled:border-transparent"
                    value={formData.stateCode}
                    onChange={e => setFormData({...formData, stateCode: e.target.value})}
                    placeholder="09"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
                    <Calendar size={14} className="text-slate-400" /> Financial Year Start
                  </label>
                  <input 
                    disabled={!isEditing}
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm disabled:bg-white disabled:border-transparent"
                    value={formData.financialYearStart}
                    onChange={e => setFormData({...formData, financialYearStart: e.target.value})}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
                    <Calendar size={14} className="text-slate-400" /> Books Beginning From
                  </label>
                  <input 
                    disabled={!isEditing}
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm disabled:bg-white disabled:border-transparent"
                    value={formData.bookBeginningFrom}
                    onChange={e => setFormData({...formData, bookBeginningFrom: e.target.value})}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-4 pt-8">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsEditing(false);
                      setIsAddingNew(false);
                    }}
                    className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
                  >
                    {isAddingNew ? 'Create Company Account' : 'Update Global Profile'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
