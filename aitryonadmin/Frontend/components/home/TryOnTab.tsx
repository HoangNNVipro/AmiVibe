import React from 'react';
import { AppState, GarmentTab, GarmentCategory } from '../../types';

interface TryOnTabProps {
  setIsModelModalOpen: (open: boolean) => void;
  modelFileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, target: 'model' | 'top' | 'bottom' | 'single') => void;
  selectedModelData: any;
  selectedModelUri: string | null;
  handleDeleteModel: (e: React.MouseEvent) => void;
  garmentTab: GarmentTab;
  setGarmentTab: (tab: GarmentTab) => void;
  setIsProductModalOpen: (open: boolean) => void;
  setProductTarget: (target: 'single' | 'top' | 'bottom') => void;
  setProductFilters: React.Dispatch<React.SetStateAction<any>>;
  selectedGarmentData: any;
  selectedGarmentUri: any;
  singleFileInputRef: React.RefObject<HTMLInputElement>;
  topFileInputRef: React.RefObject<HTMLInputElement>;
  bottomFileInputRef: React.RefObject<HTMLInputElement>;
  handleDeleteGarment: (target: 'single' | 'top' | 'bottom', e: React.MouseEvent) => void;
  isOutputDropdownOpen: boolean;
  setIsOutputDropdownOpen: (open: boolean) => void;
  outputCount: number;
  setOutputCount: (count: number) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
  handleGenerate: () => void;
  isProcessing: boolean;
}

export const TryOnTab: React.FC<TryOnTabProps> = ({
  setIsModelModalOpen,
  modelFileInputRef,
  handleFileUpload,
  selectedModelData,
  selectedModelUri,
  handleDeleteModel,
  garmentTab,
  setGarmentTab,
  setIsProductModalOpen,
  setProductTarget,
  setProductFilters,
  selectedGarmentData,
  selectedGarmentUri,
  singleFileInputRef,
  topFileInputRef,
  bottomFileInputRef,
  handleDeleteGarment,
  isOutputDropdownOpen,
  setIsOutputDropdownOpen,
  outputCount,
  setOutputCount,
  dropdownRef,
  handleGenerate,
  isProcessing
}) => {
  return (
    <div className="flex-1 flex flex-col px-4 py-6 overflow-y-auto no-scrollbar space-y-10">
      
      {/* MODEL SECTION */}
      <div className="space-y-4 pb-8 border-b border-white/5">
        <div className="flex items-center gap-3 px-1">
          <i className="fa-regular fa-user text-white/60 text-lg"></i>
          <h3 className="text-[13px] font-bold uppercase tracking-tight text-white/50">MODELS</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => setIsModelModalOpen(true)}
            className={`h-[38px] bg-[#1a1a1a] hover:bg-[#222] border rounded-md flex items-center justify-center gap-2 transition-all group px-3 ${selectedModelData && selectedModelUri !== 'uploaded' ? 'border-white' : 'border-white/5'}`}
          >
            <i className="fa-solid fa-table-cells text-[#22c55e] text-[12px]"></i>
            <span className="text-[10px] font-medium text-white/90 uppercase tracking-wide">VIRTUAL MODELS</span>
          </button>
          <button 
            onClick={() => modelFileInputRef.current?.click()}
            className={`h-[38px] bg-[#1a1a1a] hover:bg-[#222] border rounded-md flex items-center justify-center gap-2 transition-all group px-3 ${selectedModelData && selectedModelUri === 'uploaded' ? 'border-white' : 'border-white/5'}`}
          >
            <i className="fa-solid fa-arrow-up-from-bracket text-[#22c55e] text-[12px]"></i>
            <span className="text-[10px] font-medium text-white/90 uppercase tracking-wide">UPLOAD IMAGE</span>
          </button>
          <input type="file" ref={modelFileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'model')} />
        </div>

        {selectedModelData && (
          <div className="relative bg-[#111] border border-white/10 rounded-2xl p-3 flex items-center gap-4 shadow-xl animate-in fade-in slide-in-from-top-1 duration-300 group">
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/5 flex-shrink-0">
              <img src={selectedModelData.url} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-blue-400 mb-0.5">Selected:</p>
              <h4 className="text-[14px] font-black text-white truncate">{selectedModelData.name}</h4>
              <p className="text-[10px] text-white/40 truncate">{selectedModelData.desc}</p>
            </div>
            <button 
              onClick={handleDeleteModel}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            >
              <i className="fa-solid fa-xmark text-[10px] text-white/40"></i>
            </button>
          </div>
        )}
      </div>

      {/* GARMENT SECTION */}
      <div className="space-y-6 pb-2">
        <div className="flex items-center gap-3 px-1">
          <i className="fa-solid fa-shirt text-white/60 text-lg"></i>
          <h3 className="text-[13px] font-bold uppercase tracking-tight text-white/50">GARMENTS</h3>
        </div>

        <div className="flex bg-[#0d0d0d] rounded-xl p-1 w-full border border-white/5 shadow-inner">
          <button 
            onClick={() => setGarmentTab('single')} 
            className={`flex-1 h-[38px] rounded-lg transition-all text-[11px] font-black uppercase tracking-wider ${garmentTab === 'single' ? 'bg-[#2a2a2a] text-[#22c55e] shadow-xl' : 'text-white/30 hover:text-white/50'}`}
          >
            SINGLE
          </button>
          <button 
            onClick={() => setGarmentTab('multiple')} 
            className={`flex-1 h-[38px] rounded-lg transition-all text-[11px] font-black uppercase tracking-wider ${garmentTab === 'multiple' ? 'bg-[#2a2a2a] text-[#22c55e] shadow-xl' : 'text-white/30 hover:text-white/50'}`}
          >
            MULTIPLE
          </button>
        </div>

        {garmentTab === 'single' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => { 
                  setProductTarget('single'); 
                  setProductFilters((f: any) => ({ ...f, category: 'all' }));
                  setIsProductModalOpen(true); 
                }}
                className={`h-[38px] bg-[#1a1a1a] hover:bg-[#222] border rounded-md flex items-center justify-center gap-2 transition-all group px-3 ${selectedGarmentData.single && selectedGarmentUri.single !== 'uploaded' ? 'border-white' : 'border-white/5'}`}
              >
                <i className="fa-solid fa-table-cells text-[#22c55e] text-[12px]"></i>
                <span className="text-[10px] font-medium text-white/90 uppercase tracking-wide">SHOP GALLERY</span>
              </button>
              <button 
                onClick={() => singleFileInputRef.current?.click()}
                className={`h-[38px] bg-[#1a1a1a] hover:bg-[#222] border rounded-md flex items-center justify-center gap-2 transition-all group px-3 ${selectedGarmentData.single && selectedGarmentUri.single === 'uploaded' ? 'border-white' : 'border-white/5'}`}
              >
                <i className="fa-solid fa-arrow-up-from-bracket text-[#22c55e] text-[12px]"></i>
                <span className="text-[10px] font-medium text-white/90 uppercase tracking-wide">UPLOAD IMAGE</span>
              </button>
              <input type="file" ref={singleFileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'single')} />
            </div>

            {selectedGarmentData.single && (
              <div className="relative bg-[#0d0d0d] border border-white/10 rounded-2xl p-4 flex items-center gap-5 shadow-2xl animate-in zoom-in-95 group">
                <div className="w-16 h-16 rounded-xl bg-black border border-white/5 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  <img src={selectedGarmentData.single.url} className="h-full w-auto object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-[9px] font-black uppercase tracking-wider mb-2">SELECTED GARMENT</span>
                  <h4 className="text-[14px] font-black text-white truncate">{selectedGarmentData.single.name}</h4>
                  <p className="text-[9px] text-white/40 truncate">{selectedGarmentData.single.desc}</p>
                </div>
                <button 
                  onClick={(e) => handleDeleteGarment('single', e)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <i className="fa-solid fa-xmark text-[10px] text-white/40"></i>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1 px-1">
                 <p className="text-[12px] font-black uppercase tracking-widest text-white/90">TOP GARMENT</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <button 
                   onClick={() => { 
                     setProductTarget('top'); 
                     setProductFilters((f: any) => ({ ...f, category: 'Topwear' }));
                     setIsProductModalOpen(true); 
                   }} 
                   className={`h-[38px] bg-[#1a1a1a] hover:bg-[#222] border rounded-md flex items-center justify-center gap-2 transition-all group px-3 ${selectedGarmentData.top && selectedGarmentUri.top !== 'uploaded' ? 'border-white' : 'border-white/5'}`}
                 >
                   <i className="fa-solid fa-table-cells text-[#22c55e] text-[12px]"></i>
                   <span className="text-[10px] font-medium text-white/90 uppercase tracking-wide">SHOP GALLERY</span>
                 </button>
                 <button onClick={() => topFileInputRef.current?.click()} className={`h-[38px] bg-[#1a1a1a] hover:bg-[#222] border rounded-md flex items-center justify-center gap-2 transition-all group px-3 ${selectedGarmentData.top && selectedGarmentUri.top === 'uploaded' ? 'border-white' : 'border-white/5'}`}>
                   <i className="fa-solid fa-arrow-up-from-bracket text-[#22c55e] text-[12px]"></i>
                   <span className="text-[10px] font-medium text-white/90 uppercase tracking-wide">UPLOAD IMAGE</span>
                 </button>
                 <input type="file" ref={topFileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'top')} />
              </div>
              {selectedGarmentData.top && (
                <div className="relative bg-[#0d0d0d] border border-white/5 rounded-xl p-2.5 flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-lg bg-black border border-white/5 flex-shrink-0 flex items-center justify-center overflow-hidden"><img src={selectedGarmentData.top.url} className="h-full w-auto object-contain" /></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-bold text-white/90 truncate">{selectedGarmentData.top.name}</h4>
                    <p className="text-[9px] text-white/40 uppercase font-black">Top</p>
                  </div>
                  <button onClick={(e) => handleDeleteGarment('top', e)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"><i className="fa-solid fa-xmark text-[10px] text-white/40"></i></button>
                </div>
              )}
            </div>

            <div className="flex justify-center py-4">
              <i className="fa-solid fa-arrow-down text-white/10 text-sm"></i>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1 px-1">
                 <p className="text-[12px] font-black uppercase tracking-widest text-white/90">BOTTOM GARMENT</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <button 
                   onClick={() => { 
                     setProductTarget('bottom'); 
                     setProductFilters((f: any) => ({ ...f, category: 'Bottomwear' }));
                     setIsProductModalOpen(true); 
                   }} 
                   className={`h-[38px] bg-[#1a1a1a] hover:bg-[#222] border rounded-md flex items-center justify-center gap-2 transition-all group px-3 ${selectedGarmentData.bottom && selectedGarmentUri.bottom !== 'uploaded' ? 'border-white' : 'border-white/5'}`}
                 >
                   <i className="fa-solid fa-table-cells text-[#22c55e] text-[12px]"></i>
                   <span className="text-[10px] font-medium text-white/90 uppercase tracking-wide">SHOP GALLERY</span>
                 </button>
                 <button onClick={() => bottomFileInputRef.current?.click()} className={`h-[38px] bg-[#1a1a1a] hover:bg-[#222] border rounded-md flex items-center justify-center gap-2 transition-all group px-3 ${selectedGarmentData.bottom && selectedGarmentUri.bottom === 'uploaded' ? 'border-white' : 'border-white/5'}`}>
                   <i className="fa-solid fa-arrow-up-from-bracket text-[#22c55e] text-[12px]"></i>
                   <span className="text-[10px] font-medium text-white/90 uppercase tracking-wide">UPLOAD IMAGE</span>
                 </button>
                 <input type="file" ref={bottomFileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'bottom')} />
              </div>
              {selectedGarmentData.bottom && (
                <div className="relative bg-[#0d0d0d] border border-white/5 rounded-xl p-2.5 flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-lg bg-black border border-white/5 flex-shrink-0 flex items-center justify-center overflow-hidden"><img src={selectedGarmentData.bottom.url} className="h-full w-auto object-contain" /></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-bold text-white/90 truncate">{selectedGarmentData.bottom.name}</h4>
                    <p className="text-[9px] text-white/40 uppercase font-black">Bottom</p>
                  </div>
                  <button onClick={(e) => handleDeleteGarment('bottom', e)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"><i className="fa-solid fa-xmark text-[10px] text-white/40"></i></button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Generation Controls */}
      <div className="px-0 py-6 border-t border-white/5 bg-[#0d0d0d] flex items-center gap-2">
        <div className="relative w-1/3" ref={dropdownRef}>
          <button onClick={() => setIsOutputDropdownOpen(!isOutputDropdownOpen)} className="w-full h-[44px] flex items-center justify-between bg-[#111] border border-white/20 rounded-lg px-3 text-[11px] font-medium hover:bg-[#1a1a1a] transition-all"><span className="opacity-60">{outputCount} Outputs</span><i className={`fa-solid fa-chevron-${isOutputDropdownOpen ? 'up' : 'down'} text-[8px] opacity-40`}></i></button>
          {isOutputDropdownOpen && (
            <div className="absolute bottom-full left-0 w-40 mb-2 bg-[#1e1e24] rounded-xl border border-white/5 shadow-2xl overflow-hidden z-50 py-1">
              {[1, 2, 3, 4].map(num => (
                <button key={num} onClick={() => { setOutputCount(num); setIsOutputDropdownOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-medium text-left hover:bg-white/5 transition-colors ${outputCount === num ? 'text-[#4dff4d] bg-white/5' : 'text-white'}`}><span>{num} Output{num > 1 ? 's' : ''}</span>{outputCount === num && <i className="fa-solid fa-check text-[10px]"></i>}</button>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleGenerate} disabled={isProcessing} className="flex-1 bg-[#4dff4d] hover:bg-[#3ce63c] text-black font-bold h-[44px] rounded-lg flex items-center justify-center text-[13px] transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg">{isProcessing ? <i className="fa-solid fa-spinner animate-spin"></i> : "Generate"}</button>
      </div>
    </div>
  );
};
