
import React from 'react';
import { Factory, ChevronRight, Package, Info, AlertCircle, CheckCircle2, Printer, X } from 'lucide-react';
import { BillOfMaterials, StockItem, Company } from '../types';

interface ManufacturingProps {
  boms: BillOfMaterials[];
  inventory: StockItem[];
  activeCompany: Company;
}

const Manufacturing: React.FC<ManufacturingProps> = ({ boms, inventory, activeCompany }) => {
  const [showJobCard, setShowJobCard] = React.useState(false);
  const [selectedBOM, setSelectedBOM] = React.useState<BillOfMaterials | null>(null);

  const handlePrintJobCard = (bom: BillOfMaterials) => {
    setSelectedBOM(bom);
    setShowJobCard(true);
  };

  const handlePrint = () => {
    if (selectedBOM) {
      const finishedGood = inventory.find(i => i.id === selectedBOM.finishedGoodId);
      const productName = finishedGood?.name.replace(/\s+/g, '_') || 'Product';
      document.title = `JobCard_${productName}_${new Date().toISOString().split('T')[0]}`;
    }
    window.print();
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manufacturing Center</h2>
          <p className="text-slate-500">Manage multi-level Bill of Materials and track component requirements.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all">
          <Factory size={20} />
          New BOM
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {boms.map((bom) => {
          const finishedGood = inventory.find(i => i.id === bom.finishedGoodId);
          
          // Calculate total estimated cost for one unit
          const totalUnitCost = bom.components.reduce((acc, comp) => {
            const item = inventory.find(i => i.id === comp.itemId);
            return acc + (comp.quantity * (item?.rate || 0));
          }, 0);

          // Check feasibility (simple check: are all components available in any amount?)
          const isFeasible = bom.components.every(comp => {
            const item = inventory.find(i => i.id === comp.itemId);
            return (item?.quantity || 0) >= comp.quantity;
          });

          return (
            <div key={bom.id} className="bg-white rounded-3xl tally-shadow border border-slate-100 overflow-hidden">
              <div className="p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
                {/* Left: Finished Good Info */}
                <div className="lg:w-1/3 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                      <Package size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-slate-800">{finishedGood?.name}</h3>
                      <p className="text-sm text-slate-500">ID: {finishedGood?.id} • {finishedGood?.category}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Current Stock</p>
                      <p className="text-lg font-bold text-slate-800">{finishedGood?.quantity} {finishedGood?.unit}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Unit Cost</p>
                      <p className="text-lg font-bold text-indigo-600">${totalUnitCost.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl flex items-center gap-3 ${isFeasible ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                    {isFeasible ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="text-sm font-semibold">
                      {isFeasible ? 'Production Feasible' : 'Critical Shortage'}
                    </span>
                  </div>
                </div>

                {/* Right: BOM Details Table */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                      <Info size={16} className="text-slate-400" />
                      Component Checklist
                    </h4>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Per 1 Unit Production</span>
                  </div>
                  
                  <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="px-6 py-4">Item Name</th>
                          <th className="px-6 py-4">Req. Qty</th>
                          <th className="px-6 py-4">Available</th>
                          <th className="px-6 py-4 text-right">Unit Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bom.components.map((comp) => {
                          const item = inventory.find(i => i.id === comp.itemId);
                          const hasEnough = (item?.quantity || 0) >= comp.quantity;
                          
                          return (
                            <tr key={comp.itemId} className="hover:bg-slate-100/50 transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-semibold text-slate-700">{item?.name}</span>
                                <p className="text-[10px] text-slate-400">RAW MATERIAL</p>
                              </td>
                              <td className="px-6 py-4 font-mono text-sm">
                                {comp.quantity} {item?.unit}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${hasEnough ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  <span className={`text-sm font-medium ${hasEnough ? 'text-slate-600' : 'text-red-600 font-bold'}`}>
                                    {item?.quantity} {item?.unit}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-slate-500">
                                ${item?.rate}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-3">
                    <button 
                      onClick={() => handlePrintJobCard(bom)}
                      className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 border border-slate-200 rounded-lg transition-all"
                    >
                      <Printer size={16} />
                      Job Card
                    </button>
                    <button className="px-6 py-2 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-md">
                      Plan Production Batch
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Job Card Print Preview */}
      {showJobCard && selectedBOM && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <div className="flex items-center gap-3">
                   <Printer size={20} className="text-indigo-600" />
                   <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Production Job Card Preview</h3>
                 </div>
                 <div className="flex gap-2">
                   <button onClick={handlePrint} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">
                      <Printer size={14} /> Print Job Card
                   </button>
                   <button onClick={() => setShowJobCard(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">Close</button>
                 </div>
              </div>

              <div id="printable-jobcard" className="flex-1 overflow-y-auto p-12 bg-white">
                 <div className="border-[1.5px] border-slate-900 p-0 text-slate-900 leading-tight">
                    <div className="bg-slate-900 text-white p-2 text-center text-sm font-black tracking-[0.3em] uppercase border-b-[1.5px] border-slate-900">
                       PRODUCTION JOB CARD
                    </div>

                    <div className="grid grid-cols-2 border-b-[1.5px] border-slate-900">
                       <div className="p-4 border-r-[1.5px] border-slate-900 space-y-1">
                          <h2 className="text-lg font-black uppercase">{activeCompany.name}</h2>
                          <div className="text-[10px] font-bold leading-tight">{activeCompany.address}</div>
                       </div>
                       <div className="grid grid-cols-2">
                          <div className="p-4 border-r-[1.5px] border-slate-900 border-b-[1.5px] border-slate-900">
                             <div className="text-[8px] font-black uppercase text-slate-500 mb-1">Batch No.</div>
                             <div className="text-xs font-black font-mono">#{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</div>
                          </div>
                          <div className="p-4 border-b-[1.5px] border-slate-900">
                             <div className="text-[8px] font-black uppercase text-slate-500 mb-1">Date</div>
                             <div className="text-xs font-black font-mono">{new Date().toISOString().split('T')[0]}</div>
                          </div>
                          <div className="p-4 col-span-2 bg-slate-50/50">
                             <div className="text-[8px] font-black uppercase text-slate-500 mb-1">Target Product</div>
                             <div className="text-[11px] font-black uppercase">
                                {inventory.find(i => i.id === selectedBOM.finishedGoodId)?.name}
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="p-6">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Raw Material / Component Checklist</h4>
                       <table className="w-full border-collapse border-[1px] border-slate-900">
                          <thead>
                             <tr className="bg-slate-100 border-b-[1px] border-slate-900">
                                <th className="p-2 border-r-[1px] border-slate-900 text-[9px] font-black uppercase text-center w-12">S.No</th>
                                <th className="p-2 border-r-[1px] border-slate-900 text-[9px] font-black uppercase text-left">Component Description</th>
                                <th className="p-2 border-r-[1px] border-slate-900 text-[9px] font-black uppercase text-center w-24">Required Qty</th>
                                <th className="p-2 border-r-[1px] border-slate-900 text-[9px] font-black uppercase text-center w-24">Issued Qty</th>
                                <th className="p-2 text-[9px] font-black uppercase text-center w-16">Remark</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y-[1px] divide-slate-400">
                             {selectedBOM.components.map((comp, idx) => {
                                const item = inventory.find(i => i.id === comp.itemId);
                                return (
                                 <tr key={idx}>
                                    <td className="p-2 border-r-[1px] border-slate-900 text-[10px] text-center font-mono">{idx + 1}</td>
                                    <td className="p-2 border-r-[1px] border-slate-900 text-[10px] font-black uppercase">{item?.name}</td>
                                    <td className="p-2 border-r-[1px] border-slate-900 text-[10px] text-center font-bold">{comp.quantity} {item?.unit}</td>
                                    <td className="p-2 border-r-[1px] border-slate-900 text-[10px] bg-slate-50/50"></td>
                                    <td className="p-2 text-[10px]"></td>
                                 </tr>
                                );
                             })}
                             {/* Padding rows */}
                             {Array.from({ length: 5 }).map((_, i) => (
                                <tr key={`p-${i}`} className="h-6">
                                   <td className="p-2 border-r-[1px] border-slate-900"></td>
                                   <td className="p-2 border-r-[1px] border-slate-900"></td>
                                   <td className="p-2 border-r-[1px] border-slate-900"></td>
                                   <td className="p-2 border-r-[1px] border-slate-900"></td>
                                   <td className="p-2"></td>
                                </tr>
                             ))}
                          </tbody>
                       </table>

                       <div className="mt-8 grid grid-cols-2 gap-8">
                          <div className="space-y-4">
                             <div className="border-[1.5px] border-slate-900 p-4">
                                <div className="text-[9px] font-black uppercase text-slate-500 mb-2">Production Instructions</div>
                                <div className="text-[9px] font-bold space-y-1">
                                   <p>• Follow safety protocols and wear protective gear.</p>
                                   <p>• Ensure precise measurement of raw materials.</p>
                                   <p>• Record any material wastage in the remark column.</p>
                                   <p>• Perform stage-wise quality checks.</p>
                                 </div>
                             </div>
                             <div className="border-[1.5px] border-slate-900 p-4">
                                <div className="text-[9px] font-black uppercase text-slate-500 mb-2">Quality Assurance Log</div>
                                <div className="space-y-2">
                                   <div className="flex justify-between border-b border-dotted border-slate-300 pb-1">
                                      <span className="text-[8px] font-black uppercase text-slate-400">Dimensions Check</span>
                                      <span className="text-[8px] font-bold">[ Pass / Fail ]</span>
                                   </div>
                                   <div className="flex justify-between border-b border-dotted border-slate-300 pb-1">
                                      <span className="text-[8px] font-black uppercase text-slate-400">Finish / Texture</span>
                                      <span className="text-[8px] font-bold">[ Pass / Fail ]</span>
                                   </div>
                                   <div className="flex justify-between border-b border-dotted border-slate-300 pb-1">
                                      <span className="text-[8px] font-black uppercase text-slate-400">Weight Verification</span>
                                      <span className="text-[8px] font-bold">[ Pass / Fail ]</span>
                                   </div>
                                </div>
                             </div>
                          </div>

                          <div className="grid grid-rows-3 gap-0 border-[1.5px] border-slate-900">
                             <div className="p-4 border-b-[1.5px] border-slate-900 relative">
                                <span className="text-[9px] font-black uppercase text-slate-400 block mb-8 underline">Warehouse Issuer</span>
                                <div className="absolute right-4 bottom-2 text-[8px] font-bold opacity-30 italic">Signature & Date</div>
                             </div>
                             <div className="p-4 border-b-[1.5px] border-slate-900 relative">
                                <span className="text-[9px] font-black uppercase text-slate-400 block mb-8 underline">Production Head</span>
                                <div className="absolute right-4 bottom-2 text-[8px] font-bold opacity-30 italic">Signature & Date</div>
                             </div>
                             <div className="p-4 relative bg-slate-50/50">
                                <span className="text-[9px] font-black uppercase text-slate-400 block mb-8 underline">QA/QC Inspector</span>
                                <div className="absolute right-4 bottom-2 text-[8px] font-bold opacity-30 italic">Stamp & Final Approval</div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="p-4 bg-slate-900 text-white text-center">
                       <p className="text-[8px] font-black uppercase tracking-[0.2em]">ForgeERP Industry Core - Internal Job Token</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Manufacturing;
