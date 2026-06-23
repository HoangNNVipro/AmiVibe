import React from 'react';
import { GenerationEntry } from '../../types';

interface GenerationHistorySectionProps {
  generationHistory: GenerationEntry[];
  history: any[];
  editingVirtualModelId: string | null;
  editingTryOnId: string | null;
  activeHistoryIndex: number;
  handleEditVirtualModel: (id: string, index: number) => void;
  handleEditTryOn: (id: string, index: number) => void;
  setDeletingId: (id: string) => void;
  setViewerImage: (img: any) => void;
  setSaveToProductTarget: (target: any) => void;
  setDeletingImageInfo: (info: any) => void;
  downloadImage: (url: string, filename: string) => void;
  formatViewerTitle: (img: any) => string;
}

export const GenerationHistorySection: React.FC<GenerationHistorySectionProps> = ({
  generationHistory,
  history,
  editingVirtualModelId,
  editingTryOnId,
  activeHistoryIndex,
  handleEditVirtualModel,
  handleEditTryOn,
  setDeletingId,
  setViewerImage,
  setSaveToProductTarget,
  setDeletingImageInfo,
  downloadImage,
  formatViewerTitle
}) => {
  return (
    <div className="flex flex-col">
      {generationHistory.map((gen, idx) => {
        const originalRecord = history.find(h => 
          h.type === gen.type && 
          new Date(h.createdAt).getTime() === gen.timestamp
        );
        const isEditing = originalRecord?._id === editingVirtualModelId || originalRecord?._id === editingTryOnId;

        return (
          <section 
            key={idx} 
            id={`session-${idx}`} 
            className={`py-8 px-10 border-b border-white/5 transition-all ${activeHistoryIndex === idx ? 'bg-white/[0.02]' : ''} ${isEditing ? 'ring-2 ring-[#22c55e] ring-inset' : ''}`}
          >
            <div className="flex flex-col mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <i className="fa-regular fa-image text-white/90 text-lg"></i>
                  <span className="text-[14px] font-bold text-white/90">
                    {gen.type === 'virtual-model' ? 'Virtual Model' : 'AI Outfit'}
                  </span>
                  {(gen.type === 'virtual-model' || gen.type === 'try-on') && originalRecord?._id && (
                    <div className="ml-4 flex items-center gap-1.5">
                      <button 
                        onClick={() => {
                          if (gen.type === 'virtual-model') {
                            handleEditVirtualModel(originalRecord._id!, idx);
                          } else {
                            handleEditTryOn(originalRecord._id!, idx);
                          }
                        }}
                        className={`p-2 rounded-lg transition-all ${isEditing ? 'text-[#22c55e] bg-[#22c55e]/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        title="Edit this record"
                      >
                        <i className="fa-solid fa-pen-to-square text-sm"></i>
                      </button>
                      <button 
                        onClick={() => setDeletingId(originalRecord._id!)}
                        className="p-2 rounded-lg text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                        title="Delete this record"
                      >
                        <i className="fa-solid fa-trash-can text-sm"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {gen.type === 'virtual-model' && gen.prompt && (
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-[13px] text-white/60">{gen.prompt}</p>
                </div>
              )}
            </div>
            <div className="flex flex-nowrap gap-6 overflow-x-auto no-scrollbar pb-4 items-start">
              {gen.images.map((img, i) => (
                <div 
                  key={i} 
                  onClick={() => {
                    setViewerImage({ url: img, type: gen.type, prompt: gen.prompt, timestamp: gen.timestamp });
                  }}
                  className="relative group rounded-xl overflow-hidden bg-black border border-white/10 aspect-[3/4] shadow-2xl transition-all hover:scale-[1.02] hover:border-white/20 flex-shrink-0 cursor-pointer" 
                  style={{ width: gen.images.length > 3 ? 'calc(25% - 18px)' : '300px', minWidth: '220px' }}
                >
                  <img src={img} className="w-full h-full object-cover" loading="lazy" />
                  
                  <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
                    {gen.type === 'try-on' && (
                      <div className="group/btn flex items-center justify-end">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (originalRecord?._id) {
                              const items = (originalRecord as any).clothingItems || [];
                              setSaveToProductTarget({ id: originalRecord._id, imageUrl: img, items });
                            }
                          }}
                          className="h-9 px-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-0 overflow-hidden transition-all duration-500 max-w-[36px] group-hover/btn:max-w-[160px] group-hover/btn:bg-[#22c55e]/20 group-hover/btn:border-[#22c55e]/30 group-hover/btn:gap-2 text-white"
                          title="Save to Products"
                        >
                          <i className="fa-solid fa-bookmark text-[14px] flex-shrink-0 group-hover/btn:text-[#22c55e]"></i>
                          <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300">SAVE TO PRODUCT</span>
                        </button>
                      </div>
                    )}

                    <div className="group/btn flex items-center justify-end">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(img, formatViewerTitle({ type: gen.type, prompt: gen.prompt, timestamp: gen.timestamp }));
                        }}
                        className="h-9 px-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-0 overflow-hidden transition-all duration-500 max-w-[36px] group-hover/btn:max-w-[160px] group-hover/btn:bg-blue-500/20 group-hover/btn:border-blue-500/30 group-hover/btn:gap-2 text-white"
                        title="Download image"
                      >
                        <i className="fa-solid fa-download text-[14px] flex-shrink-0 group-hover/btn:text-blue-500"></i>
                        <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300">Download</span>
                      </button>
                    </div>

                    <div className="group/btn flex items-center justify-end">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (originalRecord?._id) {
                            setDeletingImageInfo({ id: originalRecord._id, type: gen.type, url: img });
                          }
                        }}
                        className="h-9 px-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-0 overflow-hidden transition-all duration-500 max-w-[36px] group-hover/btn:max-w-[160px] group-hover/btn:bg-red-500/20 group-hover/btn:border-red-500/30 group-hover/btn:gap-2 text-white"
                        title="Remove from record"
                      >
                        <i className="fa-solid fa-trash-can text-[14px] flex-shrink-0 group-hover/btn:text-red-500"></i>
                        <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
