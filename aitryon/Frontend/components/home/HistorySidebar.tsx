import React from 'react';

interface HistorySidebarProps {
  loading: boolean;
  generationHistory: any[];
  activeHistoryIndex: number;
  scrollToSection: (index: number) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  loading,
  generationHistory,
  activeHistoryIndex,
  scrollToSection
}) => {
  return (
    <div className="w-[80px] border-l border-white/5 bg-[#0a0a0a] flex flex-col items-center py-6 gap-5 overflow-y-auto no-scrollbar z-20">
      {loading ? (
        <div className="flex flex-col gap-4 opacity-50 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-[56px] h-[56px] rounded-xl bg-white/5 border border-white/10"></div>
          ))}
        </div>
      ) : (
        <>
          {generationHistory.map((gen, idx) => (
            <button key={idx} onClick={() => scrollToSection(idx)} className={`w-[56px] h-[56px] rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 relative shadow-lg ${activeHistoryIndex === idx ? 'border-[#4dff4d] scale-110' : 'border-white/5 opacity-50 hover:opacity-100 hover:scale-105'}`}>
              <img src={gen.images[0]} className="w-full h-full object-cover" />
              {activeHistoryIndex === idx && <div className="absolute inset-0 bg-[#4dff4d]/10"></div>}
            </button>
          ))}
          {generationHistory.length === 0 && <div className="flex flex-col gap-4 opacity-10">{[1, 2, 3, 4].map(i => <div key={i} className="w-12 h-12 rounded-xl border border-white/20 border-dashed"></div>)}</div>}
        </>
      )}
    </div>
  );
};
