import React from 'react';
import { MainTab } from '../../types';

interface ImageViewerModalProps {
  viewerImage: { url: string, type: MainTab, prompt?: string, timestamp: number } | null;
  onClose: () => void;
  formatViewerTitle: (img: any) => string;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  panOffset: { x: number, y: number };
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  isDragging: boolean;
  onDownload: (url: string, title: string) => void;
  onSaveToProduct: (url: string, items: any[], id: string) => void;
  onDeleteImage: (id: string, type: string, url: string) => void;
  history: any[];
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  viewerImage,
  onClose,
  formatViewerTitle,
  zoom,
  setZoom,
  panOffset,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  isDragging,
  onDownload,
  onSaveToProduct,
  onDeleteImage,
  history
}) => {
  if (!viewerImage) return null;

  const currentRecord = history.find(h => 
    h.type === viewerImage.type && 
    new Date(h.createdAt).getTime() === viewerImage.timestamp
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative bg-[#0a0a0a] rounded-3xl w-full max-w-[92vw] max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="h-16 flex items-center justify-between px-6 bg-[#0a0a0a] border-b border-white/5 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group active:scale-90"
              title="Back"
            >
              <i className="fa-solid fa-arrow-left text-white/60 group-hover:text-white"></i>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/90 tracking-wide">{formatViewerTitle(viewerImage)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <button 
                onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                className="w-9 h-9 hover:bg-white/10 flex items-center justify-center transition-all border-r border-white/5"
              >
                <i className="fa-solid fa-minus text-[11px] opacity-60"></i>
              </button>
              <span className="px-4 text-[12px] font-bold text-white/60 min-w-[65px] text-center tabular-nums">{Math.round(zoom * 100)}%</span>
              <button 
                onClick={() => setZoom(Math.min(5, zoom + 0.25))}
                className="w-9 h-9 hover:bg-white/10 flex items-center justify-center transition-all border-l border-white/5"
              >
                <i className="fa-solid fa-plus text-[11px] opacity-60"></i>
              </button>
            </div>

            <div className="w-[1px] h-6 bg-white/10 mx-1"></div>

            <div className="flex items-center gap-2">
              {viewerImage.type === 'try-on' && (
                <div className="group/btn flex items-center">
                  <button 
                    onClick={() => {
                      if (currentRecord?._id) {
                        onSaveToProduct(viewerImage.url, (currentRecord as any).clothingItems || [], currentRecord._id);
                      }
                    }}
                    className="h-10 px-3 bg-white/5 hover:bg-[#22c55e]/20 border border-white/10 hover:border-[#22c55e]/30 rounded-xl flex items-center gap-0 overflow-hidden transition-all duration-500 max-w-[40px] group-hover/btn:max-w-[200px] group-hover/btn:gap-2.5 text-white"
                    title="Save to Products"
                  >
                    <i className="fa-solid fa-bookmark text-[16px] flex-shrink-0 group-hover/btn:text-[#22c55e]"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300">SAVE TO PRODUCT</span>
                  </button>
                </div>
              )}

              <div className="group/btn flex items-center">
                <button 
                  onClick={() => onDownload(viewerImage.url, formatViewerTitle(viewerImage))}
                  className="h-10 px-3 bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 rounded-xl flex items-center gap-0 overflow-hidden transition-all duration-500 max-w-[40px] group-hover/btn:max-w-[160px] group-hover/btn:gap-2.5 text-white"
                  title="Download Image"
                >
                  <i className="fa-solid fa-download text-[16px] flex-shrink-0 group-hover/btn:text-blue-500"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300">Download</span>
                </button>
              </div>

              <div className="group/btn flex items-center">
                <button 
                  onClick={() => {
                    if (currentRecord?._id) {
                      onDeleteImage(currentRecord._id, viewerImage.type, viewerImage.url);
                    }
                  }}
                  className="h-10 px-3 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-xl flex items-center gap-0 overflow-hidden transition-all duration-500 max-w-[40px] group-hover/btn:max-w-[140px] group-hover/btn:gap-2.5 text-white"
                  title="Delete Image"
                >
                  <i className="fa-solid fa-trash-can text-[16px] flex-shrink-0 group-hover/btn:text-red-500"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300">Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="flex-1 overflow-hidden bg-[#080808] flex items-center justify-center custom-viewer-scroll no-scrollbar relative select-none"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <div 
            className="relative transition-transform duration-300 ease-out will-change-transform"
            style={{ 
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out'
            }}
          >
            <img 
              src={viewerImage.url} 
              className="max-h-[82vh] w-auto border border-white/5 rounded-sm pointer-events-none shadow-2xl"
              alt="Detail View"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
