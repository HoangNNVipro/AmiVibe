
import React, { useState, useRef, useEffect } from 'react';
import { 
  AppState, 
  ImageData, 
  AspectRatio,
  GarmentCategory,
  ClothingItem,
  MainTab,
  Gender,
  AgeGroup,
  SidebarTab,
  GarmentTab,
  GenerationEntry
} from '@/types';
import { processVirtualTryOn, generateVirtualModel } from '@/services/geminiService';
import { useHistory } from '../context/HistoryContext';
import { imageUrlToImageData } from '../lib/utils';

// Import local components
import { ModelLibraryModal } from '../components/home/ModelLibraryModal';
import { ProductLibraryModal } from '../components/home/ProductLibraryModal';
import { SaveToProductModal } from '../components/home/SaveToProductModal';
import { DeletionModal } from '../components/home/DeletionModal';
import { ImageViewerModal } from '../components/home/ImageViewerModal';
import { VirtualModelTab } from '../components/home/VirtualModelTab';
import { TryOnTab } from '../components/home/TryOnTab';
import { HistorySidebar } from '../components/home/HistorySidebar';
import { GenerationHistorySection } from '../components/home/GenerationHistorySection';
import { UploadIcon, ReUploadIcon, DeleteIcon } from '../components/home/Icons';

const App: React.FC = () => {
  const { addVirtualModel, updateVirtualModel, deleteVirtualModel, removeImageFromRecord, addTryOn, updateTryOn, deleteTryOn, history, loading: historyLoading } = useHistory();
  const [activeTab, setActiveTab] = useState<SidebarTab>('virtual');
  const [editingVirtualModelId, setEditingVirtualModelId] = useState<string | null>(null);
  const [editingTryOnId, setEditingTryOnId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingImageInfo, setDeletingImageInfo] = useState<{ id: string, type: string, url: string } | null>(null);
  const [saveToProductTarget, setSaveToProductTarget] = useState<{ id: string, imageUrl: string, items: any[] } | null>(null);
  const [selectedProductsForSaving, setSelectedProductsForSaving] = useState<string[]>([]);
  const [isSyncingProducts, setIsSyncingProducts] = useState(false);
  const [garmentTab, setGarmentTab] = useState<GarmentTab>('single');
  const [selectedModelUri, setSelectedModelUri] = useState<string | null>(null);
  const [selectedGarmentUri, setSelectedGarmentUri] = useState<{
    single: string | null;
    top: string | null;
    bottom: string | null;
  }>({
    single: null,
    top: null,
    bottom: null
  });
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isRatioOpen, setIsRatioOpen] = useState(false);

  useEffect(() => {
    const fetchInitialImageStatus = async () => {
      if (saveToProductTarget) {
        const productIds = saveToProductTarget.items
          .filter(item => item.productId)
          .map(item => item.productId);
        
        if (productIds.length > 0) {
          try {
            const response = await fetch('/api/products/fetch-by-ids', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: productIds })
            });
            
            if (response.ok) {
              const products = await response.json();
              // Check both custom id and _id
              const savedIds = products
                .filter((p: any) => p.image && p.image.includes(saveToProductTarget.imageUrl))
                .map((p: any) => p.id || p._id);
              
              setSelectedProductsForSaving(savedIds);
            }
          } catch (error) {
            console.error('Error fetching initial product status:', error);
          }
        }
      }
    };

    fetchInitialImageStatus();
  }, [saveToProductTarget]);

  const confirmSaveToProducts = async () => {
    if (!saveToProductTarget || isSyncingProducts) return;

    setIsSyncingProducts(true);
    try {
      const allProductIds = saveToProductTarget.items
        .filter(item => item.productId)
        .map(item => item.productId);

      const unselectedIds = allProductIds.filter(id => !selectedProductsForSaving.includes(id));

      console.log('Sending sync command:', { 
        imageUrl: saveToProductTarget.imageUrl, 
        selectedIds: selectedProductsForSaving, 
        unselectedIds 
      });

      const response = await fetch('/api/products/sync-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: saveToProductTarget.imageUrl,
          selectedIds: selectedProductsForSaving,
          unselectedIds: unselectedIds
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to sync product images');
      }
      
      setSaveToProductTarget(null);
      setSelectedProductsForSaving([]);
    } catch (error) {
      console.error('Error syncing products:', error);
      alert(error instanceof Error ? error.message : 'Failed to save to products. Please try again.');
    } finally {
      setIsSyncingProducts(false);
    }
  };

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
  const [dbProducts, setDbProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setDbProducts(data);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };
    fetchProducts();
  }, []);

  // Sync generationHistory with database records from context
  useEffect(() => {
    const filtered = history
      .filter(item => item.type === state.mainTab)
      .map(item => ({
        images: item.resultImages || [],
        type: item.type as any,
        prompt: item.prompt,
        timestamp: new Date(item.createdAt).getTime()
      }));
    
    setGenerationHistory(filtered);
    
    // Reset editing when tab changes
    setEditingVirtualModelId(null);
    setEditingTryOnId(null);
    
    // Auto-select the first one if available and none selected
    if (filtered.length > 0 && activeHistoryIndex === -1) {
      setActiveHistoryIndex(0);
    }
  }, [history, state.mainTab]);

  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productTarget, setProductTarget] = useState<'single' | 'top' | 'bottom'>('single');
  const [modelSearch, setModelSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [modelFilters, setModelFilters] = useState<{
    gender: Gender | 'all';
    age: AgeGroup | 'all';
    skinTone: string | 'all';
  }>({
    gender: 'all',
    age: 'all',
    skinTone: 'all'
  });
  const [productFilters, setProductFilters] = useState<{
    gender: 'men' | 'women' | 'unisex' | 'all';
    category: 'Topwear' | 'Bottomwear' | 'Dress' | 'all';
    seasons: 'all' | 'Spring' | 'Summer' | 'Autumn' | 'Winter';
    styles: 'all' | 'Casual' | 'Office' | 'Sporty' | 'Streetwear' | 'Elegant';
    maxPrice: number;
  }>({
    gender: 'all',
    category: 'all',
    seasons: 'all',
    styles: 'all',
    maxPrice: 5000
  });

  const [selectedModelData, setSelectedModelData] = useState<{ url: string; name: string; desc: string } | null>(null);
  const [selectedGarmentData, setSelectedGarmentData] = useState<{
    single: { url: string; name: string; desc: string; id?: string } | null;
    top: { url: string; name: string; desc: string; id?: string } | null;
    bottom: { url: string; name: string; desc: string; id?: string } | null;
  }>({
    single: null,
    top: null,
    bottom: null
  });

  const modelLibrary = history
    .filter(item => item.type === 'virtual-model')
    .flatMap((item: any) => 
      (item.resultImages || []).map((url: string) => ({
        ...item,
        url
      }))
    )
    .map((item: any, globalIndex: number) => ({
        id: `${item._id}-${globalIndex}`,
        name: `Model ${globalIndex + 1}`,
        desc: item.prompt || `Model generated on ${new Date(item.createdAt).toLocaleDateString()}`,
        url: item.url,
        gender: item.gender as Gender,
        age: (item.age as AgeGroup) || AgeGroup.YOUTH,
        skinTone: item.skinTone,
        prompt: item.prompt || ''
    }));

  const productLibrary = dbProducts.map((p: any) => ({
    id: p._id,
    name: p.name,
    desc: p.description,
    url: p.image && Array.isArray(p.image) && p.image.length > 0 ? p.image[0] : '',
    gender: p.category?.toLowerCase() === 'men' ? 'men' : (p.category?.toLowerCase() === 'women' ? 'women' : 'unisex'),
    category: p.subCategory, // e.g. Topwear, Bottomwear, Dress
    bestseller: p.bestseller || false,
    price: p.price || 0,
    seasons: p.seasons || [],
    styles: p.styles || []
  }));

  const handleModelSelect = (model: typeof modelLibrary[0]) => {
    setSelectedModelData({ url: model.url, name: model.name, desc: model.desc });
    setSelectedModelUri(model.url);
    setIsModelModalOpen(false);
  };

  const handleProductSelect = (product: typeof productLibrary[0]) => {
    const data = { url: product.url, name: product.name, desc: product.desc, id: product.id };
    
    imageUrlToImageData(product.url).then(imgData => {
      if (productTarget === 'single') {
        setSelectedGarmentData(prev => ({ ...prev, single: data }));
        setSelectedGarmentUri(prev => ({ ...prev, single: product.url }));
        setState(prev => ({ ...prev, singleGarment: imgData, singleGarmentCategory: product.category }));
      } else if (productTarget === 'top') {
        setSelectedGarmentData(prev => ({ ...prev, top: data }));
        setSelectedGarmentUri(prev => ({ ...prev, top: product.url }));
        setState(prev => {
          const newMultiple = [...prev.multipleGarments];
          newMultiple[0] = imgData;
          return { ...prev, multipleGarments: newMultiple };
        });
      } else {
        setSelectedGarmentData(prev => ({ ...prev, bottom: data }));
        setSelectedGarmentUri(prev => ({ ...prev, bottom: product.url }));
        setState(prev => {
          const newMultiple = [...prev.multipleGarments];
          newMultiple[1] = imgData;
          return { ...prev, multipleGarments: newMultiple };
        });
      }
    });
    
    setIsProductModalOpen(false);
  };

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

  // Reset pan and zoom when viewer opens
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
    setZoom(1);
    setIsDragging(false);
  }, [viewerImage]);

  // Automatically center the image when dimensions return to 100% or smaller
  useEffect(() => {
    if (zoom <= 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoom]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'model' | 'top' | 'bottom' | 'single') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const data: ImageData = {
        base64: (reader.result as string).split(',')[1],
        mimeType: file.type,
        name: file.name
      };

      if (target === 'model') {
        setState(prev => ({ ...prev, modelImage: data }));
        setSelectedModelUri('uploaded');
        setSelectedModelData({ url: previewUrl, name: 'Uploaded Image', desc: 'Portrait uploaded from computer' });
      } else {
        const itemInfo = { url: previewUrl, name: 'Uploaded Product', desc: 'Uploaded from local files' };
        if (target === 'single') {
          setState(prev => ({ ...prev, singleGarment: data }));
          setSelectedGarmentData(prev => ({ ...prev, single: itemInfo }));
          setSelectedGarmentUri(prev => ({ ...prev, single: 'uploaded' }));
        } else if (target === 'top') {
          setState(prev => {
            const newMultiple = [...prev.multipleGarments];
            newMultiple[0] = data;
            return { ...prev, multipleGarments: newMultiple };
          });
          setSelectedGarmentData(prev => ({ ...prev, top: itemInfo }));
          setSelectedGarmentUri(prev => ({ ...prev, top: 'uploaded' }));
        } else if (target === 'bottom') {
          setState(prev => {
            const newMultiple = [...prev.multipleGarments];
            newMultiple[1] = data;
            return { ...prev, multipleGarments: newMultiple };
          });
          setSelectedGarmentData(prev => ({ ...prev, bottom: itemInfo }));
          setSelectedGarmentUri(prev => ({ ...prev, bottom: 'uploaded' }));
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeleteModel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setState(prev => ({ ...prev, modelImage: null }));
    setSelectedModelData(null);
    setSelectedModelUri(null);
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
    setSelectedGarmentUri(prev => ({ ...prev, [target]: null }));
    setSelectedGarmentData(prev => ({ ...prev, [target]: null }));
  };

  const handleGenerate = async () => {
    if (state.mainTab === 'virtual-model') {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      try {
        const results = await generateVirtualModel(state.creatorSettings, state.aspectRatio, state.outputCount);
        
        const payload = {
          gender: state.creatorSettings.gender,
          age: state.creatorSettings.age,
          skinTone: state.creatorSettings.skinTone,
          prompt: state.creatorSettings.prompt,
          ratio: state.aspectRatio,
          outputCount: state.outputCount,
          resultImages: results
        };

        if (editingVirtualModelId) {
          await updateVirtualModel(editingVirtualModelId, payload);
          setEditingVirtualModelId(null);
        } else {
          // Save to MongoDB with specific fields for Virtual Model
          await addVirtualModel(payload);
        }

        // Reset Control Panel to initial state after generation
        setState(prev => ({
          ...prev,
          creatorSettings: {
            gender: Gender.FEMALE,
            age: AgeGroup.YOUTH,
            skinTone: '#EFC194',
            prompt: ''
          },
          aspectRatio: AspectRatio.PORTRAIT_3_4,
          outputCount: 3,
          isProcessing: false
        }));

        setActiveHistoryIndex(0);
        if (resultsContainerRef.current) {
          resultsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (err) {
        setState(prev => ({ 
          ...prev, 
          isProcessing: false, 
          error: err instanceof Error ? err.message : "Model generation failed" 
        }));
      }
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      let finalModelImage: ImageData | null = null;
      if (selectedModelUri === 'uploaded') {
        finalModelImage = state.modelImage;
      } else if (selectedModelUri) {
        finalModelImage = await imageUrlToImageData(selectedModelUri);
      }

      if (!finalModelImage) throw new Error("Please select a model first from Virtual Models or Upload Image.");

      let activeItems: (ClothingItem & { productId?: string })[] = [];
      if (garmentTab === 'single') {
        if (!state.singleGarment) throw new Error("Please select a garment first.");
        activeItems = [{ 
          image: state.singleGarment, 
          category: state.singleGarmentCategory,
          productId: selectedGarmentData.single?.id
        }];
      } else {
        if (!state.multipleGarments[0] || !state.multipleGarments[1]) {
          throw new Error("Please select both top and bottom garments for Multiple mode.");
        }
        
        activeItems.push({ 
          image: state.multipleGarments[0], 
          category: GarmentCategory.TOP,
          productId: selectedGarmentData.top?.id
        });
        activeItems.push({ 
          image: state.multipleGarments[1], 
          category: GarmentCategory.BOTTOM,
          productId: selectedGarmentData.bottom?.id
        });
      }

      const results = await processVirtualTryOn({
        modelImage: finalModelImage,
        clothingItems: activeItems,
        aspectRatio: state.aspectRatio
      }, state.outputCount);
      
      const tryOnPayload = {
        modelImage: (selectedModelUri && selectedModelUri !== 'uploaded') 
          ? selectedModelUri 
          : (finalModelImage.base64.startsWith('data:') ? finalModelImage.base64 : `data:${finalModelImage.mimeType};base64,${finalModelImage.base64}`),
        modelSource: selectedModelUri === 'uploaded' ? 'upload' : 'virtual',
        garmentMode: garmentTab,
        clothingItems: activeItems.map(item => {
          let imageUrl = item.image.base64.startsWith('data:') ? item.image.base64 : `data:${item.image.mimeType};base64,${item.image.base64}`;
          let source = 'upload';
          if (garmentTab === 'single' && selectedGarmentUri.single && selectedGarmentUri.single !== 'uploaded') {
            imageUrl = selectedGarmentUri.single;
            source = 'gallery';
          } else if (garmentTab === 'multiple') {
            if (item.category === GarmentCategory.TOP && selectedGarmentUri.top && selectedGarmentUri.top !== 'uploaded') {
              imageUrl = selectedGarmentUri.top;
              source = 'gallery';
            } else if (item.category === GarmentCategory.BOTTOM && selectedGarmentUri.bottom && selectedGarmentUri.bottom !== 'uploaded') {
              imageUrl = selectedGarmentUri.bottom;
              source = 'gallery';
            }
          }
          return {
            category: item.category,
            imageUrl: imageUrl,
            productId: item.productId,
            source: source
          };
        }),
        resultImages: results,
        aspectRatio: state.aspectRatio,
        outputCount: state.outputCount
      };

      // Save to MongoDB with correct structure for Try-On
      if (editingTryOnId) {
        await updateTryOn(editingTryOnId, tryOnPayload);
        setEditingTryOnId(null);
      } else {
        await addTryOn(tryOnPayload);
      }

      // Reset selection after generation
      setSelectedModelData(null);
      setSelectedModelUri(null);
      setSelectedGarmentData({ single: null, top: null, bottom: null });
      setSelectedGarmentUri({ single: null, top: null, bottom: null });
      setState(prev => ({
        ...prev,
        modelImage: null,
        singleGarment: null,
        multipleGarments: [null, null],
        outputCount: 3
      }));

      setActiveHistoryIndex(0);
      setState(prev => ({ ...prev, isProcessing: false }));
      
      if (resultsContainerRef.current) {
        resultsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: err instanceof Error ? err.message : "Generation failed" 
      }));
    }
  };

  const handleEditVirtualModel = (id: string, index: number) => {
    // Toggle off if clicking the same button
    if (editingVirtualModelId === id) {
      setEditingVirtualModelId(null);
      setState(prev => ({
        ...prev,
        creatorSettings: {
          gender: Gender.FEMALE,
          age: AgeGroup.YOUTH,
          skinTone: '#EFC194',
          prompt: ''
        },
        aspectRatio: AspectRatio.PORTRAIT_3_4,
        outputCount: 3
      }));
      return;
    }

    const record = history.find(item => item._id === id);
    if (!record) return;

    setEditingVirtualModelId(id);
    setActiveHistoryIndex(index);
    
    // Find matching record in context to get full details (if not in history, though it should be)
    // Actually our history context has the full data
    const vmData = record as any;
    
    setState(prev => ({
      ...prev,
      creatorSettings: {
        gender: vmData.gender || Gender.FEMALE,
        age: vmData.age || AgeGroup.YOUTH,
        skinTone: vmData.skinTone || '#EFC194',
        prompt: vmData.prompt || ''
      },
      aspectRatio: vmData.ratio || AspectRatio.PORTRAIT_3_4,
      outputCount: vmData.outputCount || 3
    }));

    // Scroll sidebar to top to see changes
    const sidebar = document.querySelector('aside');
    if (sidebar) sidebar.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleEditTryOn = async (id: string, index: number) => {
    // Toggle off if clicking the same button
    if (editingTryOnId === id) {
      setEditingTryOnId(null);
      setSelectedModelData(null);
      setSelectedModelUri(null);
      setSelectedGarmentData({ single: null, top: null, bottom: null });
      setSelectedGarmentUri({ single: null, top: null, bottom: null });
      setState(prev => ({
        ...prev,
        modelImage: null,
        singleGarment: null,
        multipleGarments: [null, null],
        aspectRatio: AspectRatio.PORTRAIT_3_4,
        outputCount: 3
      }));
      return;
    }

    const record = history.find(item => item._id === id);
    if (!record) return;
    const tryOnData = record as any;

    setEditingTryOnId(id);
    setActiveHistoryIndex(index);
    setGarmentTab(tryOnData.clothingItems.length > 1 ? 'multiple' : 'single');

    // Reset previous selection states before filling new ones
    setSelectedGarmentData({ single: null, top: null, bottom: null });
    setSelectedGarmentUri({ single: null, top: null, bottom: null });

    // Fill Model
    const modelUrl = tryOnData.modelImage;
    const modelSource = tryOnData.modelSource || (modelUrl.startsWith('http') ? 'virtual' : 'upload');
    setSelectedModelUri(modelSource === 'upload' ? 'uploaded' : modelUrl);
    setSelectedModelData({ url: modelUrl, name: 'Model from record', desc: 'Editing existing Outfit' });
    
    // Crucial: Load model image into state so generator recognizes it if it was an upload
    const modelImgData = await imageUrlToImageData(modelUrl);

    // Fill Garments
    if (tryOnData.clothingItems.length === 1) {
      const g = tryOnData.clothingItems[0];
      const gSource = g.source || (g.imageUrl.startsWith('http') ? 'gallery' : 'upload');
      setSelectedGarmentUri(prev => ({ ...prev, single: gSource === 'upload' ? 'uploaded' : g.imageUrl }));
      setSelectedGarmentData(prev => ({ ...prev, single: { url: g.imageUrl, name: 'Garment from record', desc: g.category, id: g.productId } }));
      const imgData = await imageUrlToImageData(g.imageUrl);
      setState(prev => ({ 
        ...prev, 
        modelImage: modelImgData,
        singleGarment: imgData, 
        singleGarmentCategory: g.category, 
        multipleGarments: [null, null],
        aspectRatio: tryOnData.aspectRatio || prev.aspectRatio,
        outputCount: tryOnData.outputCount || prev.outputCount
      }));
    } else {
      const top = tryOnData.clothingItems.find((c: any) => c.category === GarmentCategory.TOP);
      const bottom = tryOnData.clothingItems.find((c: any) => c.category === GarmentCategory.BOTTOM);
      
      const garmentUpdates: { top?: ImageData, bottom?: ImageData } = {};
      
      if (top) {
        const topSource = top.source || (top.imageUrl.startsWith('http') ? 'gallery' : 'upload');
        setSelectedGarmentUri(prev => ({ ...prev, top: topSource === 'upload' ? 'uploaded' : top.imageUrl }));
        setSelectedGarmentData(prev => ({ ...prev, top: { url: top.imageUrl, name: 'Topwear', desc: 'From record', id: top.productId } }));
        garmentUpdates.top = await imageUrlToImageData(top.imageUrl);
      }
      if (bottom) {
        const bottomSource = bottom.source || (bottom.imageUrl.startsWith('http') ? 'gallery' : 'upload');
        setSelectedGarmentUri(prev => ({ ...prev, bottom: bottomSource === 'upload' ? 'uploaded' : bottom.imageUrl }));
        setSelectedGarmentData(prev => ({ ...prev, bottom: { url: bottom.imageUrl, name: 'Bottomwear', desc: 'From record', id: bottom.productId } }));
        garmentUpdates.bottom = await imageUrlToImageData(bottom.imageUrl);
      }
      
      setState(prev => {
        const newMultiple: [ImageData | null, ImageData | null] = [null, null];
        if (garmentUpdates.top) newMultiple[0] = garmentUpdates.top;
        if (garmentUpdates.bottom) newMultiple[1] = garmentUpdates.bottom;
        return { 
          ...prev, 
          modelImage: modelImgData,
          singleGarment: null,
          multipleGarments: newMultiple, 
          aspectRatio: tryOnData.aspectRatio || prev.aspectRatio,
          outputCount: tryOnData.outputCount || prev.outputCount
        };
      });
    }

    const sidebar = document.querySelector('aside');
    if (sidebar) sidebar.scrollTo({ top: 0, behavior: 'smooth' });
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

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback
      window.open(url, '_blank');
    }
  };

  const formatViewerTitle = (img: { type: MainTab, prompt?: string, timestamp: number }) => {
    const dateStr = new Date(img.timestamp).toISOString().split('T')[0].replace(/-/g, '');
    const prefix = img.type === 'virtual-model' ? 'Virtual Model' : 'AI Outfit';
    const basePrefix = img.type === 'virtual-model' ? 'VirtualModels' : 'Tryons';
    const cleanPrompt = img.prompt ? `_${img.prompt.slice(0, 15).replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    return `${basePrefix}_${dateStr}_${prefix}${cleanPrompt}_${img.timestamp.toString().slice(-4)}`;
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
        {/* Parent Header Tabs */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-6 border-b border-white/5">
          <button 
            onClick={() => {
              const url = process.env.ADMIN_URL;
              if (url) {
                window.location.href = url;
              }
            }}
            className="pb-2 text-white/40 hover:text-white transition-all flex items-center justify-center cursor-pointer"
            title="Back to Admin"
          >
            <i className="fa-solid fa-arrow-left text-sm"></i>
          </button>
          <button 
            onClick={() => handleMainTabChange('virtual-model')}
            className={`pb-2 text-[14px] font-bold relative transition-all ${state.mainTab === 'virtual-model' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            Virtual Model
            {state.mainTab === 'virtual-model' && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-full"></div>
            )}
          </button>
          <button 
            onClick={() => handleMainTabChange('try-on')}
            className={`pb-2 text-[14px] font-bold relative transition-all ${state.mainTab === 'try-on' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            AI Virtual Try-On
            {state.mainTab === 'try-on' && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-full"></div>
            )}
          </button>
        </div>

        {/* Conditional Sidebar Content */}
        {state.mainTab === 'try-on' ? (
          <TryOnTab
            setIsModelModalOpen={setIsModelModalOpen}
            modelFileInputRef={modelFileInputRef}
            handleFileUpload={handleFileUpload}
            selectedModelData={selectedModelData}
            selectedModelUri={selectedModelUri}
            handleDeleteModel={handleDeleteModel}
            garmentTab={garmentTab}
            setGarmentTab={setGarmentTab}
            setIsProductModalOpen={setIsProductModalOpen}
            setProductTarget={setProductTarget}
            setProductFilters={setProductFilters}
            selectedGarmentData={selectedGarmentData}
            selectedGarmentUri={selectedGarmentUri}
            singleFileInputRef={singleFileInputRef}
            topFileInputRef={topFileInputRef}
            bottomFileInputRef={bottomFileInputRef}
            handleDeleteGarment={handleDeleteGarment}
            isOutputDropdownOpen={isOutputDropdownOpen}
            setIsOutputDropdownOpen={setIsOutputDropdownOpen}
            outputCount={state.outputCount}
            setOutputCount={(count) => setState(s => ({...s, outputCount: count}))}
            dropdownRef={dropdownRef}
            handleGenerate={handleGenerate}
            isProcessing={state.isProcessing}
          />
        ) : (
          <VirtualModelTab
            state={state}
            setState={setState}
            skinTones={skinTones}
            isRatioOpen={isRatioOpen}
            setIsRatioOpen={setIsRatioOpen}
            isOutputDropdownOpen={isOutputDropdownOpen}
            setIsOutputDropdownOpen={setIsOutputDropdownOpen}
            ratioDropdownRef={ratioDropdownRef}
            dropdownRef={dropdownRef}
            handleGenerate={handleGenerate}
          />
        )}
      </aside>

      <main className="flex-1 bg-[#121212] relative overflow-hidden flex flex-col">
        <div className="flex flex-1 overflow-hidden">
          <div ref={resultsContainerRef} className="flex-1 overflow-y-auto no-scrollbar bg-[#0f0f0f] relative">
            {state.isProcessing && (
              <div className="sticky top-0 w-full h-20 bg-[#0a0a0a]/80 backdrop-blur-md flex items-center justify-center z-30 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-spinner animate-spin text-[#4dff4d]"></i>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#4dff4d]">
                    {editingVirtualModelId ? "Updating Result..." : "Rendering New Result..."}
                  </p>
                </div>
              </div>
            )}

            {generationHistory.length > 0 ? (
              <GenerationHistorySection
                generationHistory={generationHistory}
                history={history}
                editingVirtualModelId={editingVirtualModelId}
                editingTryOnId={editingTryOnId}
                activeHistoryIndex={activeHistoryIndex}
                handleEditVirtualModel={handleEditVirtualModel}
                handleEditTryOn={handleEditTryOn}
                setDeletingId={setDeletingId}
                setViewerImage={setViewerImage}
                setSaveToProductTarget={setSaveToProductTarget}
                setDeletingImageInfo={setDeletingImageInfo}
                downloadImage={downloadImage}
                formatViewerTitle={formatViewerTitle}
              />
            ) : !state.isProcessing && (
              <div className="w-full h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                <i className="fa-light fa-sparkles text-7xl text-[#4dff4d]"></i>
                <p className="text-[11px] uppercase tracking-[0.3em] font-bold">Waiting for your creativity</p>
              </div>
            )}
          </div>

          <HistorySidebar
            loading={historyLoading}
            generationHistory={generationHistory}
            activeHistoryIndex={activeHistoryIndex}
            scrollToSection={scrollToSection}
          />
        </div>

        {state.error && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-8 py-3 rounded-2xl text-[11px] font-bold backdrop-blur-xl shadow-2xl flex items-center animate-in slide-in-from-bottom-4 duration-300 z-50">
            <i className="fa-solid fa-circle-exclamation mr-3 text-sm"></i>{state.error}
            <button onClick={() => setState(p => ({...p, error: null}))} className="ml-6 opacity-40 hover:opacity-100 transition-all"><i className="fa-solid fa-xmark text-sm"></i></button>
          </div>
        )}
      </main>
      {isModelModalOpen && (
        <ModelLibraryModal
          isOpen={isModelModalOpen}
          onClose={() => setIsModelModalOpen(false)}
          modelFilters={modelFilters}
          setModelFilters={setModelFilters}
          modelSearch={modelSearch}
          setModelSearch={setModelSearch}
          modelLibrary={modelLibrary}
          handleModelSelect={handleModelSelect}
          skinTones={skinTones}
        />
      )}

      {/* Product Library Modal */}
      {isProductModalOpen && (
        <ProductLibraryModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          productTarget={productTarget}
          productFilters={productFilters}
          setProductFilters={setProductFilters}
          productSearch={productSearch}
          setProductSearch={setProductSearch}
          productLibrary={productLibrary}
          handleProductSelect={handleProductSelect}
        />
      )}

      {/* Model Library Modal ends here */}
      
      {/* Save to Product Popup */}
      {saveToProductTarget && (
        <SaveToProductModal
          target={saveToProductTarget}
          onClose={() => {
            setSaveToProductTarget(null);
            setSelectedProductsForSaving([]);
          }}
          selectedProducts={selectedProductsForSaving}
          setSelectedProducts={setSelectedProductsForSaving}
          onConfirm={confirmSaveToProducts}
          isSyncing={isSyncingProducts}
        />
      )}

      {/* Deletion Confirmation Popup */}
      {deletingId && (
        <DeletionModal
          id={deletingId}
          onClose={() => setDeletingId(null)}
          type={history.find(h => h._id === deletingId)?.type === 'try-on' ? 'try-on' : 'virtual-model'}
          onConfirm={async () => {
            const record = history.find(h => h._id === deletingId);
            if (record) {
              if (record.type === 'virtual-model') {
                await deleteVirtualModel(deletingId, 'virtual-model');
              } else if (record.type === 'try-on') {
                await deleteTryOn(deletingId);
              }
              
              // Reset Control Panel unconditionally when any record is deleted
              setEditingVirtualModelId(null);
              setEditingTryOnId(null);
              setSelectedModelData(null);
              setSelectedModelUri(null);
              setSelectedGarmentData({ single: null, top: null, bottom: null });
              setSelectedGarmentUri({ single: null, top: null, bottom: null });
              setState(prev => ({
                ...prev,
                creatorSettings: {
                  gender: Gender.FEMALE,
                  age: AgeGroup.YOUTH,
                  skinTone: '#EFC194',
                  prompt: ''
                },
                modelImage: null,
                singleGarment: null,
                multipleGarments: [null, null],
                aspectRatio: AspectRatio.PORTRAIT_3_4,
                outputCount: 3
              }));
            }
            setDeletingId(null);
          }}
        />
      )}

      {/* Image Deletion Confirmation Popup */}
      {deletingImageInfo && (
        <DeletionModal
          id={deletingImageInfo.id}
          type="image"
          onClose={() => setDeletingImageInfo(null)}
          onConfirm={async () => {
            if (deletingImageInfo) {
              await removeImageFromRecord(deletingImageInfo.id, deletingImageInfo.type, deletingImageInfo.url);
              setDeletingImageInfo(null);
            }
          }}
        />
      )}

      {/* Image Viewer Popup (Modal) */}
      {viewerImage && (
        <ImageViewerModal
          viewerImage={viewerImage}
          onClose={() => setViewerImage(null)}
          zoom={zoom}
          setZoom={setZoom}
          panOffset={panOffset}
          isDragging={isDragging}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          formatViewerTitle={formatViewerTitle}
          onDownload={downloadImage}
          history={history}
          onSaveToProduct={(url, items, id) => setSaveToProductTarget({ id, imageUrl: url, items })}
          onDeleteImage={(id, type, url) => {
            setDeletingImageInfo({ id, type, url });
            setViewerImage(null);
          }}
        />
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
