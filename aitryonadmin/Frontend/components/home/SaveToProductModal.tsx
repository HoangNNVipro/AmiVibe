import React from 'react';

interface SaveToProductModalProps {
  target: { id: string, imageUrl: string, items: any[] } | null;
  onClose: () => void;
  selectedProducts: string[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<string[]>>;
  isSyncing: boolean;
  onConfirm: () => void;
}

export const SaveToProductModal: React.FC<SaveToProductModalProps> = ({
  target,
  onClose,
  selectedProducts,
  setSelectedProducts,
  isSyncing,
  onConfirm
}) => {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[#121212] border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
        <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e]">
              <i className="fa-solid fa-bookmark"></i>
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Save to Products</h3>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Select items to update links</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-all"
          >
            <i className="fa-solid fa-xmark text-white/40"></i>
          </button>
        </header>

        <div className="p-8">
          {target.items.filter(item => item.productId).length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                <i className="fa-solid fa-ghost text-4xl"></i>
              </div>
              <p className="text-white/60 font-medium italic">No products available in this record to save to.</p>
              <p className="text-[11px] text-white/30 max-w-[280px]">Clothing items uploaded manually cannot be saved back to the product database.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {target.items
                  .filter(item => item.productId)
                  .map((item, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        setSelectedProducts(prev => 
                          prev.includes(item.productId) 
                            ? prev.filter(id => id !== item.productId)
                            : [...prev, item.productId]
                        );
                      }}
                      className={`relative aspect-square rounded-[24px] overflow-hidden border-2 transition-all p-2 bg-[#0a0a0a] group ${
                        selectedProducts.includes(item.productId) 
                          ? 'border-[#22c55e] bg-[#22c55e]/5' 
                          : 'border-white/5 hover:border-white/20'
                      }`}
                    >
                      <img src={item.imageUrl} className="w-full h-full object-contain mix-blend-lighten" />
                      
                      <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        item.category === 'Topwear' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {item.category}
                      </div>

                      {selectedProducts.includes(item.productId) && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#22c55e] text-black flex items-center justify-center shadow-lg animate-in zoom-in-50">
                          <i className="fa-solid fa-check text-[12px] font-black"></i>
                        </div>
                      )}
                    </button>
                  ))
                }
              </div>
              
              <button 
                onClick={onConfirm}
                disabled={isSyncing}
                className="w-full h-14 rounded-2xl bg-[#22c55e] text-black font-black uppercase tracking-widest text-[13px] shadow-lg shadow-[#22c55e]/20 disabled:opacity-50 disabled:grayscale-0 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-3"
              >
                {isSyncing ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin text-lg"></i>
                    <span>Syncing...</span>
                  </>
                ) : (
                  "Confirm Selection"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
