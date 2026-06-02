import React from 'react'
import {assets} from '../assets/assets'
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

const Add = ({ token }) => {

  // Sử dụng một mảng lưu trữ danh sách các file ảnh tải lên động
  const [images, setImages] = useState([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  // State quản lý Dropdown tùy biến (Custom Dropdown)
  const [category, setCategory] = useState("Men");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  
  const [subCategory, setSubCategory] = useState("Topwear");
  const [isSubCategoryOpen, setIsSubCategoryOpen] = useState(false);

  const [price, setPrice] = useState("");
  const [sizes, setSizes] = useState([]);
  const [stock, setStock] = useState({});
  const [bestseller, setBestseller] = useState(false);

  // --- CÁC TRƯỜNG BỔ SUNG MỚI ---
  const [seasons, setSeasons] = useState([]);
  const [styles, setStyles] = useState([]);
  const [colors, setColors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [fit, setFit] = useState(""); // Để trống ban đầu để bắt buộc chọn
  const [occasions, setOccasions] = useState([]);

  // State quản lý lỗi hiển thị trực quan trên giao diện (chỉ lưu tối đa 1 lỗi tại một thời điểm)
  const [errors, setErrors] = useState({});

  // Tạo refs để đóng dropdown khi click ra ngoài
  const categoryRef = useRef(null);
  const subCategoryRef = useRef(null);

  // Danh sách các tùy chọn cố định hiển thị lên giao diện
  const categoryOptions = ["Men", "Women", "Unisex"];
  const subCategoryOptions = ["Topwear", "Bottomwear", "Dress"];
  const seasonOptions = ["Spring", "Summer", "Autumn", "Winter"];
  const styleOptions = ["Casual", "Office", "Sporty", "Streetwear", "Elegant"];
  const colorOptions = ["Black", "White", "Gray", "Blue", "Red", "Green", "Yellow", "Beige", "Brown", "Pink"];
  const materialOptions = ["Cotton", "Denim", "Polyester", "Leather", "Wool", "Linen", "Silk", "Nylon"];
  const fitOptions = ["Slim", "Regular", "Oversized", "Loose", "Relaxed"];
  const occasionOptions = ["Daily", "Work", "Party", "Dating", "Travel", "Sport", "Formal"];

  // Đóng dropdown khi click ra ngoài màn hình
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
      if (subCategoryRef.current && !subCategoryRef.current.contains(event.target)) {
        setIsSubCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Xử lý khi người dùng chọn thêm ảnh
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const updatedImages = [...images, ...files];
      setImages(updatedImages);
      // Xóa lỗi ngay lập tức nếu lỗi đang hiển thị là ở phần images
      if (errors.images) {
        setErrors({});
      }
    }
    // Reset value của input để có thể chọn lại cùng một file nếu muốn
    e.target.value = null;
  };

  // Xử lý xóa ảnh khỏi danh sách tải lên
  const handleRemoveImage = (indexToRemove) => {
    const updatedImages = images.filter((_, index) => index !== indexToRemove);
    setImages(updatedImages);
    if (updatedImages.length === 0) {
      setErrors({ images: "Vui lòng tải lên ít nhất 1 hình ảnh sản phẩm!" });
    }
  };

  // Hàm xử lý chọn nhiều (Toggle cho Array State)
  const handleToggleOption = (item, state, setState, fieldName) => {
    let updatedState = [];
    if (state.includes(item)) {
      updatedState = state.filter(val => val !== item);
    } else {
      updatedState = [...state, item];
    }
    setState(updatedState);

    // Nếu người dùng chọn mục mới và trùng khớp với trường đang báo lỗi, hãy xóa lỗi đi ngay lập tức
    if (updatedState.length > 0 && errors[fieldName]) {
      setErrors({});
    }
  };

  const handleStockChange = (size, value) => {
    const numValue = value === '' ? '' : Number(value);
    setStock(prev => ({
      ...prev,
      [size]: {
        total: numValue,
        remaining: numValue
      }
    }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    // Reset lại lỗi cũ trước khi kiểm tra
    setErrors({});

    // --- KIỂM TRA VALIDATION THEO THỨ TỰ TỪ TRÊN XUỐNG DƯỚI (CHỈ LẤY LỖI ĐẦU TIÊN) ---
    if (images.length === 0) {
      const errorMsg = "Vui lòng tải lên ít nhất 1 hình ảnh sản phẩm!";
      setErrors({ images: errorMsg });
      toast.error(errorMsg);
      scrollToSection("section-images");
      return;
    }
    if (sizes.length === 0) {
      const errorMsg = "Vui lòng chọn ít nhất 1 kích thước!";
      setErrors({ sizes: errorMsg });
      toast.error(errorMsg);
      scrollToSection("section-sizes");
      return;
    }
    if (seasons.length === 0) {
      const errorMsg = "Vui lòng chọn ít nhất 1 mùa thích hợp!";
      setErrors({ seasons: errorMsg });
      toast.error(errorMsg);
      scrollToSection("section-seasons");
      return;
    }
    if (styles.length === 0) {
      const errorMsg = "Vui lòng chọn ít nhất 1 phong cách!";
      setErrors({ styles: errorMsg });
      toast.error(errorMsg);
      scrollToSection("section-styles");
      return;
    }
    if (colors.length === 0) {
      const errorMsg = "Vui lòng chọn ít nhất 1 màu sắc!";
      setErrors({ colors: errorMsg });
      toast.error(errorMsg);
      scrollToSection("section-colors");
      return;
    }
    if (materials.length === 0) {
      const errorMsg = "Vui lòng chọn ít nhất 1 chất liệu!";
      setErrors({ materials: errorMsg });
      toast.error(errorMsg);
      scrollToSection("section-materials");
      return;
    }
    if (!fit) {
      const errorMsg = "Vui lòng chọn phom dáng sản phẩm!";
      setErrors({ fit: errorMsg });
      toast.error(errorMsg);
      scrollToSection("section-fit");
      return;
    }
    if (occasions.length === 0) {
      const errorMsg = "Vui lòng chọn ít nhất 1 dịp sử dụng!";
      setErrors({ occasions: errorMsg });
      toast.error(errorMsg);
      scrollToSection("section-occasions");
      return;
    }

    // Xóa toàn bộ lỗi khi tất cả dữ liệu đã hợp lệ
    setErrors({});

    try {
      const formData = new FormData();

      // Đưa danh sách ảnh động vào formData
      images.forEach((image, index) => {
        formData.append(`image${index + 1}`, image);
      });

      formData.append("name", name);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("price", price);
      formData.append("sizes", JSON.stringify(sizes));
      formData.append("stock", JSON.stringify(stock));
      formData.append("bestseller", String(bestseller));
      formData.append("inStock", "true");

      // --- APPEND CÁC TRƯỜNG MỚI VÀO FORMDATA ---
      formData.append("seasons", JSON.stringify(seasons));
      formData.append("styles", JSON.stringify(styles));
      formData.append("colors", JSON.stringify(colors));
      formData.append("materials", JSON.stringify(materials));
      formData.append("fit", fit);
      formData.append("occasions", JSON.stringify(occasions));

      const response = await axios.post(backendUrl + '/api/product/add', formData, { headers: { token } });

      if (response.data.success) {
        toast.success(response.data.message);
        
        // Reset toàn bộ các trường về giá trị mặc định ban đầu
        setName("");
        setDescription("");
        setPrice("");
        setImages([]); // Reset list ảnh
        setSizes([]);  // Reset size về null (mảng rỗng)
        setStock({});
        setBestseller(false);
        
        // Reset các trường mới bổ sung
        setSeasons([]);
        setStyles([]);
        setColors([]);
        setMaterials([]);
        setFit(""); // Đưa về trạng thái chưa chọn
        setOccasions([]);
        setCategory("Men");
        setSubCategory("Topwear");
        setErrors({});
      } else {
        toast.error(response.data.message);
      }

    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  }

  // Hàm phụ trợ cuộn màn hình mượt mà đến vùng lỗi
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full min-h-[calc(100vh-120px)] items-start gap-6 p-6 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-700 font-sans select-none'>
      
      {/* Tiêu đề trang trí */}
      <div className='border-b border-slate-100 pb-4 w-full'>
        <h2 className='text-xl font-bold text-slate-800'>Add New Product</h2>
        <p className='text-xs text-slate-400 mt-1'>Fill in all the product details below to add a new inventory item.</p>
      </div>

      {/* 1. Dynamic Upload Image Section */}
      <div id="section-images" className={`w-full p-4 rounded-xl border transition-all duration-300 ${errors.images ? 'bg-red-50/40 border-red-200' : 'border-transparent'}`}>
        <p className='font-medium text-sm text-slate-800 mb-1 flex items-center gap-1.5'>
          Upload Images <span className="text-red-500">*</span> 
          <span className='text-xs text-slate-400 font-normal'>(At least 1 image, unlimited uploads)</span>
        </p>
        {errors.images && <p className='text-xs text-red-500 font-medium mb-3'>{errors.images}</p>}
        
        <div className='flex flex-wrap gap-4 mt-2'>
          {/* Vòng lặp hiển thị các ảnh đã chọn */}
          {images.map((img, index) => (
            <div key={index} className='relative w-24 h-24 border border-slate-200 rounded-lg overflow-hidden bg-slate-50 group shadow-sm'>
              <img className='w-full h-full object-cover' src={URL.createObjectURL(img)} alt={`Preview ${index + 1}`} />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className='absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors shadow shadow-red-500/20'
                title="Xóa ảnh"
              >
                &times;
              </button>
            </div>
          ))}

          {/* Ô bấm để chọn ảnh mới */}
          <label htmlFor="image-upload" className='group cursor-pointer'>
            <div className={`w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/50 transition-all duration-200 ${errors.images ? 'border-red-300 group-hover:border-red-400' : 'border-slate-200 group-hover:border-slate-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-8 h-8 transition-colors ${errors.images ? 'text-red-400 group-hover:text-red-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className={`text-[10px] font-semibold tracking-wider uppercase mt-1 ${errors.images ? 'text-red-400 group-hover:text-red-600' : 'text-slate-400 group-hover:text-slate-600'}`}>Add Image</span>
            </div>
            <input 
              onChange={handleImageChange} 
              type="file" 
              id="image-upload" 
              multiple 
              hidden 
              accept="image/*"
            />
          </label>
        </div>
      </div>

      {/* 2. Product Name */}
      <div className='w-full px-4'>
        <p className='font-medium text-sm text-slate-800 mb-2'>
          Product Name <span className="text-red-500">*</span>
        </p>
        <input 
          onChange={(e) => setName(e.target.value)} 
          value={name} 
          className='w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 transition-all text-sm' 
          type="text" 
          placeholder='Type here' 
          required
        />
      </div>

      {/* 3. Product Description */}
      <div className='w-full px-4'>
        <p className='font-medium text-sm text-slate-800 mb-2'>
          Product Description <span className="text-red-500">*</span>
        </p>
        <textarea 
          onChange={(e) => setDescription(e.target.value)} 
          value={description} 
          className='w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 transition-all text-sm min-h-[100px]' 
          placeholder='Write content here' 
          required
        />
      </div>

      {/* 4. Category, Sub-category & Price */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 w-full z-20 px-4'>
        {/* Custom Category Dropdown */}
        <div ref={categoryRef} className="relative">
          <p className='font-medium text-sm text-slate-800 mb-2'>
            Product category <span className="text-red-500">*</span>
          </p>
          <div 
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className="flex items-center justify-between w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white cursor-pointer hover:border-slate-300 transition-colors shadow-sm"
          >
            <span>{category}</span>
            <svg 
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Dropdown Options List */}
          {isCategoryOpen && (
            <div className="absolute left-0 mt-1.5 w-full bg-white border border-slate-150 rounded-lg shadow-lg py-1.5 z-30 transition-all duration-200 transform origin-top">
              {categoryOptions.map((opt) => (
                <div
                  key={opt}
                  onClick={() => {
                    setCategory(opt);
                    setIsCategoryOpen(false);
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                    category === opt 
                      ? 'bg-slate-100 text-slate-900 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Sub Category Dropdown */}
        <div ref={subCategoryRef} className="relative">
          <p className='font-medium text-sm text-slate-800 mb-2'>
            Sub category <span className="text-red-500">*</span>
          </p>
          <div 
            onClick={() => setIsSubCategoryOpen(!isSubCategoryOpen)}
            className="flex items-center justify-between w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white cursor-pointer hover:border-slate-300 transition-colors shadow-sm"
          >
            <span>{subCategory}</span>
            <svg 
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isSubCategoryOpen ? 'rotate-180' : ''}`} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Dropdown Options List */}
          {isSubCategoryOpen && (
            <div className="absolute left-0 mt-1.5 w-full bg-white border border-slate-150 rounded-lg shadow-lg py-1.5 z-30 transition-all duration-200 transform origin-top">
              {subCategoryOptions.map((opt) => (
                <div
                  key={opt}
                  onClick={() => {
                    setSubCategory(opt);
                    setIsSubCategoryOpen(false);
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                    subCategory === opt 
                      ? 'bg-slate-100 text-slate-900 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className='font-medium text-sm text-slate-800 mb-2'>
            Product Price ($) <span className="text-red-500">*</span>
          </p>
          <input 
            onChange={(e) => setPrice(e.target.value)} 
            value={price} 
            className='w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-800 transition-all text-sm shadow-sm' 
            type="number" 
            placeholder='25' 
            min="0"
            required
          />
        </div>
      </div>

      {/* 5. Product Sizes (Chọn nhiều) */}
      <div id="section-sizes" className={`w-full p-4 rounded-xl border transition-all duration-300 ${errors.sizes ? 'bg-red-50/40 border-red-200' : 'border-transparent'}`}>
        <p className='font-medium text-sm text-slate-800 mb-1'>
          Product Sizes <span className='text-xs text-slate-400 font-normal'>(Multiple select)</span> <span className="text-red-500">*</span>
        </p>
        {errors.sizes && <p className='text-xs text-red-500 font-medium mb-3'>{errors.sizes}</p>}
        
        <div className='flex flex-wrap gap-2.5 mt-1'>
          {["S", "M", "L", "XL", "XXL"].map((size) => (
            <div 
              key={size}
              onClick={() => handleToggleOption(size, sizes, setSizes, "sizes")}
              className={`px-4 py-1.5 rounded-md border text-xs font-semibold cursor-pointer select-none transition-all duration-150 ${
                sizes.includes(size) 
                  ? "bg-slate-900 border-slate-900 text-white shadow-sm" 
                  : `bg-slate-50 hover:border-slate-400 text-slate-600 ${errors.sizes ? 'border-red-200 hover:border-red-300' : 'border-slate-200'}`
              }`}
            >
              {size}
            </div>
          ))}
        </div>
        {sizes.length > 0 && (
          <div className='mt-4 space-y-2'>
            {sizes.map((size) => (
              <div key={size} className='flex items-center gap-4 mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg max-w-sm'>
                <span className='font-semibold text-sm w-16'>{`Size ${size}`}</span>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="Số lượng"
                  value={stock[size]?.total || ''}
                  onChange={(e) => handleStockChange(size, e.target.value)}
                  className='flex-1 px-3 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-800/20 text-sm'
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Seasons (Mùa - Chọn nhiều) */}
      <div id="section-seasons" className={`w-full p-4 rounded-xl border border-t border-slate-150/80 transition-all duration-300 ${errors.seasons ? 'bg-red-50/40 border-red-200' : 'border-transparent'}`}>
        <p className='font-medium text-sm text-slate-800 mb-1'>
          Seasons <span className='text-xs text-slate-400 font-normal'>(Multiple select)</span> <span className="text-red-500">*</span>
        </p>
        {errors.seasons && <p className='text-xs text-red-500 font-medium mb-3'>{errors.seasons}</p>}
        
        <div className='flex flex-wrap gap-2.5 mt-1'>
          {seasonOptions.map((season) => (
            <div
              key={season}
              onClick={() => handleToggleOption(season, seasons, setSeasons, "seasons")}
              className={`px-4 py-1.5 rounded-full border text-xs font-medium cursor-pointer select-none transition-all duration-150 ${
                seasons.includes(season)
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                  : `bg-slate-50 hover:border-slate-400 text-slate-600 ${errors.seasons ? 'border-red-200 hover:border-red-300' : 'border-slate-200'}`
              }`}
            >
              {season}
            </div>
          ))}
        </div>
      </div>

      {/* 7. Styles (Phong cách - Chọn nhiều) */}
      <div id="section-styles" className={`w-full p-4 rounded-xl border transition-all duration-300 ${errors.styles ? 'bg-red-50/40 border-red-200' : 'border-transparent'}`}>
        <p className='font-medium text-sm text-slate-800 mb-1'>
          Styles <span className='text-xs text-slate-400 font-normal'>(Multiple select)</span> <span className="text-red-500">*</span>
        </p>
        {errors.styles && <p className='text-xs text-red-500 font-medium mb-3'>{errors.styles}</p>}
        
        <div className='flex flex-wrap gap-2.5 mt-1'>
          {styleOptions.map((style) => (
            <div
              key={style}
              onClick={() => handleToggleOption(style, styles, setStyles, "styles")}
              className={`px-4 py-1.5 rounded-full border text-xs font-medium cursor-pointer select-none transition-all duration-150 ${
                styles.includes(style)
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : `bg-slate-50 hover:border-slate-400 text-slate-600 ${errors.styles ? 'border-red-200 hover:border-red-300' : 'border-slate-200'}`
              }`}
            >
              {style}
            </div>
          ))}
        </div>
      </div>

      {/* 8. Colors (Màu sắc - Chọn nhiều) */}
      <div id="section-colors" className={`w-full p-4 rounded-xl border transition-all duration-300 ${errors.colors ? 'bg-red-50/40 border-red-200' : 'border-transparent'}`}>
        <p className='font-medium text-sm text-slate-800 mb-1'>
          Colors <span className='text-xs text-slate-400 font-normal'>(Multiple select)</span> <span className="text-red-500">*</span>
        </p>
        {errors.colors && <p className='text-xs text-red-500 font-medium mb-3'>{errors.colors}</p>}
        
        <div className='flex flex-wrap gap-2.5 mt-1'>
          {colorOptions.map((color) => {
            const isSelected = colors.includes(color);
            return (
              <div
                key={color}
                onClick={() => handleToggleOption(color, colors, setColors, "colors")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer select-none transition-all duration-150 ${
                  isSelected
                    ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                    : `bg-slate-50 hover:border-slate-400 text-slate-600 ${errors.colors ? 'border-red-200 hover:border-red-300' : 'border-slate-200'}`
                }`}
              >
                {/* Dot tròn chỉ thị màu trực quan */}
                <span 
                  className='w-2.5 h-2.5 rounded-full border border-slate-300' 
                  style={{ backgroundColor: color.toLowerCase() === 'white' ? '#fff' : color.toLowerCase() }}
                />
                {color}
              </div>
            );
          })}
        </div>
      </div>

      {/* 9. Materials (Chất liệu - Chọn nhiều) */}
      <div id="section-materials" className={`w-full p-4 rounded-xl border transition-all duration-300 ${errors.materials ? 'bg-red-50/40 border-red-200' : 'border-transparent'}`}>
        <p className='font-medium text-sm text-slate-800 mb-1'>
          Materials <span className='text-xs text-slate-400 font-normal'>(Multiple select)</span> <span className="text-red-500">*</span>
        </p>
        {errors.materials && <p className='text-xs text-red-500 font-medium mb-3'>{errors.materials}</p>}
        
        <div className='flex flex-wrap gap-2.5 mt-1'>
          {materialOptions.map((material) => (
            <div
              key={material}
              onClick={() => handleToggleOption(material, materials, setMaterials, "materials")}
              className={`px-4 py-1.5 rounded-md border text-xs font-medium cursor-pointer select-none transition-all duration-150 ${
                materials.includes(material)
                  ? "bg-sky-600 border-sky-600 text-white shadow-sm"
                  : `bg-slate-50 hover:border-slate-400 text-slate-600 ${errors.materials ? 'border-red-200 hover:border-red-300' : 'border-slate-200'}`
              }`}
            >
              {material}
            </div>
          ))}
        </div>
      </div>

      {/* 10. Fit (Kiểu dáng/Form dáng - Chọn một) & Occasions (Dịp - Chọn nhiều) */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 w-full border-t border-slate-100 pt-5 z-10 px-4'>
        
        {/* Fit Section - Single Select */}
        <div id="section-fit" className={`p-4 rounded-xl border transition-all duration-300 ${errors.fit ? 'bg-red-50/40 border-red-200' : 'border-transparent'}`}>
          <p className='font-medium text-sm text-slate-800 mb-1'>
            Fit Style <span className='text-xs text-slate-400 font-normal'>(Select one)</span> <span className="text-red-500">*</span>
          </p>
          {errors.fit && <p className='text-xs text-red-500 font-medium mb-3'>{errors.fit}</p>}
          
          <div className='flex flex-col gap-2 mt-1'>
            {fitOptions.map((fitOpt) => (
              <label 
                key={fitOpt} 
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm cursor-pointer select-none transition-all duration-150 ${
                  fit === fitOpt 
                    ? "bg-slate-900 border-slate-900 text-white font-medium" 
                    : `bg-slate-50 hover:bg-slate-100 text-slate-600 ${errors.fit ? 'border-red-200 hover:border-red-300' : 'border-slate-200'}`
                }`}
              >
                <span>{fitOpt}</span>
                <input 
                  type="radio" 
                  name="fit" 
                  value={fitOpt} 
                  checked={fit === fitOpt} 
                  onChange={() => {
                    setFit(fitOpt);
                    if (errors.fit) {
                      setErrors({});
                    }
                  }}
                  className='hidden'
                />
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${fit === fitOpt ? 'border-white bg-transparent' : 'border-slate-300 bg-white'}`}>
                  {fit === fitOpt && <span className='w-2 h-2 rounded-full bg-white' />}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Occasions Section - Multiple Select */}
        <div id="section-occasions" className={`p-4 rounded-xl border transition-all duration-300 ${errors.occasions ? 'bg-red-50/40 border-red-200' : 'border-transparent'}`}>
          <p className='font-medium text-sm text-slate-800 mb-1'>
            Occasions <span className='text-xs text-slate-400 font-normal'>(Multiple select)</span> <span className="text-red-500">*</span>
          </p>
          {errors.occasions && <p className='text-xs text-red-500 font-medium mb-3'>{errors.occasions}</p>}
          
          <div className='flex flex-wrap gap-2 mt-1'>
            {occasionOptions.map((occasion) => (
              <div
                key={occasion}
                onClick={() => handleToggleOption(occasion, occasions, setOccasions, "occasions")}
                className={`px-3.5 py-2 rounded-lg border text-xs font-medium cursor-pointer select-none transition-all duration-150 ${
                  occasions.includes(occasion)
                    ? "bg-rose-600 border-rose-600 text-white shadow-sm"
                    : `bg-slate-50 hover:border-slate-400 text-slate-600 ${errors.occasions ? 'border-red-200 hover:border-red-300' : 'border-slate-200'}`
                }`}
              >
                {occasion}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 11. Checkbox Bestseller */}
      <div className='flex items-center gap-2 mt-2 bg-slate-50 px-4 py-3 rounded-lg border border-slate-100 w-full'>
        <input 
          onChange={() => setBestseller(prev => !prev)} 
          checked={bestseller} 
          type="checkbox" 
          id='bestseller' 
          className='w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-800 cursor-pointer accent-slate-900'
        />
        <label className='text-sm font-medium text-slate-700 cursor-pointer select-none' htmlFor="bestseller">
          Add to bestseller
        </label>
      </div>

      {/* 12. Submit Button */}
      <div className='w-full px-4'>
        <button 
          type="submit" 
          className='w-full max-w-[200px] py-3.5 mt-2 bg-slate-950 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg active:scale-95 transition-all duration-150 text-center tracking-wide'
        >
          ADD PRODUCT
        </button>
      </div>

    </form>
  )
}

export default Add
