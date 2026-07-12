import axios from 'axios'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { currency } from '../App'

const FILTER_CATEGORY_OPTIONS = [
  { value: 'All', label: 'Category: All' },
  { value: 'Men', label: 'Men' },
  { value: 'Women', label: 'Women' },
  { value: 'Unisex', label: 'Unisex' },
];

const FILTER_SUB_CATEGORY_OPTIONS = [
  { value: 'All', label: 'Sub Category: All' },
  { value: 'Topwear', label: 'Topwear' },
  { value: 'Bottomwear', label: 'Bottomwear' },
  { value: 'Dress', label: 'Dress' },
];

const FILTER_STOCK_OPTIONS = [
  { value: 'All', label: 'Stock: All Status' },
  { value: 'InStock', label: 'In Stock Only' },
  { value: 'OutOfStock', label: 'Out of Stock Only' },
];

const FILTER_COLLECTION_OPTIONS = [
  { value: 'All', label: 'Collection: All' },
  { value: 'Bestseller', label: 'Bestseller Only' },
  { value: 'Standard', label: 'Standard Only' },
];

const FilterDropdown = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label ?? value;

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
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 cursor-pointer hover:border-slate-300 hover:bg-white transition-all shadow-sm"
      >
        <span className="font-medium text-slate-600 truncate pr-2">{selectedLabel}</span>
        <svg
          className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      <div
        className={`absolute left-0 mt-1.5 w-full bg-white border border-slate-150 rounded-xl shadow-lg py-1.5 z-40 origin-top transition-all duration-200 ease-out ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
        }`}
        aria-hidden={!isOpen}
      >
        {options.map((opt) => (
          <div
            key={opt.value}
            role="button"
            tabIndex={isOpen ? 0 : -1}
            onClick={() => {
              onChange(opt.value);
              setIsOpen(false);
            }}
            className={`px-3.5 py-2 text-xs cursor-pointer transition-colors duration-150 ${
              value === opt.value
                ? 'bg-slate-100 font-bold text-slate-900'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {opt.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const List = ({ token}) => {
  const { t } = useTranslation()
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Bộ lọc tìm kiếm sản phẩm
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSubCategory, setFilterSubCategory] = useState('All');
  const [filterInStock, setFilterInStock] = useState('All');
  const [filterBestseller, setFilterBestseller] = useState('All');

  // Quản lý Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Quản lý Popups/Modals
  const [previewProduct, setPreviewProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const response = await axios.get(backendUrl + '/api/product/adminlist', {
        headers: { token },
      });
      if (response.data.success) {
        setList(response.data.products);
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

  // Thay đổi trạng thái kho hàng tức thì trực tiếp trên bảng
  const handleToggleStockStatus = async (item) => {
    const updatedStatus = !item.inStock;
    
    // Cập nhật UI trước để phản hồi nhanh (Optimistic Update)
    setList(prev => prev.map(p => p._id === item._id ? { ...p, inStock: updatedStatus } : p));

    try {
      // Gọi API cập nhật trạng thái kho
      const response = await axios.post(backendUrl + '/api/product/update-stock', { id: item._id, inStock: updatedStatus }, { headers: { token } });
      if (response.data.success) {
        toast.success(`"${item.name}" marked as ${updatedStatus ? 'In Stock' : 'Out of Stock'}.`);
      } else {
        toast.error(response.data.message);
        // Khôi phục lại trạng thái cũ nếu API báo lỗi
        setList(prev => prev.map(p => p._id === item._id ? { ...p, inStock: item.inStock } : p));
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
      // Khôi phục lại trạng thái cũ nếu gọi API lỗi
      setList(prev => prev.map(p => p._id === item._id ? { ...p, inStock: item.inStock } : p));
    }
  };

  // Xác nhận xóa sản phẩm
  const handleDeleteConfirm = async () => {
    if (!deleteProduct) return;
    const targetId = deleteProduct._id;
    
    try {
      const response = await axios.post(backendUrl + '/api/product/remove', { id: targetId }, { headers: { token } });
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setDeleteProduct(null);
    }
  };

  const handleEditSuccess = (updatedProduct) => {
    setList((prev) =>
      prev.map((item) =>
        item._id === updatedProduct._id ? { ...item, ...updatedProduct } : item
      )
    );
    toast.success(`Đã cập nhật "${updatedProduct.name}".`);
    setEditProduct(null);
  };

  useEffect(() => {
    fetchList();
  }, [token]);

  // Lọc sản phẩm dựa trên các tiêu chí và ô tìm kiếm
  const filteredProducts = useMemo(() => {
    return list.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      const matchesSubCategory = filterSubCategory === 'All' || item.subCategory === filterSubCategory;
      
      let matchesStock = true;
      if (filterInStock === 'InStock') matchesStock = item.inStock === true;
      if (filterInStock === 'OutOfStock') matchesStock = item.inStock === false;

      let matchesBestseller = true;
      if (filterBestseller === 'Bestseller') matchesBestseller = item.bestseller === true;
      if (filterBestseller === 'Standard') matchesBestseller = !item.bestseller;

      return matchesSearch && matchesCategory && matchesSubCategory && matchesStock && matchesBestseller;
    });
  }, [list, searchQuery, filterCategory, filterSubCategory, filterInStock, filterBestseller]);

  // Thiết lập các chỉ số tóm tắt (Summary metrics)
  const metrics = useMemo(() => {
    const total = list.length;
    const inStockCount = list.filter(item => item.inStock).length;
    const outOfStockCount = total - inStockCount;
    const bestsellersCount = list.filter(item => item.bestseller).length;
    return { total, inStockCount, outOfStockCount, bestsellersCount };
  }, [list]);

  // Phân trang danh sách sản phẩm đã lọc
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  useEffect(() => {
    setCurrentPage(1); // Reset trang về 1 khi người dùng thay đổi bộ lọc
  }, [searchQuery, filterCategory, filterSubCategory, filterInStock, filterBestseller]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterCategory('All');
    setFilterSubCategory('All');
    setFilterInStock('All');
    setFilterBestseller('All');
    toast.info(t('list_filters_reset_success'));
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-8 select-none font-sans text-slate-700 antialiased">
      <div className="max-w-[1600] mx-auto space-y-6">
        
        {/* Title Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('list_products_title')}</h1>
            <p className="text-sm text-slate-500 mt-1">{t('list_products_subtitle')}</p>
          </div>
          <button 
            onClick={fetchList} 
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 border border-slate-200 bg-white hover:border-slate-350 rounded-lg hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed group cursor-pointer"
            title="Reload database inventory"
          >
            {loading ? (
              <svg className="animate-spin h-3.5 w-3.5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-slate-500 transition-transform duration-300 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            )}
            {t('list_refresh_list')}
          </button>
        </div>

        {/* Metric Quick Stats Cards (Compact & Minimal) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('list_total_products')}</p>
              <h4 className="text-lg font-bold text-slate-900 mt-0.5">{metrics.total}</h4>
            </div>
          </div>

          {/* Card 2: In Stock */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('list_in_stock')}</p>
              <h4 className="text-lg font-bold text-slate-900 mt-0.5">{metrics.inStockCount}</h4>
            </div>
          </div>

          {/* Card 3: Out Of Stock */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('list_out_of_stock')}</p>
              <h4 className="text-lg font-bold text-slate-900 mt-0.5">{metrics.outOfStockCount}</h4>
            </div>
          </div>

          {/* Card 4: Bestsellers */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('list_bestsellers')}</p>
              <h4 className="text-lg font-bold text-slate-900 mt-0.5">{metrics.bestsellersCount}</h4>
            </div>
          </div>
        </div>

        {/* Search Input & Advanced Dropdowns Panel */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* Search Input */}
            <div className="relative lg:col-span-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input 
                type="text" 
                placeholder={t('list_search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-850 bg-slate-50/50"
              />
            </div>

            {/* Filter Category */}
            <FilterDropdown
              value={filterCategory}
              onChange={setFilterCategory}
              options={FILTER_CATEGORY_OPTIONS}
            />

            {/* Filter Sub Category */}
            <FilterDropdown
              value={filterSubCategory}
              onChange={setFilterSubCategory}
              options={FILTER_SUB_CATEGORY_OPTIONS}
            />

            {/* Filter Stock Status */}
            <FilterDropdown
              value={filterInStock}
              onChange={setFilterInStock}
              options={FILTER_STOCK_OPTIONS}
            />

            {/* Filter Bestsellers */}
            <FilterDropdown
              value={filterBestseller}
              onChange={setFilterBestseller}
              options={FILTER_COLLECTION_OPTIONS}
            />
          </div>

          {/* Reset Filters Panel */}
          {(searchQuery || filterCategory !== 'All' || filterSubCategory !== 'All' || filterInStock !== 'All' || filterBestseller !== 'All') && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="text-slate-400">
                <Trans
                  i18nKey="list_found_matching_items"
                  values={{ count: filteredProducts.length }}
                  components={{ b: <b className="text-slate-700" /> }}
                />
              </span>
              <button 
                onClick={handleResetFilters}
                className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5 transition-colors"
              >
                {t('list_clear_filters')} &times;
              </button>
            </div>
          )}
        </div>

        {/* Core Product Catalog List Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <svg className="w-16 h-16 stroke-1 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-sm font-semibold text-slate-600">{t('list_no_products_found')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('list_no_products_hint')}</p>
              <button 
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white font-medium text-xs rounded-lg transition-all"
              >
                {t('list_reset_filters')}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-3 w-20">{t('list_product')}</th>
                    <th className="py-4 px-3 w-auto">{t('list_name_subcategory')}</th>
                    <th className="py-4 px-3 w-24">{t('list_category')}</th>
                    <th className="py-4 px-3 w-20">{t('list_price')}</th>
                    <th className="py-4 px-3 w-24">{t('list_sizes')}</th>
                    <th className="py-4 px-3 w-24 text-center">{t('list_bestseller')}</th>
                    <th className="py-4 px-3 w-28 text-center">{t('list_stock_status')}</th>
                    <th className="py-4 px-3 text-right w-28">{t('list_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {paginatedProducts.map((item, index) => (
                    <tr 
                      key={item._id || index}
                      className="bg-white border border-slate-100 rounded-2xl hover:shadow-sm transition-all duration-150 group"
                    >
                      {/* Thumbnail Image */}
                      <td className="py-4.5 px-3">
                        <div className="relative w-20 h-20 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 shadow-sm flex-shrink-0">
                          <img 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                            src={item.image && item.image[0] ? item.image[0] : 'https://placehold.co/150'} 
                            alt={item.name}  
                          />
                        </div>
                      </td>

                      {/* Name & Details */}
                      <td className="py-4.5 px-3 w-auto max-w-[250px] lg:max-w-xs">
                        <div className="font-bold text-slate-900 line-clamp-2 break-words whitespace-normal" title={item.name}>
                          {item.name}
                        </div>
                        <div className="text-xs text-indigo-600 font-semibold mt-1 bg-indigo-50/60 px-2 py-0.5 rounded-md w-fit text-[10px] tracking-wide uppercase">
                          {item.subCategory}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-4.5 px-3">
                        <span className="font-semibold text-slate-600 text-xs bg-slate-100 px-2.5 py-1 rounded-full border border-slate-150">
                          {item.category}
                        </span>
                      </td>

                      {/* Price Display */}
                      <td className="py-4.5 px-3 font-bold text-slate-900 text-base">
                        {currency}{item.price}
                      </td>

                      {/* Sizes Display */}
                      <td className="py-4.5 px-3">
                        <span 
                          className="inline-block text-xs font-semibold text-slate-600 bg-slate-100/80 border border-slate-200/65 px-2.5 py-1 rounded-md max-w-[130px] truncate cursor-help transition-colors hover:bg-slate-200/80" 
                          title={item.sizes ? item.sizes.join(', ') : 'No sizes configured'}
                        >
                          {item.sizes && item.sizes.length > 0 ? item.sizes.join(', ') : '—'}
                        </span>
                      </td>

                      {/* Bestseller Status Indicator */}
                      <td className="py-4.5 px-3 text-center">
                        {item.bestseller ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-amber-200 tracking-wider">
                            BEST
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>

                      {/* Stock Toggle Badge Button (Clickable!) */}
                      <td className="py-4.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStockStatus(item)}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border shadow-xs transition-all active:scale-95 duration-100 cursor-pointer w-28
                            ${item.inStock 
                              ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700' 
                              : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'}`}
                          title="Click to toggle stock status instantly"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.inStock ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`}></span>
                          {item.inStock ? t('list_in_stock') : t('list_out_of_stock')}
                        </button>
                      </td>

                      {/* Actions Trigger Panel */}
                      <td className="py-4.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview Action */}
                          <button 
                            onClick={() => setPreviewProduct(item)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-150 rounded-lg border border-slate-200 transition-all cursor-pointer"
                            title="Preview customer product display page"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Edit Action */}
                          <button 
                            onClick={() => setEditProduct(item)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition-all cursor-pointer"
                            title="Edit general product database records"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Delete Action */}
                          <button 
                            onClick={() => setDeleteProduct(item)}
                            className="p-1.5 text-rose-600 hover:text-rose-950 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg transition-all cursor-pointer"
                            title="Remove item from catalogue"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls Footer Banner */}
          {filteredProducts.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 font-medium">
                Showing <b className="text-slate-700">{Math.min(filteredProducts.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredProducts.length, currentPage * itemsPerPage)}</b> of <b className="text-slate-700">{filteredProducts.length}</b> total products
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 font-bold transition-all disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                >
                  {t('list_prev')}
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
                  {t('list_next')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 1. POPUP MODAL: PRODUCT CUSTOMER PREVIEW */}
      {previewProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative border border-slate-100">
            
            <button 
              onClick={() => setPreviewProduct(null)} 
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-800 p-2 rounded-full transition-colors z-20 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <ProductPreviewSection product={previewProduct} currency={currency} />
          </div>
        </div>
      )}

      {/* 2. POPUP MODAL: EDIT PRODUCT FORM */}
      {editProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative border border-slate-100 p-6">
            
            <button 
              onClick={() => setEditProduct(null)} 
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-800 p-2 rounded-full transition-colors z-20 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <EditProductFormSection
              product={editProduct}
              token={token}
              onSuccess={handleEditSuccess}
              onClose={() => setEditProduct(null)}
            />
          </div>
        </div>
      )}

      {/* 3. POPUP MODAL: DELETE CONFIRMATION DIALOG (ENGLISH) */}
      {deleteProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500"></div>
            
            <div className="flex items-center gap-4 mt-2">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Product?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone under any circumstances.</p>
              </div>
            </div>

            <div className="my-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-700 font-medium">Are you sure you want to delete this product?</p>
              <p className="text-xs text-indigo-700 font-semibold mt-1.5 line-clamp-2">{deleteProduct.name}</p>
            </div>

            <div className="flex items-center gap-3 justify-end mt-4">
              <button 
                onClick={() => setDeleteProduct(null)}
                className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                No, Keep it
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-md shadow-rose-600/10 active:scale-95 transition-all cursor-pointer"
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* SUB-COMPONENT: ProductPreviewSection (Dựa trên cấu trúc của Product.jsx)  */
/* ========================================================================= */
const ProductPreviewSection = ({ product, currency }) => {
  const { t } = useTranslation()
  const [activeImage, setActiveImage] = useState(product.image ? product.image[0] : '');
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    if (product.image && product.image.length > 0) {
      setActiveImage(product.image[0]);
    }
  }, [product]);

  return (
    <div className="p-6 sm:p-10 select-none">
      <div className="text-xs text-slate-400 font-semibold tracking-wider uppercase mb-3 flex items-center gap-1.5">
        <span>{product.category}</span>
        <span>&bull;</span>
        <span>{product.subCategory}</span>
        {product.bestseller && (
          <>
            <span>&bull;</span>
            <span className="text-amber-500 font-bold">{t('list_bestseller')}</span>
          </>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Gallery Image Selector */}
        <div className="flex-1 flex flex-col-reverse sm:flex-row gap-3">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-auto max-h-[360px] gap-2.5 justify-start sm:w-[22%] w-full scrollbar-none">
            {product.image && product.image.map((imgUrl, index) => (
              <div 
                key={index} 
                onClick={() => setActiveImage(imgUrl)}
                className={`w-14 h-14 sm:w-full sm:h-16 rounded-lg overflow-hidden border cursor-pointer flex-shrink-0 transition-all ${activeImage === imgUrl ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200 opacity-75 hover:opacity-100'}`}
              >
                <img className="w-full h-full object-cover" src={imgUrl} alt={`Thumbnail ${index + 1}`} />
              </div>
            ))}
          </div>

          <div className="w-full sm:w-[78%] bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center">
            <img src={activeImage} className="w-full h-auto max-h-[360px] object-contain" alt="Main display preview" />
          </div>
        </div>

        {/* Product Details right side */}
        <div className="flex-1 flex flex-col">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug mt-1">{product.name}</h2>
          
          <div className="flex items-center gap-1.5 mt-2.5">
            <div className="flex items-center gap-0.5 text-amber-400">
              {[1, 2, 3, 4].map(idx => (
                <svg key={idx} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              ))}
              <svg className="w-3.5 h-3.5 text-slate-200 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            </div>
            <span className="text-xs text-slate-400 font-semibold">(122 reviews)</span>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <span className="text-2xl font-extrabold text-slate-900">{currency}{product.price}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${product.inStock ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
              {product.inStock ? t('list_in_stock') : t('list_out_of_stock')}
            </span>
          </div>

          <p className="mt-4 text-xs text-slate-500 leading-relaxed font-normal">{product.description}</p>

          {/* Size Profiles */}
          <div className="mt-5">
            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block mb-2">Available Sizes</span>
            <div className="flex flex-wrap gap-1.5">
              {product.sizes && product.sizes.map((size, index) => (
                <button 
                  key={index} 
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-[38px] h-9 border text-xs font-bold rounded-lg transition-all cursor-pointer ${size === selectedSize ? 'border-slate-950 bg-slate-950 text-white shadow-sm' : 'border-slate-200 text-slate-600 hover:border-slate-400 bg-white'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed specifications */}
          <div className="mt-5 border-t border-slate-100 pt-4 grid grid-cols-2 gap-y-3 gap-x-2 text-[11px]">
            <div>
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px]">{t('add_styles')}</span>
              <span className="text-slate-700 font-bold">{product.styles ? product.styles.join(', ') : 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px]">{t('add_materials')}</span>
              <span className="text-slate-700 font-bold">{product.materials ? product.materials.join(', ') : 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px]">{t('add_seasons')}</span>
              <span className="text-slate-700 font-bold">{product.seasons ? product.seasons.join(', ') : 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px]">{t('add_fit_style')}</span>
              <span className="text-slate-700 font-bold">{product.fit || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* SUB-COMPONENT: EditProductFormSection (Dựa trên biểu mẫu Add.jsx)         */
/* ========================================================================= */
const EditProductFormSection = ({ product, token, onSuccess, onClose }) => {
  const { t } = useTranslation()
  const [name, setName] = useState(product.name || "");
  const [description, setDescription] = useState(product.description || "");
  
  const [category, setCategory] = useState(product.category || "Men");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  
  const [subCategory, setSubCategory] = useState(product.subCategory || "Topwear");
  const [isSubCategoryOpen, setIsSubCategoryOpen] = useState(false);

  const [price, setPrice] = useState(product.price || "");
  const [sizes, setSizes] = useState(product.sizes || []);
  const [bestseller, setBestseller] = useState(product.bestseller || false);
  const [inStock, setInStock] = useState(product.inStock !== undefined ? product.inStock : true);

  const [seasons, setSeasons] = useState(product.seasons || []);
  const [styles, setStyles] = useState(product.styles || []);
  const [colors, setColors] = useState(product.colors || []);
  const [materials, setMaterials] = useState(product.materials || []);
  const [fit, setFit] = useState(product.fit || ""); 
  const [occasions, setOccasions] = useState(product.occasions || []);

  const [images, setImages] = useState(product.image || []);
  const [errors, setErrors] = useState({});

  const categoryRef = useRef(null);
  const subCategoryRef = useRef(null);

  const categoryOptions = ["Men", "Women", "Unisex"];
  const subCategoryOptions = ["Topwear", "Bottomwear", "Dress"];
  const seasonOptions = ["Spring", "Summer", "Autumn", "Winter"];
  const styleOptions = ["Casual", "Office", "Sporty", "Streetwear", "Elegant"];
  const colorOptions = ["Black", "White", "Gray", "Blue", "Red", "Green", "Yellow", "Beige", "Brown", "Pink"];
  const materialOptions = ["Cotton", "Denim", "Polyester", "Leather", "Wool", "Linen", "Silk", "Nylon"];
  const fitOptions = ["Slim", "Regular", "Oversized", "Loose", "Relaxed"];
  const occasionOptions = ["Daily", "Work", "Party", "Dating", "Travel", "Sport", "Formal"];

  useEffect(() => {
    const clickAway = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
      }
      if (subCategoryRef.current && !subCategoryRef.current.contains(e.target)) {
        setIsSubCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", clickAway);
    return () => document.removeEventListener("mousedown", clickAway);
  }, []);

  const toggleSelectionItem = (item, activeState, setAction, labelKey) => {
    let updated = [];
    if (activeState.includes(item)) {
      updated = activeState.filter(val => val !== item);
    } else {
      updated = [...activeState, item];
    }
    setAction(updated);
    if (updated.length > 0 && errors[labelKey]) {
      setErrors(prev => ({ ...prev, [labelKey]: null }));
    }
  };

  const handleImageUpload = (e) => {
    const filesList = Array.from(e.target.files);
    if (filesList.length > 0) {
      setImages(prev => [...prev, ...filesList]);
      if (errors.images) setErrors(prev => ({ ...prev, images: null }));
    }
    e.target.value = null;
  };

  const handleRemoveImageIndex = (removeIndex) => {
    setImages(prev => prev.filter((_, idx) => idx !== removeIndex));
  };

  const submitEditDetails = async (e) => {
    e.preventDefault();

    const localErrors = {};
    if (images.length === 0) localErrors.images = t('add_validation_image_required');
    if (sizes.length === 0) localErrors.sizes = t('add_validation_size_required');
    if (seasons.length === 0) localErrors.seasons = t('add_validation_season_required');
    if (styles.length === 0) localErrors.styles = t('add_validation_style_required');
    if (colors.length === 0) localErrors.colors = t('add_validation_color_required');
    if (materials.length === 0) localErrors.materials = t('add_validation_material_required');
    if (!fit) localErrors.fit = t('add_validation_fit_required');
    if (occasions.length === 0) localErrors.occasions = t('add_validation_occasion_required');

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      const firstErrKey = Object.keys(localErrors)[0];
      const targetElement = document.getElementById(`edit-section-${firstErrKey}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      const formData = new FormData();
      formData.append("productId", product._id);
      formData.append("name", name);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("price", String(price));
      formData.append("sizes", JSON.stringify(sizes));
      formData.append("seasons", JSON.stringify(seasons));
      formData.append("styles", JSON.stringify(styles));
      formData.append("colors", JSON.stringify(colors));
      formData.append("materials", JSON.stringify(materials));
      formData.append("fit", fit);
      formData.append("occasions", JSON.stringify(occasions));
      formData.append("bestseller", String(bestseller));
      formData.append("inStock", String(inStock));

      const existingUrls = [];
      const plan = [];
      let newFileIdx = 0;
      for (const img of images) {
        if (typeof img === "string") {
          plan.push(`e:${existingUrls.length}`);
          existingUrls.push(img);
        } else {
          plan.push(`n:${newFileIdx}`);
          formData.append(`image${newFileIdx + 1}`, img);
          newFileIdx += 1;
        }
      }
      formData.append("existingImageUrls", JSON.stringify(existingUrls));
      formData.append("imagePlan", JSON.stringify(plan));

      const response = await axios.post(
        backendUrl + "/api/product/update",
        formData,
        { headers: { token } }
      );

      if (response.data.success && response.data.product) {
        onSuccess(response.data.product);
      } else {
        toast.error(response.data.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message || "Cập nhật thất bại");
    }
  };

  return (
    <form onSubmit={submitEditDetails} className="flex flex-col gap-5 text-slate-700">
      <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Edit Product Record</h2>
          <p className="text-xs text-slate-400 mt-0.5">Edit system database content directly</p>
        </div>
      </div>

      {/* Gallery images Section */}
      <div id="edit-section-images" className={`p-4 rounded-xl border transition-all duration-300 ${errors.images ? 'bg-rose-50/40 border-rose-200' : 'border-slate-100 bg-slate-50/30'}`}>
        <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
          {t('add_upload_images')} <span className="text-rose-500">*</span>
        </p>
        {errors.images && <p className="text-xs text-rose-500 font-semibold mb-2">{errors.images}</p>}
        
        <div className="flex flex-wrap gap-3 mt-2">
          {images.map((img, index) => {
            const displayUrl = typeof img === 'string' ? img : URL.createObjectURL(img);
            return (
              <div key={index} className="relative w-20 h-20 border border-slate-200 rounded-lg overflow-hidden bg-slate-100 group shadow-sm">
                <img className="w-full h-full object-cover" src={displayUrl} alt="Visual item" />
                <button
                  type="button"
                  onClick={() => handleRemoveImageIndex(index)}
                  className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white w-5 h-5 rounded-full flex items-center justify-center text-sm shadow cursor-pointer"
                  title="Remove Image"
                >
                  &times;
                </button>
              </div>
            );
          })}

          <label htmlFor="edit-image-upload" className="cursor-pointer">
            <div className={`w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/50 transition-all ${errors.images ? 'border-rose-300 text-rose-400' : 'border-slate-200 text-slate-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-[9px] font-bold uppercase tracking-wider mt-1">{t('add_add_image')}</span>
            </div>
            <input 
              onChange={handleImageUpload}
              type="file" 
              id="edit-image-upload" 
              multiple 
              hidden 
              accept="image/*"
            />
          </label>
        </div>
      </div>

      {/* Name and Price Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">{t('add_product_name')}</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 text-xs transition-all"
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">{t('add_product_price')}</label>
          <input 
            type="number" 
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 text-xs transition-all"
            min="0"
            required
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">{t('add_product_description')}</label>
        <textarea 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 text-xs transition-all min-h-[60px] max-h-[120px]"
          required
        />
      </div>

      {/* Categories Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div ref={categoryRef} className="relative">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">{t('add_product_category')}</label>
          <div 
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className="flex items-center justify-between w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs bg-white cursor-pointer hover:border-slate-350 transition-all shadow-sm"
          >
            <span className="font-medium text-slate-800">{category}</span>
            <svg className={`h-4 w-4 text-slate-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          {isCategoryOpen && (
            <div className="absolute left-0 mt-1.5 w-full bg-white border border-slate-150 rounded-lg shadow-lg py-1 z-30 transform origin-top transition-all">
              {categoryOptions.map(opt => (
                <div
                  key={opt}
                  onClick={() => { setCategory(opt); setIsCategoryOpen(false); }}
                  className={`px-3.5 py-2 text-xs cursor-pointer transition-colors ${category === opt ? 'bg-slate-100 font-bold text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        <div ref={subCategoryRef} className="relative">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">{t('add_sub_category')}</label>
          <div 
            onClick={() => setIsSubCategoryOpen(!isSubCategoryOpen)}
            className="flex items-center justify-between w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs bg-white cursor-pointer hover:border-slate-350 transition-all shadow-sm"
          >
            <span className="font-medium text-slate-800">{subCategory}</span>
            <svg className={`h-4 w-4 text-slate-400 transition-transform ${isSubCategoryOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          {isSubCategoryOpen && (
            <div className="absolute left-0 mt-1.5 w-full bg-white border border-slate-150 rounded-lg shadow-lg py-1 z-30 transform origin-top transition-all">
              {subCategoryOptions.map(opt => (
                <div
                  key={opt}
                  onClick={() => { setSubCategory(opt); setIsSubCategoryOpen(false); }}
                  className={`px-3.5 py-2 text-xs cursor-pointer transition-colors ${subCategory === opt ? 'bg-slate-100 font-bold text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Multiple Selection Options grids */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        
        {/* Sizes */}
        <div id="edit-section-sizes" className={`p-3 rounded-xl border ${errors.sizes ? 'bg-rose-50/40 border-rose-200' : 'border-slate-100 bg-slate-50/20'}`}>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">{t('add_product_sizes')}</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {["S", "M", "L", "XL", "XXL"].map(size => (
              <div
                key={size}
                onClick={() => toggleSelectionItem(size, sizes, setSizes, "sizes")}
                className={`px-3 py-1 rounded-md border text-[11px] font-bold cursor-pointer transition-all ${sizes.includes(size) ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'}`}
              >
                {size}
              </div>
            ))}
          </div>
        </div>

        {/* Seasons */}
        <div id="edit-section-seasons" className={`p-3 rounded-xl border ${errors.seasons ? 'bg-rose-50/40 border-rose-200' : 'border-slate-100 bg-slate-50/20'}`}>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">{t('add_seasons')}</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {seasonOptions.map(season => (
              <div
                key={season}
                onClick={() => toggleSelectionItem(season, seasons, setSeasons, "seasons")}
                className={`px-3 py-1 rounded-full border text-[11px] font-bold cursor-pointer transition-all ${seasons.includes(season) ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'}`}
              >
                {season}
              </div>
            ))}
          </div>
        </div>

        {/* Styles */}
        <div id="edit-section-styles" className={`p-3 rounded-xl border ${errors.styles ? 'bg-rose-50/40 border-rose-200' : 'border-slate-100 bg-slate-50/20'}`}>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">{t('add_styles')}</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {styleOptions.map(style => (
              <div
                key={style}
                onClick={() => toggleSelectionItem(style, styles, setStyles, "styles")}
                className={`px-3 py-1 rounded-full border text-[11px] font-bold cursor-pointer transition-all ${styles.includes(style) ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'}`}
              >
                {style}
              </div>
            ))}
          </div>
        </div>

        {/* Colors selector */}
        <div id="edit-section-colors" className={`p-3 rounded-xl border ${errors.colors ? 'bg-rose-50/40 border-rose-200' : 'border-slate-100 bg-slate-50/20'}`}>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">{t('add_colors')}</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {colorOptions.map(color => {
              const selected = colors.includes(color);
              return (
                <div
                  key={color}
                  onClick={() => toggleSelectionItem(color, colors, setColors, "colors")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold cursor-pointer transition-all ${selected ? 'bg-slate-950 border-slate-950 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'}`}
                >
                  <span 
                    className="w-2 h-2 rounded-full border border-slate-300 flex-shrink-0" 
                    style={{ backgroundColor: color.toLowerCase() === 'white' ? '#fff' : color.toLowerCase() }} 
                  />
                  {color}
                </div>
              );
            })}
          </div>
        </div>

        {/* Materials */}
        <div id="edit-section-materials" className={`p-3 rounded-xl border ${errors.materials ? 'bg-rose-50/40 border-rose-200' : 'border-slate-100 bg-slate-50/20'}`}>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">{t('add_materials')}</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {materialOptions.map(mat => (
              <div
                key={mat}
                onClick={() => toggleSelectionItem(mat, materials, setMaterials, "materials")}
                className={`px-3 py-1 rounded-md border text-[11px] font-bold cursor-pointer transition-all ${materials.includes(mat) ? 'bg-sky-600 border-sky-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'}`}
              >
                {mat}
              </div>
            ))}
          </div>
        </div>

        {/* Occasions */}
        <div id="edit-section-occasions" className={`p-3 rounded-xl border ${errors.occasions ? 'bg-rose-50/40 border-rose-200' : 'border-slate-100 bg-slate-50/20'}`}>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">{t('add_occasions')}</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {occasionOptions.map(occ => (
              <div
                key={occ}
                onClick={() => toggleSelectionItem(occ, occasions, setOccasions, "occasions")}
                className={`px-3 py-1 rounded-md border text-[11px] font-bold cursor-pointer transition-all ${occasions.includes(occ) ? 'bg-rose-600 border-rose-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'}`}
              >
                {occ}
              </div>
            ))}
          </div>
        </div>

        {/* Fit Profiles single option selector */}
        <div id="edit-section-fit" className={`p-3 sm:col-span-2 rounded-xl border ${errors.fit ? 'bg-rose-50/40 border-rose-200' : 'border-slate-100 bg-slate-50/20'}`}>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">{t('add_fit_style')} <span className="text-rose-500">*</span></label>
          {errors.fit && <p className="text-xs text-rose-500 font-semibold mb-2">{errors.fit}</p>}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {fitOptions.map(fitOpt => (
              <div
                key={fitOpt}
                onClick={() => { setFit(fitOpt); if (errors.fit) setErrors(prev => ({ ...prev, fit: null })); }}
                className={`px-3 py-1 rounded-lg border text-xs font-bold cursor-pointer transition-all ${fit === fitOpt ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'}`}
              >
                {fitOpt}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Toggles (Bestseller & Stock) in row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Toggle 1: Stock Status */}
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 p-2.5 rounded-lg w-full">
          <input 
            type="checkbox" 
            id="edit-instock" 
            checked={inStock}
            onChange={() => setInStock(prev => !prev)}
            className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-800 cursor-pointer accent-slate-900"
          />
          <label htmlFor="edit-instock" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
            Product currently In Stock & Active
          </label>
        </div>

        {/* Toggle 2: Bestseller status */}
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 p-2.5 rounded-lg w-full">
          <input 
            type="checkbox" 
            id="edit-bestseller" 
            checked={bestseller}
            onChange={() => setBestseller(prev => !prev)}
            className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-800 cursor-pointer accent-slate-900"
          />
          <label htmlFor="edit-bestseller" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
            {t('add_to_bestseller')}
          </label>
        </div>
      </div>

      {/* Control Buttons Panel */}
      <div className="border-t border-slate-100 pt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          {t('user_cancel')}
        </button>
        <button
          type="submit"
          className="px-6 py-2 text-xs font-semibold text-white bg-slate-950 hover:bg-slate-850 active:scale-95 rounded-lg shadow-md transition-all cursor-pointer"
        >
          {t('user_save_changes')}
        </button>
      </div>
    </form>
  );
};

export default List