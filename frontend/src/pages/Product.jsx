import React, { useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets'
import RelatedProducts from '../components/RelatedProducts'

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart } = useContext(ShopContext);
  const { t } = useTranslation();

  const [productData, setProductData] = useState(null);
  const [image, setImage] = useState('');
  const [size, setSize] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const thumbsRef = useRef(null);
  
  // Drag scroll cho thumbnail
  const isDraggingThumb = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const draggedDistance = useRef(0); // Thêm biến để phân biệt thao tác Click và Drag

  // --- STATE MỚI CHO CHỨC NĂNG ZOOM ---
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingZoom, setIsDraggingZoom] = useState(false);
  const zoomDragStart = useRef({ x: 0, y: 0 });
  const zoomContainerRef = useRef(null);

  const fetchProductData = () => {
    if (!products || products.length === 0) return;

    const item = products.find((product) => product._id === productId);
    if (item) {
      setProductData(item);
      setImage(item.image?.[0] || '');
      setSize(item.sizes?.[0] || '');
    }
  }

  const handleTryOnWithAI = () => {
    if (productData && productData.image && productData.image.length > 0) {
      const imagesParam = encodeURIComponent(JSON.stringify(productData.image));
      const aiUrl = `http://localhost:4200?images=${imagesParam}`;
      window.open(aiUrl, '_blank');
    } else {
      console.error('No product images available for AI Try-On');
      alert(t('product_try_on_ai_no_images'));
    }
  }

  useEffect(() => {
    fetchProductData();
  }, [productId, products])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [productId])

  // --- LOGIC: THUMBNAIL DRAG SCROLL ---
  const handleThumbPointerDown = (event) => {
    if (!thumbsRef.current) return;
    isDraggingThumb.current = true;
    draggedDistance.current = 0; // Reset khoảng cách khi bắt đầu nhấn
    startX.current = event.clientX - thumbsRef.current.offsetLeft;
    scrollLeft.current = thumbsRef.current.scrollLeft;
    thumbsRef.current.style.cursor = 'grabbing';
  }

  const handleThumbPointerMove = (event) => {
    if (!isDraggingThumb.current || !thumbsRef.current) return;
    event.preventDefault();
    const x = event.clientX - thumbsRef.current.offsetLeft;
    const walk = (x - startX.current) * 1; 
    draggedDistance.current = Math.abs(walk); // Ghi lại quãng đường chuột đã kéo
    thumbsRef.current.scrollLeft = scrollLeft.current - walk;
  }

  const handleThumbPointerUp = () => {
    if (!thumbsRef.current) return;
    isDraggingThumb.current = false;
    thumbsRef.current.style.cursor = 'grab';
  }

  const handleThumbnailClick = (item) => {
    // Chỉ chuyển ảnh nếu khoảng cách kéo chuột < 5px (nghĩa là người dùng chỉ click)
    if (draggedDistance.current < 5) {
      setImage(item);
    }
  }

  // --- LOGIC MỚI: ZOOM MODAL ---
  const openZoomModal = () => {
    setIsZoomModalOpen(true);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    document.body.style.overflow = 'hidden'; // Khóa cuộn trang web
  };

  const closeZoomModal = () => {
    setIsZoomModalOpen(false);
    document.body.style.overflow = ''; // Mở lại cuộn trang web
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 }); // reset vị trí nếu zoom out hết cỡ
      return newScale;
    });
  };
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Xử lý lăn chuột để zoom trong Modal
  useEffect(() => {
    const container = zoomContainerRef.current;
    if (!container || !isZoomModalOpen) return;

    const handleWheel = (e) => {
      e.preventDefault(); // Ngăn trình duyệt cuộn
      const zoomSensitivity = 0.002;
      let newScale = scale - e.deltaY * zoomSensitivity;
      newScale = Math.min(Math.max(1, newScale), 5); // Giới hạn zoom từ 1x đến 5x
      setScale(newScale);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [isZoomModalOpen, scale]);

  // Xử lý kéo thả để di chuyển ảnh khi đang zoom
  const handleZoomDragStart = (e) => {
    if (scale <= 1) return;
    setIsDraggingZoom(true);
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    zoomDragStart.current = { x: clientX - position.x, y: clientY - position.y };
  };

  const handleZoomDragMove = (e) => {
    if (!isDraggingZoom) return;
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    setPosition({
      x: clientX - zoomDragStart.current.x,
      y: clientY - zoomDragStart.current.y
    });
  };

  const handleZoomDragEnd = () => {
    setIsDraggingZoom(false);
  };

  const isCurrentSizeOutOfStock = productData && size ? (productData.stock?.[size]?.remaining === 0) : false;

  return productData ? (
    <>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 transition-opacity ease-in duration-500 opacity-100 font-sans text-slate-800 pb-20'>
        
        {/* 1. PRODUCT BREADCRUMBS & BADGES */}
        <div className="text-xs text-slate-400 font-semibold tracking-wider uppercase mb-5 flex items-center gap-2">
          <span className="hover:text-slate-900 cursor-pointer transition-colors">{t('product_home_breadcrumb')}</span>
          <span>/</span>
          <span className="hover:text-slate-900 cursor-pointer transition-colors">{productData.category}</span>
          <span>/</span>
          <span className="text-slate-900">{productData.subCategory}</span>
          
          {productData.bestseller && (
            <>
              <span className="ml-2">&bull;</span>
              <span className="text-amber-500 font-bold tracking-widest bg-amber-50 px-2 py-0.5 rounded-sm">{t('product_bestseller_badge')}</span>
            </>
          )}
        </div>

        {/* 2. MAIN PRODUCT GALLERY & INFO */}
        <div className='flex gap-10 lg:gap-16 flex-col lg:flex-row'>

          {/* --- LEFT: Product Images Gallery --- */}
          <div className='flex-1 flex flex-col gap-4 items-center'>
            
            {/* Main Display Image - ĐÃ THÊM SỰ KIỆN onClick để mở Modal */}
            <div 
              className='relative w-full max-w-[650px] mx-auto bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-100 cursor-zoom-in group'
              onClick={openZoomModal}
            >
              <img src={image} className='w-full h-auto max-h-[500px] object-contain transition-transform duration-500 group-hover:scale-[1.03]' alt={productData.name} />
              
              {/* Nút gợi ý zoom nổi lên khi hover */}
              <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2 text-xs font-semibold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                 {t('product_click_to_zoom')}
              </div>
            </div>

            {/* Thumbnails (Giữ nguyên logic của bạn) */}
            <div
              ref={thumbsRef}
              onPointerDown={handleThumbPointerDown}
              onPointerMove={handleThumbPointerMove}
              onPointerUp={handleThumbPointerUp}
              onPointerLeave={handleThumbPointerUp}
              className='w-full max-w-[650px] mx-auto flex overflow-x-auto gap-3 justify-start py-2 cursor-grab select-none'
            >
              {
                productData.image?.map((item, index) => (
                  <div 
                    key={index} 
                    onClick={() => handleThumbnailClick(item)}
                    className={`w-20 sm:w-24 aspect-[4/5] rounded-xl overflow-hidden border-2 cursor-pointer flex-shrink-0 transition-all duration-200 
                      ${image === item ? 'border-slate-900 shadow-md ring-2 ring-slate-900/10' : 'border-transparent opacity-60 hover:opacity-100 hover:border-slate-200 bg-slate-50'}`}
                  >
                    <img src={item} className='w-full h-full object-cover pointer-events-none' alt={`Thumbnail ${index + 1}`} />
                  </div>
                ))
              }
            </div>
          </div>

          {/* --- RIGHT: Product Information --- */}
          <div className='flex-1 flex flex-col'>
            
            <h1 className='font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight leading-snug'>{productData.name}</h1>
            
            {/* Reviews & Stock Status */}
            <div className='flex items-center gap-4 mt-4'>
              <div className='flex items-center gap-1 text-amber-400'>
                <img src={assets.star_icon} alt="star" className="w-4 h-4"/>
                <img src={assets.star_icon} alt="star" className="w-4 h-4"/>
                <img src={assets.star_icon} alt="star" className="w-4 h-4"/>
                <img src={assets.star_icon} alt="star" className="w-4 h-4"/>
                <img src={assets.star_dull_icon} alt="star dull" className="w-4 h-4 grayscale opacity-30"/>
                <span className='pl-2 text-sm text-slate-500 font-medium'>{t('product_reviews_count')}</span>
              </div>
              
              <div className="w-px h-4 bg-slate-200"></div>
              
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide
                ${productData.inStock !== false ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                {productData.inStock !== false ? t('product_in_stock') : t('product_out_of_stock')}
              </span>
            </div>

            <p className='mt-6 text-4xl font-extrabold text-slate-900'>{currency}{productData.price}</p>
            
            <p className='mt-6 text-base text-slate-500 leading-relaxed max-w-xl'>{productData.description}</p>
            
            {/* Detailed specifications Grid */}
            <div className="mt-8 bg-slate-50/80 p-5 rounded-2xl border border-slate-100 grid grid-cols-2 gap-y-5 gap-x-4 text-sm max-w-xl">
              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px] mb-1">{t('product_apparel_style')}</span>
                <span className="text-slate-800 font-bold">{productData.styles ? productData.styles.join(', ') : 'Classic Casual'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px] mb-1">{t('product_construct_material')}</span>
                <span className="text-slate-800 font-bold">{productData.materials ? productData.materials.join(', ') : 'Premium Blend'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px] mb-1">{t('product_target_seasons')}</span>
                <span className="text-slate-800 font-bold">{productData.seasons ? productData.seasons.join(', ') : 'All Seasons'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px] mb-1">{t('product_fit_type_cut')}</span>
                <span className="text-slate-800 font-bold">{productData.fit || 'Standard Regular Fit'}</span>
              </div>
            </div>

            {/* Size Selector */}
            <div className='flex flex-col gap-3 my-8'>
              <div className="flex items-center justify-between max-w-md">
                <p className="text-sm font-bold text-slate-800 uppercase tracking-wider">{t('product_select_size')}</p>
                <span className="text-xs text-indigo-600 font-semibold cursor-pointer hover:underline">{t('product_size_guide')}</span>
              </div>
              
              <div className='flex flex-wrap gap-2.5'>
                {productData.sizes?.map((item, index) => {
                  const isOutOfStock = productData.stock?.[item]?.remaining === 0;

                  return (
                    <button 
                      key={index}
                      onClick={() => setSize(item)}
                      disabled={isOutOfStock}
                      className={`min-w-[48px] h-12 px-4 border text-sm font-bold rounded-xl transition-all duration-200 
                        ${isOutOfStock ? 'opacity-30 cursor-not-allowed bg-slate-100 line-through' : 
                          (item === size 
                            ? 'border-slate-950 bg-slate-950 text-white shadow-md' 
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50 cursor-pointer')}`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3.5 max-w-xl w-full">
              
              {/* NÚT THÊM VÀO GIỎ HÀNG */}
              <button 
                onClick={() => addToCart(productData._id, size)} 
                disabled={isCurrentSizeOutOfStock || productData.inStock === false}
                className='flex-[1.5] bg-slate-950 hover:bg-slate-800 text-white font-bold py-2.5 sm:py-3 px-4 rounded-xl shadow-lg shadow-slate-900/15 active:scale-[0.98] transition-all duration-200 text-xs sm:text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>{isCurrentSizeOutOfStock ? t('product_out_of_stock_button') : t('product_add_to_cart')}</span>
              </button>
              
              {/* NÚT THỬ ĐỒ ẢO AI */}
              <button 
                onClick={handleTryOnWithAI}
                className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white font-bold py-2.5 sm:py-3 px-3 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer text-xs sm:text-sm tracking-wide flex items-center justify-center gap-1.5 group"
                title="AI Virtual Try-On"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c.3 0 .6.2.7.5l1.4 4.1c.3.9 1 1.6 1.9 1.9l4.1 1.4c.3.1.5.4.5.7s-.2.6-.5.7l-4.1 1.4c-.9.3-1.6 1-1.9 1.9l-1.4 4.1c-.1.3-.4.5-.7.5s-.6-.2-.7-.5l-1.4-4.1c-.3-.9-1-1.6-1.9-1.9l-4.1-1.4c-.3-.1-.5-.4-.5-.7s.2-.6.5-.7l4.1-1.4c.9-.3 1.6-1 1.9-1.9l1.4-4.1c.1-.3.4-.5.7-.5z" />
                  <path d="M19 4c.2 0 .4.1.4.3l.6 1.7c.1.4.4.7.8.8l1.7.6c.2.1.3.3.3.4s-.1.4-.3.4l-1.7.6c-.4.1-.7.4-.8.8l-.6 1.7c-.1.2-.3.3-.4.3s-.4-.1-.4-.3l-.6-1.7c-.1-.4-.4-.7-.8-.8l-1.7-.6c-.2-.1-.3-.3-.3-.4s.1-.4.3-.4l1.7-.6c.4-.1.7-.4.8-.8l.6-1.7c.1-.2.3-.3.4-.3z" opacity="0.8" />
                </svg>
                <span>{t('product_try_on_ai')}</span>
              </button>

            </div>
            
            <hr className='mt-10 mb-6 border-slate-100 max-w-md' />
            
            {/* Guarantees */}
            <div className='text-xs text-slate-500 flex flex-col gap-2.5 font-medium'>
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {t('product_original')}
              </p>
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {t('product_cash_on_delivery')}
              </p>
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                {t('product_return_policy')}
              </p>
            </div>
          </div>
        </div>

        {/* 3. TABS: Description & Review Section */}
        <div className='mt-24'>
          {/* Tab Headers */}
          <div className='flex gap-2 border-b border-slate-200'>
            <button 
              onClick={() => setActiveTab('description')}
              className={`px-6 py-3 text-sm font-bold transition-colors cursor-pointer border-b-2 
                ${activeTab === 'description' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              {t('product_description_tab')}
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`px-6 py-3 text-sm font-bold transition-colors cursor-pointer border-b-2 
                ${activeTab === 'reviews' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              {t('product_reviews_tab')}
            </button>
          </div>
          
          {/* Tab Content */}
          <div className='p-8 text-sm text-slate-500 leading-relaxed bg-white border border-slate-100 rounded-b-2xl rounded-tr-2xl shadow-sm mt-0'>
            {activeTab === 'description' ? (
              <div className="flex flex-col gap-4">
                <p>{t('product_description_1')}</p>
                <p>{t('product_description_2')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Sample Review */}
                <div className="border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-0.5">
                      <img src={assets.star_icon} alt="star" className="w-3.5 h-3.5"/>
                      <img src={assets.star_icon} alt="star" className="w-3.5 h-3.5"/>
                      <img src={assets.star_icon} alt="star" className="w-3.5 h-3.5"/>
                      <img src={assets.star_icon} alt="star" className="w-3.5 h-3.5"/>
                      <img src={assets.star_icon} alt="star" className="w-3.5 h-3.5"/>
                    </div>
                    <span className="font-bold text-slate-800 text-xs ml-2">{t('product_reviews_sample_name')}</span>
                    <span className="text-slate-400 text-xs">&bull; {t('product_reviews_sample_time')}</span>
                  </div>
                  <p className="text-slate-600">{t('product_reviews_sample_text')}</p>
                </div>
                <p className="text-center text-indigo-600 font-semibold cursor-pointer hover:underline">{t('product_load_more_reviews')}</p>
              </div>
            )}
          </div>
        </div>

        {/* 4. display related products */}
        <RelatedProducts category={productData.category} subCategory={productData.subCategory} />

      </div>

      {/* ==============================================================
          PHẦN 5: MODAL ZOOM HÌNH ẢNH (GIAO DIỆN HIỂN THỊ KHI CLICK)
          ============================================================== */}
      {isZoomModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 sm:p-6"
          onClick={closeZoomModal} // Click vào nền mờ để đóng popup
        >
          
          {/* Vùng cửa sổ Popup nhỏ ở giữa màn hình */}
          <div 
            className="relative w-full max-w-4xl h-[80vh] max-h-[800px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()} // Ngăn việc click vào popup bị lan ra ngoài gây đóng popup
          >
            {/* Nút Đóng (X) */}
            <button 
              onClick={closeZoomModal}
              className="absolute top-4 right-4 z-[70] w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Công cụ điều khiển Zoom (Hiển thị nổi trên ảnh) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-4 bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-xl">
              <button onClick={handleZoomOut} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors" title="Zoom Out">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
              </button>
              <div className="text-white font-mono text-sm w-12 text-center select-none">{Math.round(scale * 100)}%</div>
              <button onClick={handleZoomIn} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors" title="Zoom In">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
              <div className="w-px h-6 bg-white/20 mx-1"></div>
              <button onClick={handleResetZoom} className="px-4 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors" title={t('product_reset')}>
                {t('product_reset')}
              </button>
            </div>

            {/* Vùng chứa Ảnh để cuộn/kéo */}
            <div 
              ref={zoomContainerRef}
              className={`relative w-full h-full flex-1 flex items-center justify-center overflow-hidden bg-slate-50/50 ${scale > 1 ? (isDraggingZoom ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
              onMouseDown={handleZoomDragStart}
              onMouseMove={handleZoomDragMove}
              onMouseUp={handleZoomDragEnd}
              onMouseLeave={handleZoomDragEnd}
              onTouchStart={handleZoomDragStart}
              onTouchMove={handleZoomDragMove}
              onTouchEnd={handleZoomDragEnd}
            >
              <img 
                src={image} 
                alt="Zoomed Product" 
                draggable={false}
                className="max-w-full max-h-full object-contain select-none pointer-events-none"
                style={{ 
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, 
                  transition: isDraggingZoom ? 'none' : 'transform 0.1s ease-out' 
                }} 
              />
            </div>
          </div>

        </div>
      )}
    </>
  ) : (
    <div className='min-h-screen flex items-center justify-center opacity-50'>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
    </div>
  )
}

export default Product
