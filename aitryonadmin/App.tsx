
import React, { useState, useRef, useEffect } from 'react';
import { 
  AppState, 
  ImageData, 
  AspectRatio,
  GarmentCategory,
  ClothingItem,
  MainTab,
  Gender,
  AgeGroup
} from './types';
import { processVirtualTryOn, generateVirtualModel } from './services/geminiService';

type SidebarTab = 'virtual' | 'default' | 'upload';
type GarmentTab = 'single' | 'multiple';

interface GenerationEntry {
  images: string[];
  type: MainTab;
  prompt?: string;
  timestamp: number;
}

const UploadIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V11" />
    <path d="M3 19L8 14L11 17L14 14L21 21" />
    <circle cx="8" cy="8" r="1.5" />
    <path d="M18 2V8M15 5H21" />
  </svg>
);

const ReUploadIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17" />
    <path d="M12 3V15M12 3L8 7M12 3L16 7" />
  </svg>
);

const DeleteIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6H5H21" />
    <path d="M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" />
    <path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6" />
    <path d="M10 11V17" />
    <path d="M14 11V17" />
  </svg>
);

const LOG_ENDPOINT = 'http://localhost:5000/api/v1/client-log/log-ai-session';
const LOG_ERROR_ENDPOINT = 'http://localhost:5000/api/v1/client-log/log-client-error';

const readBlobAsBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const convertAvifBlobToPng = async (blob: Blob, name: string): Promise<ImageData> => {
  const objectUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(async (pngBlob) => {
        URL.revokeObjectURL(objectUrl);
        if (!pngBlob) {
          reject(new Error('Failed to convert AVIF to PNG'));
          return;
        }
        const base64 = await readBlobAsBase64(pngBlob);
        resolve({
          base64,
          mimeType: 'image/png',
          name: name.toLowerCase().endsWith('.avif') ? name.replace(/\\.avif$/i, '.png') : `${name}.png`,
          originalMimeType: blob.type || 'image/avif',
          convertedFromAvif: true,
        });
      }, 'image/png');
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };
    img.crossOrigin = 'anonymous';
    img.src = objectUrl;
  });
};

const normalizeImageBlob = async (blob: Blob, name: string): Promise<ImageData> => {
  const isAvif = (blob.type && blob.type.toLowerCase().includes('avif')) || name.toLowerCase().endsWith('.avif');
  if (isAvif) {
    return convertAvifBlobToPng(blob, name);
  }
  const base64 = await readBlobAsBase64(blob);
  return {
    base64,
    mimeType: blob.type || 'image/*',
    name,
    originalMimeType: blob.type || 'image/*',
    convertedFromAvif: false,
  };
};

const summarizeImageMeta = (img?: ImageData | null, category?: string) => {
  if (!img) return null;
  return {
    name: img.name,
    mimeType: img.mimeType,
    originalMimeType: img.originalMimeType || img.mimeType,
    convertedFromAvif: !!img.convertedFromAvif,
    base64Length: img.base64?.length || 0,
    category: category || null,
  };
};

const logAiSession = (payload: Record<string, any>) => {
  fetch(LOG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to log AI session', err);
  });
};

const logClientError = (error: string) => {
  fetch(LOG_ERROR_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error }),
  }).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to log client error', err);
  });
};

const imageUrlToImageData = async (url: string): Promise<ImageData> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return normalizeImageBlob(blob, 'selected-model');
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('virtual');
  const [garmentTab, setGarmentTab] = useState<GarmentTab>('multiple');
  const [selectedModelUri, setSelectedModelUri] = useState<string | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isRatioOpen, setIsRatioOpen] = useState(false);
  const [productGarmentImages, setProductGarmentImages] = useState<string[]>([]);
  const [selectedGarmentIndex, setSelectedGarmentIndex] = useState<number>(0);
  
  // States for Image Viewer Modal
  const [viewerImage, setViewerImage] = useState<{ url: string, type: MainTab, prompt?: string, timestamp: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [state, setState] = useState<AppState>({
    mainTab: 'try-on',
    creatorSettings: {
      gender: Gender.FEMALE,
      age: AgeGroup.YOUTH,
      skinTone: '#EFC194',
      prompt: ''
    },
    modelImage: null,
    clothingImages: [],
    singleGarment: null,
    singleGarmentCategory: GarmentCategory.TOP,
    multipleGarments: [null, null],
    aspectRatio: AspectRatio.PORTRAIT_3_4,
    outputCount: 3, 
    isProcessing: false,
    resultImages: [],
    error: null,
  });

  const [generationHistory, setGenerationHistory] = useState<GenerationEntry[]>([]);
  const [activeHistoryIndex, setActiveHistoryIndex] = useState<number>(-1);

  const [isOutputDropdownOpen, setIsOutputDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const ratioDropdownRef = useRef<HTMLDivElement>(null);
  const modelFileInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const topFileInputRef = useRef<HTMLInputElement>(null);
  const bottomFileInputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  const skinTones = ['#EFC194', '#F9E4D4', '#B36D3C', '#4A2E19'];

  const virtualHistory = [
    "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507679722356-436e1f24fd05?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1618886614638-80e3c103d31a?q=80&w=500&auto=format&fit=crop"
  ];

  const defaultModels = virtualHistory;

  useEffect(() => {
    if (!selectedModelUri && virtualHistory.length > 0) {
      setSelectedModelUri(virtualHistory[0]);
    }
  }, []);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  // Load ảnh sản phẩm từ URL parameters
  useEffect(() => {
    const loadProductImages = async () => {
      console.log('Checking URL parameters for product images...');
      const urlParams = new URLSearchParams(window.location.search);
      const imagesParam = urlParams.get('images');
      
      console.log('Images parameter:', imagesParam);
      
      if (imagesParam) {
        try {
          const parsedImages = JSON.parse(decodeURIComponent(imagesParam));
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            console.log('✅ Loaded product images from URL:', parsedImages);
            setProductGarmentImages(parsedImages);
            setSelectedGarmentIndex(0);
            setGarmentTab('single'); // Set to single garment mode
            
            // Load ảnh đầu tiên vào singleGarment
            const firstImageUrl = parsedImages[0];
            console.log('Loading first image:', firstImageUrl);
            
            try {
              // Try to fetch with cors mode
              const response = await fetch(firstImageUrl, { 
                mode: 'cors',
                credentials: 'omit'
              });
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const blob = await response.blob();
              console.log('✅ Blob created:', blob.type, blob.size);

              const imageData = await normalizeImageBlob(blob, 'product-garment-0');
              setState(prev => ({ ...prev, singleGarment: imageData, error: null }));
              console.log('✅ First image loaded to singleGarment successfully', imageData.mimeType);
            } catch (fetchError) {
              console.error('❌ Error fetching image:', fetchError);
              // Fallback: load image directly without converting to base64
              console.log('Trying fallback method...');
            }
            
            // Clean URL after loading
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error) {
          console.error('❌ Error loading product images from URL:', error);
        }
      } else {
        console.log('No product images found in URL parameters');
      }
    };

    loadProductImages();
  }, []);

  // Log lỗi avif ra terminal nếu gặp lỗi unsupported MIME type
  useEffect(() => {
    if (state.error && typeof state.error === 'string' &&
      (state.error.toLowerCase().includes('avif') || state.error.toLowerCase().includes('mime type'))
    ) {
      // eslint-disable-next-line no-console
      console.error('=== AVIF/MIME ERROR LOG ===');
      // eslint-disable-next-line no-console
      console.error(state.error);
    }
  }, [state.error]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOutputDropdownOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (ratioDropdownRef.current && !ratioDropdownRef.current.contains(event.target as Node)) {
        setIsRatioOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset pan and zoom when viewer opens
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
    setZoom(1);
    setIsDragging(false);
  }, [viewerImage]);

  // Tự động đưa ảnh về trung tâm khi kích thước trở về 100% hoặc nhỏ hơn
  useEffect(() => {
    if (zoom <= 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoom]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'model' | 'top' | 'bottom' | 'single') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await normalizeImageBlob(file, file.name);

      if (target === 'model') {
        setState(prev => ({ ...prev, modelImage: data }));
        setSelectedModelUri('uploaded');
      } else if (target === 'single') {
        setState(prev => ({ ...prev, singleGarment: data }));
      } else {
        const index = target === 'bottom' ? 1 : 0; 
        setState(prev => {
          const newMultiple = [...prev.multipleGarments];
          newMultiple[index] = data;
          return { ...prev, multipleGarments: newMultiple };
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ File upload/convert error:', error);
      setState(prev => ({ ...prev, error: 'Unable to read image. Please try a different file.' }));
    }

    e.target.value = '';
  };

  const handleDeleteModel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setState(prev => ({ ...prev, modelImage: null }));
    if (selectedModelUri === 'uploaded') {
      setSelectedModelUri(virtualHistory[0]);
    }
  };

  const handleDeleteGarment = (target: 'single' | 'top' | 'bottom', e: React.MouseEvent) => {
    e.stopPropagation();
    setState(prev => {
      if (target === 'single') {
        return { ...prev, singleGarment: null };
      } else {
        const index = target === 'bottom' ? 1 : 0;
        const newMultiple = [...prev.multipleGarments];
        newMultiple[index] = null;
        return { ...prev, multipleGarments: newMultiple };
      }
    });
  };

  const handleSelectProductImage = async (imageUrl: string, index: number) => {
    console.log('Selecting product image:', index, imageUrl);
    setSelectedGarmentIndex(index);
    
    try {
      const response = await fetch(imageUrl, { 
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('✅ Image blob created:', blob.type, blob.size);

      const imageData = await normalizeImageBlob(blob, `product-garment-${index}`);
      setState(prev => ({ ...prev, singleGarment: imageData, error: null }));
      console.log('✅ Image loaded to singleGarment:', imageData.name, imageData.mimeType);
    } catch (error) {
      console.error('❌ Error loading selected product image:', error);
    }
  };

  const handleGenerate = async () => {
    console.log('🔥 handleGenerate called!');
    console.log('state.mainTab:', state.mainTab);
    console.log('garmentTab:', garmentTab);
    console.log('Current state.singleGarment:', state.singleGarment);
    
    if (state.mainTab === 'virtual-model') {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      const startTime = performance.now();
      try {
        const results = await generateVirtualModel(state.creatorSettings, state.aspectRatio, state.outputCount);
        setGenerationHistory(prev => [{ images: results, type: 'virtual-model', prompt: state.creatorSettings.prompt, timestamp: Date.now() }, ...prev]);
        setActiveHistoryIndex(0);
        setState(prev => ({ ...prev, isProcessing: false }));
        if (resultsContainerRef.current) {
          resultsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        const responseMeta = results.map((url, index) => ({
          index,
          mimeType: url.startsWith('data:') ? url.slice(5, url.indexOf(';')) : 'unknown',
          base64Length: url.length
        }));
        logAiSession({
          type: 'virtual-model',
          prompt: state.creatorSettings.prompt,
          aspectRatio: state.aspectRatio,
          outputCount: state.outputCount,
          status: 'success',
          durationMs: Math.round(performance.now() - startTime),
          requestImages: { model: null, garments: [] },
          response: responseMeta,
          usedAvif: false,
          garmentMode: null,
          selectedCategory: null
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Model generation failed";
        if (typeof errorMsg === 'string' && (errorMsg.toLowerCase().includes('avif') || errorMsg.toLowerCase().includes('mime type'))) {
          // eslint-disable-next-line no-console
          console.error('=== AVIF/MIME ERROR LOG (from handleGenerate) ===');
          // eslint-disable-next-line no-console
          console.error(errorMsg);
          logClientError(errorMsg);
        }
        logAiSession({
          type: 'virtual-model',
          prompt: state.creatorSettings.prompt,
          aspectRatio: state.aspectRatio,
          outputCount: state.outputCount,
          status: 'error',
          durationMs: Math.round(performance.now() - startTime),
          error: errorMsg,
          garmentMode: null,
          selectedCategory: null
        });
        setState(prev => ({ 
          ...prev, 
          isProcessing: false, 
          error: errorMsg
        }));
      }
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    const startTime = performance.now();
    let finalModelImage: ImageData | null = null;
    let activeItems: ClothingItem[] = [];

    try {
      // Validate model image - prioritize uploaded image
      // If user uploaded their own model image, use it
      if (state.modelImage) {
        finalModelImage = state.modelImage;
        console.log('✅ Using uploaded model image');
      } 
      // Otherwise, use selected default model
      else if (selectedModelUri && selectedModelUri !== 'uploaded') {
        finalModelImage = await imageUrlToImageData(selectedModelUri);
        console.log('✅ Using default model image');
      }

      if (!finalModelImage) {
        throw new Error("Please add enough images");
      }

      // Validate garment images
      if (garmentTab === 'single') {
        console.log('=== DEBUG Generate ===');
        console.log('garmentTab:', garmentTab);
        console.log('singleGarment:', state.singleGarment);
        console.log('singleGarment exists?:', !!state.singleGarment);
        console.log('singleGarment base64 length:', state.singleGarment?.base64?.length);
        
        if (!state.singleGarment) {
          console.error('❌ singleGarment is null!');
          throw new Error("Please add enough images");
        }
        
        if (!state.singleGarment.base64) {
          console.error('❌ singleGarment.base64 is empty!');
          throw new Error("Please add enough images");
        }
        
        activeItems = [{ image: state.singleGarment, category: state.singleGarmentCategory }];
        console.log('✅ activeItems created successfully');
      } else {
        if (state.multipleGarments[0]) activeItems.push({ image: state.multipleGarments[0], category: GarmentCategory.TOP });
        if (state.multipleGarments[1]) activeItems.push({ image: state.multipleGarments[1], category: GarmentCategory.BOTTOM });
        if (activeItems.length === 0) {
          throw new Error("Please add enough images");
        }
      }

      const results = await processVirtualTryOn({
        modelImage: finalModelImage,
        clothingItems: activeItems,
        aspectRatio: state.aspectRatio,
        prompt: state.creatorSettings.prompt
      }, state.outputCount);
      
      setGenerationHistory(prev => [{ images: results, type: 'try-on', timestamp: Date.now() }, ...prev]);
      setActiveHistoryIndex(0);
      setState(prev => ({ ...prev, isProcessing: false }));
      
      const modelMeta = summarizeImageMeta(finalModelImage);
      const garmentMetas = activeItems.map(item => summarizeImageMeta(item.image, item.category));
      const usedAvif = [modelMeta, ...garmentMetas].some(meta => meta?.originalMimeType?.toLowerCase().includes('avif') || meta?.convertedFromAvif);
      const responseMeta = results.map((url, index) => ({
        index,
        mimeType: url.startsWith('data:') ? url.slice(5, url.indexOf(';')) : 'unknown',
        base64Length: url.length
      }));

      logAiSession({
        type: 'try-on',
        prompt: state.creatorSettings.prompt,
        aspectRatio: state.aspectRatio,
        outputCount: state.outputCount,
        status: 'success',
        durationMs: Math.round(performance.now() - startTime),
        requestImages: { model: modelMeta, garments: garmentMetas },
        response: responseMeta,
        usedAvif,
        garmentMode: garmentTab,
        selectedCategory: state.singleGarmentCategory
      });

      if (resultsContainerRef.current) {
        resultsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Generation failed";
      if (typeof errorMsg === 'string' && (errorMsg.toLowerCase().includes('avif') || errorMsg.toLowerCase().includes('mime type'))) {
        // eslint-disable-next-line no-console
        console.error('=== AVIF/MIME ERROR LOG (from handleGenerate) ===');
        // eslint-disable-next-line no-console
        console.error(errorMsg);
        logClientError(errorMsg);
      }

      const modelMeta = summarizeImageMeta(finalModelImage);
      const garmentMetas = activeItems.map(item => summarizeImageMeta(item.image, item.category));
      const usedAvif = [modelMeta, ...garmentMetas].some(meta => meta?.originalMimeType?.toLowerCase().includes('avif') || meta?.convertedFromAvif);

      logAiSession({
        type: 'try-on',
        prompt: state.creatorSettings.prompt,
        aspectRatio: state.aspectRatio,
        outputCount: state.outputCount,
        status: 'error',
        durationMs: Math.round(performance.now() - startTime),
        requestImages: { model: modelMeta, garments: garmentMetas },
        error: errorMsg,
        usedAvif,
        garmentMode: garmentTab,
        selectedCategory: state.singleGarmentCategory
      });

      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: errorMsg
      }));
    }
  };

  const scrollToSection = (index: number) => {
    setActiveHistoryIndex(index);
    const element = document.getElementById(`session-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderUploadBox = (garment: ImageData | null, label: string, aspectRatioClass: string, targetType: 'top' | 'bottom' | 'single') => {
    const inputRef = targetType === 'single' ? singleFileInputRef : (targetType === 'top' ? topFileInputRef : bottomFileInputRef);

    return (
      <div className={`relative ${aspectRatioClass} bg-[#111] rounded-xl border border-white/5 flex flex-col items-center justify-center transition-all group overflow-hidden ${!garment ? 'cursor-pointer hover:bg-[#141414]' : ''}`}>
        <input type="file" ref={inputRef} className="hidden" onChange={(e) => handleFileUpload(e, targetType)} />
        
        {garment ? (
          <>
            <img src={`data:${garment.mimeType};base64,${garment.base64}`} className="w-full h-full object-contain" />
            
            {targetType === 'single' && (
              <div className="absolute top-3 right-3 z-20" ref={categoryRef}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsCategoryOpen(!isCategoryOpen); }}
                  className="bg-black/80 hover:bg-black backdrop-blur-md text-[11px] font-bold px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 transition-all"
                >
                  {state.singleGarmentCategory}
                  <i className={`fa-solid fa-chevron-${isCategoryOpen ? 'up' : 'down'} text-[8px]`}></i>
                </button>
                {isCategoryOpen && (
                  <div className="absolute top-full right-0 mt-1 w-32 bg-[#1a1a20] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1">
                    {Object.values(GarmentCategory).map(cat => (
                      <button 
                        key={cat}
                        onClick={(e) => {
                          e.stopPropagation();
                          setState(p => ({ ...p, singleGarmentCategory: cat }));
                          setIsCategoryOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-[11px] font-medium text-left flex items-center justify-between transition-colors hover:bg-white/5 ${state.singleGarmentCategory === cat ? 'text-[#4dff4d]' : 'text-white'}`}
                      >
                        {cat}
                        {state.singleGarmentCategory === cat && <i className="fa-solid fa-check text-[9px]"></i>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
              <div className="bg-black/60 backdrop-blur-md rounded-2xl p-1.5 flex items-center gap-1 border border-white/10 shadow-xl">
                <button onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white active:scale-95"><ReUploadIcon className="w-5 h-5" /></button>
                <button onClick={(e) => handleDeleteGarment(targetType, e)} className="p-2.5 hover:bg-red-500/40 rounded-xl transition-all text-white active:scale-95"><DeleteIcon className="w-5 h-5" /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer" onClick={() => inputRef.current?.click()}>
            <div className="w-10 h-10 mb-3 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 group-hover:border-white/10 transition-all text-white/60"><UploadIcon className="w-6 h-6" /></div>
            <p className={`${targetType === 'single' ? 'text-[13px]' : 'text-[11px]'} font-bold opacity-40 group-hover:opacity-100 transition-all`}>{label}</p>
          </div>
        )}
      </div>
    );
  };

  const handleMainTabChange = (tab: MainTab) => {
    setState(prev => ({ ...prev, mainTab: tab }));
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatViewerTitle = (img: { type: MainTab, prompt?: string, timestamp: number }) => {
    const dateStr = new Date(img.timestamp).toISOString().split('T')[0].replace(/-/g, '');
    const prefix = img.type === 'virtual-model' ? 'Virtual Model' : 'AI Outfit';
    const cleanPrompt = img.prompt ? `_${img.prompt.slice(0, 15).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    return `kling_${dateStr}_${prefix}${cleanPrompt}_${img.timestamp.toString().slice(-4)}`;
  };

  // Dragging logic for zoomed image
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
      <aside className="w-[380px] flex-shrink-0 border-r border-white/5 flex flex-col bg-[#0d0d0d]">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 border-b border-white/5">
          <div className="pb-2 text-[14px] font-bold relative text-white">
            AI Virtual Try-On
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-full"></div>
          </div>
        </div>

        {/* Conditional Sidebar Content */}
        {state.mainTab === 'try-on' ? (
          <>
            <div className="px-4 pt-4 pb-2">
              <label className="text-[11px] font-bold text-white/60 block mb-2">Upload Model</label>
              {state.modelImage ? (
                <div className="relative aspect-[1.8/1] rounded-xl overflow-hidden border border-white/5 transition-all group">
                  <div className="w-full h-full bg-black flex items-center justify-center"><img src={`data:${state.modelImage.mimeType};base64,${state.modelImage.base64}`} className="h-full w-auto object-contain" /></div>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                    <div className="bg-black/60 backdrop-blur-md rounded-2xl p-1.5 flex items-center gap-1 border border-white/10 shadow-xl">
                      <button onClick={(e) => { e.stopPropagation(); modelFileInputRef.current?.click(); }} className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white active:scale-95"><ReUploadIcon className="w-5 h-5" /></button>
                      <button onClick={handleDeleteModel} className="p-2.5 hover:bg-red-500/40 rounded-xl transition-all text-white active:scale-95"><DeleteIcon className="w-5 h-5" /></button>
                    </div>
                  </div>
                  <input type="file" ref={modelFileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'model')} />
                </div>
              ) : (
                <div className="relative aspect-[1.8/1] rounded-xl border border-white/5 bg-[#121214] flex flex-col items-center justify-center cursor-pointer group hover:bg-[#16161a] transition-all">
                  <div className="w-10 h-10 mb-3 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 group-hover:border-white/10 transition-all text-white/60"><UploadIcon className="w-6 h-6" /></div>
                  <p className="text-[13px] font-bold opacity-80 tracking-wide">Upload a Model Image</p>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'model')} />
                </div>
              )}
            </div>

            <div className="mt-4 px-4 pb-2 flex items-center">
               <div className="flex bg-[#1a1a1a] rounded-lg p-1 text-[11px] font-bold">
                <button className="px-3 py-1.5 rounded-md transition-all bg-[#2a2a2a] text-white">Single Garment</button>
              </div>
            </div>

            <div className="px-4 py-2 space-y-3 flex-1 overflow-y-auto">
              {/* Debug Info */}
              <div className="text-[9px] text-white/30 mb-2">
                singleGarment: {state.singleGarment ? '✅ Loaded' : '❌ Empty'}
                {state.singleGarment && ` (${state.singleGarment.mimeType})`}
              </div>
              
              {renderUploadBox(state.singleGarment, 'Upload Single Garment', 'aspect-[1.8/1]', 'single')}
              
              {/* Product Images Gallery */}
              {productGarmentImages.length > 0 && (
                <div className="mt-4">
                  <label className="text-[11px] font-bold text-white/40 block mb-2">Product Images ({productGarmentImages.length})</label>
                  <div className="grid grid-cols-3 gap-2">
                    {productGarmentImages.map((imageUrl, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectProductImage(imageUrl, index)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                          selectedGarmentIndex === index 
                            ? 'border-[#4dff4d] shadow-lg shadow-[#4dff4d]/20' 
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <img 
                          src={imageUrl} 
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {selectedGarmentIndex === index && (
                          <div className="absolute inset-0 bg-[#4dff4d]/10 flex items-center justify-center">
                            <i className="fa-solid fa-check text-[#4dff4d] text-xl"></i>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Section */}
            <div className="px-4 py-3 space-y-2">
              <label className="text-[11px] font-bold text-white/40 block">Prompt <span className="font-normal opacity-50">(Optional)</span></label>
              <textarea 
                value={state.creatorSettings.prompt}
                onChange={(e) => setState(s => ({...s, creatorSettings: {...s.creatorSettings, prompt: e.target.value}}))}
                placeholder="Describe your creative ideas..."
                className="w-full h-20 bg-[#0d0d0d] border border-white/10 rounded-lg p-2.5 text-[11px] text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-white/30 transition-all no-scrollbar"
              />
            </div>

            <div className="p-4 border-t border-white/5 bg-[#0d0d0d] flex items-center gap-3">
              <div className="relative w-1/3" ref={dropdownRef}>
                <button onClick={() => setIsOutputDropdownOpen(!isOutputDropdownOpen)} className="w-full h-9 flex items-center justify-between bg-[#111] border border-white/20 rounded-lg px-3 text-[11px] font-medium hover:bg-[#1a1a1a] transition-all"><span className="opacity-60">{state.outputCount} Outputs</span><i className={`fa-solid fa-chevron-${isOutputDropdownOpen ? 'up' : 'down'} text-[8px] opacity-40`}></i></button>
                {isOutputDropdownOpen && (
                  <div className="absolute bottom-full left-0 w-40 mb-2 bg-[#1e1e24] rounded-xl border border-white/5 shadow-2xl overflow-hidden z-50 py-1">
                    {[1, 2, 3, 4].map(num => (
                      <button key={num} onClick={() => { setState(p => ({ ...p, outputCount: num })); setIsOutputDropdownOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-medium text-left hover:bg-white/5 transition-colors ${state.outputCount === num ? 'text-[#4dff4d] bg-white/5' : 'text-white'}`}><span>{num} Output{num > 1 ? 's' : ''}</span>{state.outputCount === num && <i className="fa-solid fa-check text-[10px]"></i>}</button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={handleGenerate} disabled={state.isProcessing} className="flex-1 bg-[#4dff4d] hover:bg-[#3ce63c] text-black font-bold h-9 rounded-lg flex items-center justify-center text-[12px] transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg">{state.isProcessing ? <i className="fa-solid fa-spinner animate-spin"></i> : "Generate"}</button>
            </div>
          </>
        ) : null}
      </aside>

      <main className="flex-1 bg-[#121212] relative overflow-hidden flex flex-col">
        <div className="flex flex-1 overflow-hidden">
          <div ref={resultsContainerRef} className="flex-1 overflow-y-auto no-scrollbar bg-[#0f0f0f] relative">
            {state.isProcessing && (
              <div className="sticky top-0 w-full h-20 bg-[#0a0a0a]/80 backdrop-blur-md flex items-center justify-center z-30 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-spinner animate-spin text-[#4dff4d]"></i>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#4dff4d]">Rendering New Result...</p>
                </div>
              </div>
            )}

            {generationHistory.length > 0 ? (
              <div className="flex flex-col">
                {generationHistory.map((gen, idx) => (
                  <section key={idx} id={`session-${idx}`} className={`py-8 px-10 border-b border-white/5 transition-all ${activeHistoryIndex === idx ? 'bg-white/[0.02]' : ''}`}>
                    <div className="flex flex-col mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <i className="fa-regular fa-image text-white/90 text-lg"></i>
                          <span className="text-[14px] font-bold text-white/90">
                            {gen.type === 'virtual-model' ? 'Virtual Model' : 'AI Outfit'}
                          </span>
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
                          
                          {/* Floating Pill-style Action Bar (Desktop Hover) */}
                          <div className="absolute top-3 right-3 flex items-center bg-[#242424]/80 backdrop-blur-xl rounded-xl p-1.5 border border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 z-20 shadow-2xl">
                             <button className="p-2 hover:bg-white/5 rounded-lg transition-all text-white/70 hover:text-white" onClick={(e) => { e.stopPropagation(); /* Save logic */ }}>
                               <i className="fa-regular fa-bookmark text-[14px]"></i>
                             </button>
                             <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 downloadImage(img, formatViewerTitle({ type: gen.type, prompt: gen.prompt, timestamp: gen.timestamp }));
                               }}
                               className="p-2 hover:bg-white/5 rounded-lg transition-all text-white/70 hover:text-white"
                             >
                               <i className="fa-solid fa-download text-[14px]"></i>
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : !state.isProcessing && (
              <div className="w-full h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                <i className="fa-light fa-sparkles text-7xl text-[#4dff4d]"></i>
                <p className="text-[11px] uppercase tracking-[0.3em] font-bold">Waiting for your creativity</p>
              </div>
            )}
          </div>

          <div className="w-[80px] border-l border-white/5 bg-[#0a0a0a] flex flex-col items-center py-6 gap-5 overflow-y-auto no-scrollbar z-20">
            {generationHistory.map((gen, idx) => (
              <button key={idx} onClick={() => scrollToSection(idx)} className={`w-[56px] h-[56px] rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 relative shadow-lg ${activeHistoryIndex === idx ? 'border-[#4dff4d] scale-110' : 'border-white/5 opacity-50 hover:opacity-100 hover:scale-105'}`}>
                <img src={gen.images[0]} className="w-full h-full object-cover" />
                {activeHistoryIndex === idx && <div className="absolute inset-0 bg-[#4dff4d]/10"></div>}
              </button>
            ))}
            {generationHistory.length === 0 && <div className="flex flex-col gap-4 opacity-10">{[1, 2, 3, 4].map(i => <div key={i} className="w-12 h-12 rounded-xl border border-white/20 border-dashed"></div>)}</div>}
          </div>
        </div>

        {state.error && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-8 py-3 rounded-2xl text-[11px] font-bold backdrop-blur-xl shadow-2xl flex items-center animate-in slide-in-from-bottom-4 duration-300 z-50">
            <i className="fa-solid fa-circle-exclamation mr-3 text-sm"></i>{state.error}
            <button onClick={() => setState(p => ({...p, error: null}))} className="ml-6 opacity-40 hover:opacity-100 transition-all"><i className="fa-solid fa-xmark text-sm"></i></button>
          </div>
        )}
      </main>

      {/* Image Viewer Popup (Modal) */}
      {viewerImage && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative bg-[#0a0a0a] rounded-3xl w-full max-w-[92vw] max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Navigation Bar */}
            <div className="h-16 flex items-center justify-between px-6 bg-[#0a0a0a] border-b border-white/5 z-20">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setViewerImage(null)}
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
                {/* Zoom Controls */}
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

                <button 
                  className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                  title="Save"
                >
                  <i className="fa-regular fa-bookmark text-white/60 group-hover:text-white"></i>
                </button>
                <button 
                  onClick={() => downloadImage(viewerImage.url, formatViewerTitle(viewerImage))}
                  className="flex items-center justify-center px-5 h-10 bg-[#4dff4d] hover:bg-[#3ce63c] text-black rounded-xl transition-all text-xs font-black shadow-lg"
                  title="Download"
                >
                  <i className="fa-solid fa-download mr-2"></i>
                  DOWNLOAD
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div 
              className="flex-1 overflow-hidden bg-[#080808] flex items-center justify-center custom-viewer-scroll no-scrollbar relative select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
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
      )}

      {/* Styles for the new viewer */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-viewer-scroll {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
};

export default App;
