import React from 'react';

interface ProductLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productLibrary: any[];
  productFilters: {
    gender: 'men' | 'women' | 'all';
    category: 'Topwear' | 'Bottomwear' | 'all';
    trending: 'all' | 'trending';
  };
  setProductFilters: (filters: any) => void;
  productSearch: string;
  setProductSearch: (search: string) => void;
  handleProductSelect: (product: any) => void;
  productTarget: string;
}

export const ProductLibraryModal: React.FC<ProductLibraryModalProps> = ({
  isOpen,
  onClose,
  productLibrary,
  productFilters,
  setProductFilters,
  productSearch,
  setProductSearch,
  handleProductSelect,
  productTarget
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="bg-[#181818] rounded-[32px] w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10">
        <header className="flex items-center justify-between px-8 py-6 bg-[#121212] border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <i className="fa-solid fa-shirt text-lg"></i>
            </div>
            <div className="flex flex-col">
              <h3 className="text-2xl font-black italic tracking-wider text-white uppercase">GARMENT WAREHOUSE</h3>
              <p className="text-[10px] font-black tracking-widest text-[#4dff4d] uppercase mt-0.5">SELECTING FOR: {productTarget.toUpperCase()}</p>
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
                <button onClick={() => setProductFilters({ ...productFilters, gender: 'all' })} className={`h-11 px-6 rounded-2xl flex items-center font-bold text-sm transition-all ${productFilters.gender === 'all' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'text-white/40 hover:text-white/60'}`}>All</button>
                {['men', 'women'].map(g => (
                  <button key={g} onClick={() => setProductFilters({ ...productFilters, gender: g as 'men' | 'women' })} className={`h-11 px-6 rounded-2xl flex items-center font-bold text-sm transition-all ${productFilters.gender === g ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'text-white/40 hover:text-white/60'}`}>
                    {g === 'men' ? 'Men' : 'Women'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-white/30 mb-5">GARMENT</h4>
              <div className="flex flex-col gap-2">
                 <button onClick={() => setProductFilters({ ...productFilters, category: 'all' })} className={`h-11 px-6 rounded-2xl flex items-center font-bold text-sm transition-all ${productFilters.category === 'all' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'text-white/40 hover:text-white/60'}`}>All</button>
                {['Topwear', 'Bottomwear'].map(c => (
                  <button key={c} onClick={() => setProductFilters({ ...productFilters, category: c as 'Topwear' | 'Bottomwear' })} className={`h-11 px-6 rounded-2xl flex items-center font-bold text-sm transition-all ${productFilters.category === c ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'text-white/40 hover:text-white/60'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-white/30 mb-5">TRENDING</h4>
              <div className="flex flex-col gap-2">
                <button onClick={() => setProductFilters({ ...productFilters, trending: 'all' })} className={`h-11 px-6 rounded-2xl flex items-center font-bold text-sm transition-all ${productFilters.trending === 'all' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'text-white/40 hover:text-white/60'}`}>All Items</button>
                <button onClick={() => setProductFilters({ ...productFilters, trending: 'trending' })} className={`h-11 px-6 rounded-2xl flex items-center font-bold text-sm transition-all ${productFilters.trending === 'trending' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'text-white/40 hover:text-white/60'}`}>Bestsellers</button>
              </div>
            </div>
          </aside>

          <div className="flex-1 flex flex-col bg-[#0f0f0f]">
            <div className="px-8 py-6 border-b border-white/5">
               <div className="relative group">
                <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors"></i>
                <input 
                  type="text" 
                  value={productSearch} 
                  onChange={(e) => setProductSearch(e.target.value)} 
                  placeholder="Search products..." 
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 text-sm focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.08] transition-all" 
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 md:grid-cols-4 gap-6 no-scrollbar">
              {productLibrary
                .filter(p => 
                  (productFilters.gender === 'all' || p.gender === productFilters.gender) && 
                  (productFilters.category === 'all' || p.category === productFilters.category) &&
                  (productFilters.trending === 'all' || p.bestseller === true) &&
                  p.name.toLowerCase().includes(productSearch.toLowerCase())
                )
                .map(product => (
                  <div 
                    key={product.id} 
                    onClick={() => handleProductSelect(product)} 
                    className="group flex flex-col cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <div className="relative aspect-square rounded-[24px] overflow-hidden bg-[#222] border border-white/5 group-hover:border-blue-500/30 transition-all shadow-xl">
                      <img src={product.url} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <i className="fa-solid fa-circle-plus text-3xl text-blue-500 shadow-2xl"></i>
                      </div>
                    </div>
                    <div className="mt-3 px-1">
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter mb-1 block">{product.category}</span>
                      <h4 className="text-[13px] font-bold text-white/90 truncate">{product.name}</h4>
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
