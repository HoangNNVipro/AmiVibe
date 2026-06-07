import React, { useContext, useState, useEffect, useRef } from 'react'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets'
import Title from '../components/Title'
import ProductItem from '../components/ProductItem'

const Collection = () => {
  const { products, search, showSearch } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  
  // --- STATE CÁC BỘ LỌC ---
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [styles, setStyles] = useState([]);
  
  // State cho thanh trượt giá (Mặc định để mức cao nhất, ví dụ5000$)
  const [maxPrice, setMaxPrice] = useState(5000);

  // --- STATE CUSTOM SORT DROPDOWN ---
  const [sortType, setSortType] = useState('relavent');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  const sortOptions = [
    { value: 'relavent', label: 'Sort by: Relevant' },
    { value: 'low-high', label: 'Sort by: Low to High' },
    { value: 'high-low', label: 'Sort by: High to Low' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- CÁC HÀM TOGGLE (CHỌN/BỎ CHỌN) ---
  const toggleCategory = (e) => {
    if (category.includes(e.target.value)) {
      setCategory(prev => prev.filter(item => item !== e.target.value))
    } else {
      setCategory(prev => [...prev, e.target.value])
    }
  }

  const toggleSubCategory = (e) => {
    if (subCategory.includes(e.target.value)) {
      setSubCategory(prev => prev.filter(item => item !== e.target.value))
    } else {
      setSubCategory(prev => [...prev, e.target.value])
    }
  }

  const toggleSeason = (e) => {
    if (seasons.includes(e.target.value)) {
      setSeasons(prev => prev.filter(item => item !== e.target.value))
    } else {
      setSeasons(prev => [...prev, e.target.value])
    }
  }

  const toggleStyle = (e) => {
    if (styles.includes(e.target.value)) {
      setStyles(prev => prev.filter(item => item !== e.target.value))
    } else {
      setStyles(prev => [...prev, e.target.value])
    }
  }

  // --- HÀM THỰC THI LỌC DỮ LIỆU ---
  const applyFilter = () => {
    let productsCopy = products.slice();

    if (showSearch && search) {
      productsCopy = productsCopy.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
    }
    
    if (category.length > 0) {
      productsCopy = productsCopy.filter(item => category.includes(item.category));
    }

    if (subCategory.length > 0) {
      productsCopy = productsCopy.filter(item => subCategory.includes(item.subCategory));
    }

    if (seasons.length > 0) {
      productsCopy = productsCopy.filter(item => item.seasons && seasons.some(s => item.seasons.includes(s)));
    }

    if (styles.length > 0) {
      productsCopy = productsCopy.filter(item => item.styles && styles.some(s => item.styles.includes(s)));
    }

    // Lọc theo thanh trượt giá (chỉ lấy sản phẩm có giá <= maxPrice)
    productsCopy = productsCopy.filter(item => item.price <= maxPrice);

    setFilterProducts(productsCopy);
  }  

  // --- HÀM SẮP XẾP SAU KHI LỌC ---
  const sortProduct = () => {
    let fpCopy = filterProducts.slice();

    switch (sortType) {
      case 'low-high':
        setFilterProducts(fpCopy.sort((a, b) => (a.price - b.price)));
        break;
      case 'high-low':
        setFilterProducts(fpCopy.sort((a, b) => (b.price - a.price)));
        break;
      default:
        applyFilter(); 
        break;
    }
  }

  // Cập nhật lại bộ lọc khi bất kỳ giá trị nào thay đổi (bao gồm cả maxPrice)
  useEffect(() => {
    applyFilter();
  }, [category, subCategory, seasons, styles, maxPrice, search, showSearch, products])

  useEffect(() => {
    sortProduct();
  }, [sortType])

  return (
    <div className='flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t'>
      
      {/* --- CỘT TRÁI: DANH SÁCH BỘ LỌC --- */}
      <div className='min-w-60'>
        <p onClick={()=>setShowFilter(!showFilter)} className='my-2 text-xl flex items-center cursor-pointer gap-2 font-medium' >
          FILTERS
          <img className={`h-3 sm:hidden transition-transform duration-300 ${showFilter ? 'rotate-90' : ''}`} src={assets.dropdown_icon} alt="" />
        </p>
        
        <div className={`space-y-5 mt-6 ${showFilter ? '' : 'hidden'} sm:block`}>
          
          {/* 1. Category Filter */}
          <div className='border border-gray-150 rounded-xl px-5 py-4 bg-white shadow-sm hover:shadow-md transition-shadow'>
            <p className='mb-3 text-xs font-bold text-gray-800 tracking-wider uppercase'>Category</p>
            <div className='flex flex-col gap-3 text-sm text-gray-600'>
              {['Men', 'Women', 'Unisex'].map((cat) => (
                <label key={cat} className='flex items-center gap-3 cursor-pointer hover:text-gray-900 transition-colors'>
                  <input className='w-4 h-4 cursor-pointer accent-slate-900 rounded border-gray-300' type="checkbox" value={cat} onChange={toggleCategory} />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 2. SubCategory Filter */}
          <div className='border border-gray-150 rounded-xl px-5 py-4 bg-white shadow-sm hover:shadow-md transition-shadow'>
            <p className='mb-3 text-xs font-bold text-gray-800 tracking-wider uppercase'>Type</p>
            <div className='flex flex-col gap-3 text-sm text-gray-600'>
              {['Topwear', 'Bottomwear', 'Dress'].map((type) => (
                <label key={type} className='flex items-center gap-3 cursor-pointer hover:text-gray-900 transition-colors'>
                  <input className='w-4 h-4 cursor-pointer accent-slate-900 rounded border-gray-300' type="checkbox" value={type} onChange={toggleSubCategory} /> 
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Seasons Filter */}
          <div className='border border-gray-150 rounded-xl px-5 py-4 bg-white shadow-sm hover:shadow-md transition-shadow'>
            <p className='mb-3 text-xs font-bold text-gray-800 tracking-wider uppercase'>Seasons</p>
            <div className='flex flex-col gap-3 text-sm text-gray-600'>
              {['Spring', 'Summer', 'Autumn', 'Winter'].map((season) => (
                <label key={season} className='flex items-center gap-3 cursor-pointer hover:text-gray-900 transition-colors'>
                  <input className='w-4 h-4 cursor-pointer accent-slate-900 rounded border-gray-300' type="checkbox" value={season} onChange={toggleSeason} /> 
                  <span>{season}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 4. Styles Filter */}
          <div className='border border-gray-150 rounded-xl px-5 py-4 bg-white shadow-sm hover:shadow-md transition-shadow'>
            <p className='mb-3 text-xs font-bold text-gray-800 tracking-wider uppercase'>Styles</p>
            <div className='flex flex-col gap-3 text-sm text-gray-600'>
              {['Casual', 'Office', 'Sporty', 'Streetwear', 'Elegant'].map((style) => (
                <label key={style} className='flex items-center gap-3 cursor-pointer hover:text-gray-900 transition-colors'>
                  <input className='w-4 h-4 cursor-pointer accent-slate-900 rounded border-gray-300' type="checkbox" value={style} onChange={toggleStyle} /> 
                  <span>{style}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 5. Price Range Slider */}
          <div className='border border-gray-150 rounded-xl px-5 py-4 bg-white shadow-sm hover:shadow-md transition-shadow'>
            <div className='flex justify-between items-center mb-4'>
              <p className='text-xs font-bold text-gray-800 tracking-wider uppercase'>Max Price</p>
              <p className='text-sm font-semibold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded'>
                ${maxPrice}
              </p>
            </div>
            
            {/* Input dạng thanh trượt */}
            <input 
              type="range" 
              min="0" 
              max="5000" // Bạn có thể thay đổi số 5000 thành mức giá cao nhất trong shop của bạn
              step="50" 
              value={maxPrice} 
              onChange={(e) => setMaxPrice(Number(e.target.value))} 
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
            
            <div className='flex justify-between text-[11px] font-medium text-gray-400 mt-2.5'>
              <span>$0</span>
              <span>$5000</span>
            </div>
          </div>
          
        </div>
      </div>


      {/* --- CỘT PHẢI: HIỂN THỊ SẢN PHẨM --- */}
      <div className='flex-1'>
        <div className='flex justify-between items-center text-base sm:text-2xl mb-4 relative z-20'>
          <Title text1={'ALL'} text2={'COLLECTIONS'} />
          
          {/* CUSTOM SORT DROPDOWN THAY THẾ CHO <select> */}
          <div ref={sortRef} className='relative text-sm'>
            <div 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className='flex items-center justify-between gap-3 px-4 py-2 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all duration-200 select-none min-w-[170px]'
            >
              <span className='font-medium text-gray-700'>
                {sortOptions.find(opt => opt.value === sortType)?.label}
              </span>
              <svg className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>

            {/* Danh sách xổ xuống */}
            <div className={`absolute right-0 top-full mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden transition-all duration-300 origin-top-right
              ${isSortOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}
            >
              {sortOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    setSortType(option.value);
                    setIsSortOpen(false);
                  }}
                  className={`px-4 py-2.5 cursor-pointer transition-colors duration-150
                    ${sortType === option.value ? 'bg-slate-50 text-slate-900 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  {option.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map Products */}
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6 relative z-10'>
          {
            filterProducts.length > 0 ? (
              filterProducts.map((item, index) => (
                <ProductItem key={index} name={item.name} id={item._id} price={item.price} image={item.image} />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
                <p className="text-lg font-medium text-gray-700">Không tìm thấy sản phẩm</p>
                <p className="text-sm mt-1">Vui lòng điều chỉnh lại bộ lọc giá hoặc danh mục.</p>
              </div>
            )
          }
        </div>

      </div>
    </div>
  )
}

export default Collection