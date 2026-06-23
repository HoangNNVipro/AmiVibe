import React from 'react';
import { Gender, AgeGroup } from '../../types';

interface ModelLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelLibrary: any[];
  modelFilters: {
    gender: Gender | 'all';
    age: AgeGroup | 'all';
    skinTone: string | 'all';
  };
  setModelFilters: (filters: any) => void;
  modelSearch: string;
  setModelSearch: (search: string) => void;
  handleModelSelect: (model: any) => void;
  skinTones: string[];
}

export const ModelLibraryModal: React.FC<ModelLibraryModalProps> = ({
  isOpen,
  onClose,
  modelLibrary,
  modelFilters,
  setModelFilters,
  modelSearch,
  setModelSearch,
  handleModelSelect,
  skinTones
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="bg-[#121212] rounded-[32px] w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10">
        <header className="flex items-center justify-between px-8 py-6 bg-[#0a0a0a] border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
              <i className="fa-solid fa-user-group text-lg"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black italic tracking-wider text-white uppercase">MODEL LIBRARY</h3>
              <p className="text-[10px] font-black tracking-widest text-[#22c55e] uppercase mt-0.5">SELECT A FITTING MODEL</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-all group"
          >
            <i className="fa-solid fa-xmark text-xl text-white/40 group-hover:text-white group-hover:rotate-90 transition-all duration-300"></i>
          </button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <aside className="w-64 border-r border-white/10 flex flex-col p-6 space-y-8 bg-black/10 overflow-y-auto no-scrollbar">
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-white/30 mb-5">GENDER</h4>
              <div className="flex flex-col gap-2">
                <button onClick={() => setModelFilters({ ...modelFilters, gender: 'all' })} className={`h-11 px-6 rounded-2xl flex items-center font-bold text-sm transition-all ${modelFilters.gender === 'all' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-white/40 hover:text-white/60'}`}>All</button>
                {[Gender.MALE, Gender.FEMALE].map(g => (
                  <button key={g} onClick={() => setModelFilters({ ...modelFilters, gender: g })} className={`h-11 px-6 rounded-2xl flex items-center font-bold text-sm transition-all ${modelFilters.gender === g ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-white/40 hover:text-white/60'}`}>
                    {g === Gender.MALE ? 'Male' : 'Female'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-white/30 mb-5">AGE</h4>
              <div className="flex flex-col gap-2">
                <button onClick={() => setModelFilters({ ...modelFilters, age: 'all' })} className={`h-11 px-6 rounded-2xl flex items-center font-bold text-sm transition-all ${modelFilters.age === 'all' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-white/40 hover:text-white/60'}`}>All</button>
                {[AgeGroup.CHILDREN, AgeGroup.YOUTH, AgeGroup.ELDERLY].map(a => (
                  <button key={a} onClick={() => setModelFilters({ ...modelFilters, age: a })} className={`h-11 px-6 rounded-2xl flex items-center font-bold text-sm transition-all ${modelFilters.age === a ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-white/40 hover:text-white/60'}`}>
                    {a === AgeGroup.CHILDREN ? 'Children' : a === AgeGroup.YOUTH ? 'Youth' : 'Elderly'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-white/30 mb-5">SKIN TONE</h4>
              <div className="flex flex-col gap-2">
                <button onClick={() => setModelFilters({ ...modelFilters, skinTone: 'all' })} className={`h-11 px-6 rounded-2xl flex items-center font-bold text-sm transition-all ${modelFilters.skinTone === 'all' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-white/40 hover:text-white/60'}`}>All</button>
                {skinTones.map(tone => (
                  <button 
                    key={tone} 
                    onClick={() => setModelFilters({ ...modelFilters, skinTone: tone })} 
                    className={`h-11 px-6 rounded-2xl flex items-center gap-3 font-bold text-sm transition-all ${modelFilters.skinTone === tone ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-white/40 hover:text-white/60'}`}
                  >
                    <div className="w-6 h-4 rounded-sm border border-white/20" style={{ backgroundColor: tone }}></div>
                    Tone {skinTones.indexOf(tone) + 1}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1 flex flex-col bg-[#0f0f0f]">
            <div className="px-8 py-6 border-b border-white/5">
               <div className="relative group">
                <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors"></i>
                <input 
                  type="text" 
                  value={modelSearch} 
                  onChange={(e) => setModelSearch(e.target.value)} 
                  placeholder="Search models..." 
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 text-sm focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.08] transition-all" 
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 no-scrollbar">
              {modelLibrary
                .filter(m => 
                  (modelFilters.gender === 'all' || m.gender === modelFilters.gender) && 
                  (modelFilters.age === 'all' || m.age === modelFilters.age) && 
                  (modelFilters.skinTone === 'all' || m.skinTone === modelFilters.skinTone) &&
                  (m.name.toLowerCase().includes(modelSearch.toLowerCase()) || 
                   (m.prompt && m.prompt.toLowerCase().includes(modelSearch.toLowerCase())))
                )
                .map(model => (
                  <div 
                    key={model.id} 
                    onClick={() => handleModelSelect(model)} 
                    className="group flex flex-col cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <div className="relative aspect-[3/4.2] rounded-[24px] overflow-hidden bg-[#222] border border-white/5 group-hover:border-blue-500/50 transition-all shadow-xl">
                      <img src={model.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <i className="fa-solid fa-circle-plus text-3xl text-blue-500 shadow-2xl"></i>
                      </div>
                    </div>
                    <div className="mt-4 px-1">
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1 block">{model.gender} / {model.age}</span>
                      <h4 className="text-[14px] font-bold text-white/90 truncate">{model.name}</h4>
                      <p className="text-[11px] text-white/30 truncate mt-0.5">{model.desc}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
