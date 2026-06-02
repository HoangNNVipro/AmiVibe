import React, { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

// Define backendUrl to avoid import resolution issues in standalone environments
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// ==========================================
// 1. FILTER HELPER COMPONENTS
// ==========================================
const FILTER_CATEGORY_OPTIONS = [
  { value: 'All', label: 'All Categories' },
  { value: 'Men', label: 'Men' },
  { value: 'Women', label: 'Women' },
  { value: 'Unisex', label: 'Unisex' },
];

const FILTER_SIZE_OPTIONS = [
  { value: 'All', label: 'All Sizes' },
  { value: 'S', label: 'Size S' },
  { value: 'M', label: 'Size M' },
  { value: 'L', label: 'Size L' },
  { value: 'XL', label: 'Size XL' },
  { value: 'XXL', label: 'Size XXL' },
];

const FILTER_STOCK_OPTIONS = [
  { value: 'All', label: 'All Status' },
  { value: 'InStock', label: 'In Stock (Healthy)' },
  { value: 'LowStock', label: 'Low Stock (<= 5)' },
  { value: 'OutOfStock', label: 'Out of Stock (0)' },
];

// Reusable Dropdown
const FilterDropdown = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedLabel = options.find((opt) => opt.value === value)?.label ?? value;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 cursor-pointer hover:border-slate-300 hover:bg-white transition-all shadow-sm"
      >
        <span className="font-medium text-slate-600 truncate pr-2">{selectedLabel}</span>
        <svg className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
      <div className={`absolute left-0 mt-1.5 w-full bg-white border border-slate-150 rounded-xl shadow-lg py-1.5 z-40 origin-top transition-all duration-200 ease-out ${isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'}`}>
        {options.map((opt) => (
          <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`px-3.5 py-2 text-xs cursor-pointer transition-colors duration-150 ${value === opt.value ? 'bg-slate-100 font-bold text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
            {opt.label}
          </div>
        ))}
      </div>
    </div>
  );
};


// ==========================================
// 2. MAIN COMPONENT (INVENTORY)
// ==========================================
const Inventory = ({ token }) => {
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(false);
  
  // Filtering & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSize, setFilterSize] = useState('All');
  const [filterStock, setFilterStock] = useState('All');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Restock Modal state
  const [restockModal, setRestockModal] = useState(null); 
  const [addQuantity, setAddQuantity] = useState('');

  // -------------------------------------------------------------
  // FETCH INVENTORY DATA FROM API
  // -------------------------------------------------------------
  const fetchInventory = async () => {
    // Only fetch if there is a token (you might want to remove this constraint in local dev if no auth is configured)
    if (!token && import.meta.env.PROD) return; 
    setLoading(true);
    try {
      const response = await axios.get(backendUrl + '/api/product/adminlist', {
        headers: { token }
      });
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [token]);

  // -------------------------------------------------------------
  // TRANSFORM DATA (Products -> Variants/Sizes)
  // -------------------------------------------------------------
  const variants = useMemo(() => {
    let allVariants = [];
    products.forEach(product => {
      if (product.stock) {
        Object.entries(product.stock).forEach(([size, data]) => {
          allVariants.push({
            productId: product._id,
            variantId: `${product._id}-${size}`,
            name: product.name,
            image: product.image && product.image[0] ? product.image[0] : null,
            category: product.category,
            size: size,
            total: data.total || 0,
            remaining: data.remaining || 0,
            sold: (data.total || 0) - (data.remaining || 0),
            status: (data.remaining || 0) === 0 ? 'OutOfStock' : ((data.remaining || 0) <= 5 ? 'LowStock' : 'InStock')
          });
        });
      }
    });
    return allVariants;
  }, [products]);

  // -------------------------------------------------------------
  // CALCULATE METRICS
  // -------------------------------------------------------------
  const metrics = useMemo(() => {
    let totalImported = 0;
    let totalRemaining = 0;
    let totalSold = 0;
    let lowStockCount = 0;

    variants.forEach(v => {
      totalImported += v.total;
      totalRemaining += v.remaining;
      totalSold += v.sold;
      if (v.status === 'LowStock' || v.status === 'OutOfStock') lowStockCount++;
    });

    return { totalImported, totalRemaining, totalSold, lowStockCount };
  }, [variants]);

  // -------------------------------------------------------------
  // HANDLE SEARCH & FILTER
  // -------------------------------------------------------------
  const filteredVariants = useMemo(() => {
    return variants.filter(v => {
      const matchSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = filterCategory === 'All' || v.category === filterCategory;
      const matchSize = filterSize === 'All' || v.size === filterSize;
      const matchStock = filterStock === 'All' || v.status === filterStock;
      return matchSearch && matchCategory && matchSize && matchStock;
    });
  }, [variants, searchQuery, filterCategory, filterSize, filterStock]);

  // -------------------------------------------------------------
  // HANDLE SORTING
  // -------------------------------------------------------------
  const sortedVariants = useMemo(() => {
    let sortableItems = [...filteredVariants];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredVariants, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // -------------------------------------------------------------
  // PAGINATION
  // -------------------------------------------------------------
  const paginatedVariants = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedVariants.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedVariants, currentPage]);

  const totalPages = Math.ceil(sortedVariants.length / itemsPerPage) || 1;

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchQuery, filterCategory, filterSize, filterStock]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterCategory('All');
    setFilterSize('All');
    setFilterStock('All');
    toast.info("Filters reset successfully");
  };

  // -------------------------------------------------------------
  // RESTOCK LOGIC (CALL API)
  // -------------------------------------------------------------
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(addQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity (>0)");
      return;
    }

    try {
      const response = await axios.post(
        backendUrl + '/api/product/restock',
        {
          productId: restockModal.productId,
          size: restockModal.size,
          quantity: qty
        },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(`Added ${qty} items to stock (Size ${restockModal.size})`);
        setRestockModal(null);
        setAddQuantity('');
        fetchInventory();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };


  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-8 select-none font-sans text-slate-700 antialiased">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Management</h1>
            <p className="text-sm text-slate-500 mt-1">Control stock levels, monitor sales, and manage variant restocking.</p>
          </div>
          <button 
            onClick={() => {
              fetchInventory();
              toast.success("Data refreshed successfully");
            }}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 border border-slate-200 bg-white hover:border-slate-350 rounded-lg hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-sm transition-all active:scale-95 group cursor-pointer disabled:opacity-70"
          >
            <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh Data
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Imported</p>
              <h4 className="text-lg font-bold text-slate-900 mt-0.5">{metrics.totalImported}</h4>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Remaining Stock</p>
              <h4 className="text-lg font-bold text-slate-900 mt-0.5">{metrics.totalRemaining}</h4>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Sold</p>
              <h4 className="text-lg font-bold text-slate-900 mt-0.5">{metrics.totalSold}</h4>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Alerts (Low/Out)</p>
              <h4 className="text-lg font-bold text-rose-600 mt-0.5">{metrics.lowStockCount} Variants</h4>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input 
                type="text" 
                placeholder="Search by product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-850 bg-slate-50/50"
              />
            </div>
            <FilterDropdown value={filterCategory} onChange={setFilterCategory} options={FILTER_CATEGORY_OPTIONS} />
            <FilterDropdown value={filterSize} onChange={setFilterSize} options={FILTER_SIZE_OPTIONS} />
            <FilterDropdown value={filterStock} onChange={setFilterStock} options={FILTER_STOCK_OPTIONS} />
          </div>

          {(searchQuery || filterCategory !== 'All' || filterSize !== 'All' || filterStock !== 'All') && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="text-slate-400">
                Found <b className="text-slate-700">{filteredVariants.length}</b> matching variants.
              </span>
              <button onClick={handleResetFilters} className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
                Clear all filters &times;
              </button>
            </div>
          )}
        </div>

        {/* Inventory Data Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-16">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
             </div>
          ) : filteredVariants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <p className="text-sm font-semibold text-slate-600">No variants found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
                    <th className="py-4 px-4 w-20">Image</th>
                    <th className="py-4 px-3 cursor-pointer hover:text-slate-700" onClick={() => requestSort('name')}>
                      Product Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-4 px-3 w-20 cursor-pointer hover:text-slate-700" onClick={() => requestSort('size')}>
                      Size {sortConfig.key === 'size' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-4 px-3 w-24 text-center cursor-pointer hover:text-slate-700" onClick={() => requestSort('total')}>
                      Total {sortConfig.key === 'total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-4 px-3 w-24 text-center cursor-pointer hover:text-slate-700" onClick={() => requestSort('sold')}>
                      Sold {sortConfig.key === 'sold' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-4 px-3 w-24 text-center cursor-pointer hover:text-slate-700" onClick={() => requestSort('remaining')}>
                      Remaining {sortConfig.key === 'remaining' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-4 px-4 text-right w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {paginatedVariants.map((item) => (
                    <tr key={item.variantId} className={`bg-white border border-slate-100 rounded-2xl hover:shadow-sm transition-all duration-150 ${item.remaining === 0 ? 'bg-rose-50/20' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 shadow-sm flex-shrink-0">
                          <img className="w-full h-full object-cover" src={item.image || 'https://placehold.co/150'} alt={item.name} />
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 line-clamp-1" title={item.name}>{item.name}</div>
                        <div className="text-[10px] font-semibold text-slate-500 mt-0.5 uppercase tracking-wide">{item.category}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
                          {item.size}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-600">
                        {item.total}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-amber-600">
                        {item.sold}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-bold text-base ${item.remaining === 0 ? 'text-rose-600' : (item.remaining <= 5 ? 'text-orange-500' : 'text-emerald-600')}`}>
                          {item.remaining}
                        </span>
                        {item.remaining === 0 && <span className="block text-[9px] text-rose-500 uppercase tracking-widest mt-0.5">Out</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          onClick={() => setRestockModal(item)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border shadow-xs transition-all active:scale-95 duration-100 cursor-pointer w-24 bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700 ml-auto"
                          title="Click to restock this variant"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                          Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredVariants.length > 0 && !loading && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 font-medium">
                Showing <b className="text-slate-700">{Math.min(filteredVariants.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredVariants.length, currentPage * itemsPerPage)}</b> of <b className="text-slate-700">{filteredVariants.length}</b> variants
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 font-bold transition-all disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-8 h-8 rounded-lg font-bold border transition-all cursor-pointer ${currentPage === idx + 1 ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 font-bold transition-all disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* RESTOCK MODAL (OPTION A) */}
      {/* ========================================================= */}
      {restockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleRestockSubmit} className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 p-6 relative">
            <button type="button" onClick={() => setRestockModal(null)} className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-800 p-1.5 rounded-full transition-colors cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">Restock Item</h3>
                <p className="text-[11px] text-slate-500">Add quantity from incoming shipments</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-5">
              <p className="text-xs font-semibold text-slate-700 line-clamp-1">{restockModal.name}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Size: <span className="text-slate-900 bg-white border px-1.5 py-0.5 rounded">{restockModal.size}</span></span>
                <span className="text-xs font-semibold text-slate-500">Remaining: <span className="text-slate-900 font-bold">{restockModal.remaining}</span></span>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">Quantity to Add <span className="text-rose-500">*</span></label>
              <input 
                type="number"
                min="1"
                required
                value={addQuantity}
                onChange={(e) => setAddQuantity(e.target.value)}
                placeholder="e.g., 50"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-900"
              />
              <p className="text-[10px] text-slate-400 mt-2">
                The system will add this quantity to both <b className="text-slate-600">Total Imported</b> and <b className="text-slate-600">Remaining Stock</b>.
              </p>
            </div>

            <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-md transition-colors active:scale-95 cursor-pointer">
              Confirm Restock
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Inventory;