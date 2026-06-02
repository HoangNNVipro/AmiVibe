import React from 'react';
import { ImageData, GarmentCategory } from '../../types';
import { ReUploadIcon, DeleteIcon, UploadIcon } from './Icons';

interface UploadBoxProps {
  garment: ImageData | null;
  label: string;
  aspectRatioClass: string;
  targetType: 'top' | 'bottom' | 'single';
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, target: 'model' | 'top' | 'bottom' | 'single') => void;
  onDelete: (target: 'single' | 'top' | 'bottom', e: React.MouseEvent) => void;
  onCategoryChange?: (cat: GarmentCategory) => void;
  currentCategory?: GarmentCategory;
  isCategoryOpen?: boolean;
  setIsCategoryOpen?: (open: boolean) => void;
  categoryRef?: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const UploadBox: React.FC<UploadBoxProps> = ({
  garment,
  label,
  aspectRatioClass,
  targetType,
  onFileUpload,
  onDelete,
  onCategoryChange,
  currentCategory,
  isCategoryOpen,
  setIsCategoryOpen,
  categoryRef,
  inputRef
}) => {
  return (
    <div className={`relative ${aspectRatioClass} bg-[#111] rounded-xl border border-white/5 flex flex-col items-center justify-center transition-all group overflow-hidden ${!garment ? 'cursor-pointer hover:bg-[#141414]' : ''}`}>
      <input type="file" ref={inputRef} className="hidden" onChange={(e) => onFileUpload(e, targetType)} />
      
      {garment ? (
        <>
          <img src={`data:${garment.mimeType};base64,${garment.base64}`} className="w-full h-full object-contain" />
          
          {targetType === 'single' && onCategoryChange && currentCategory && setIsCategoryOpen && categoryRef && (
            <div className="absolute top-3 right-3 z-20" ref={categoryRef}>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsCategoryOpen(!isCategoryOpen); }}
                className="bg-black/80 hover:bg-black backdrop-blur-md text-[11px] font-bold px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 transition-all"
              >
                {currentCategory}
                <i className={`fa-solid fa-chevron-${isCategoryOpen ? 'up' : 'down'} text-[8px]`}></i>
              </button>
              {isCategoryOpen && (
                <div className="absolute top-full right-0 mt-1 w-32 bg-[#1a1a20] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1">
                  {Object.values(GarmentCategory).map(cat => (
                    <button 
                      key={cat}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCategoryChange(cat);
                        setIsCategoryOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-[11px] font-medium text-left flex items-center justify-between transition-colors hover:bg-white/5 ${currentCategory === cat ? 'text-[#4dff4d]' : 'text-white'}`}
                    >
                      {cat}
                      {currentCategory === cat && <i className="fa-solid fa-check text-[9px]"></i>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
            <div className="bg-black/60 backdrop-blur-md rounded-2xl p-1.5 flex items-center gap-1 border border-white/10 shadow-xl">
              <button onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white active:scale-95"><ReUploadIcon className="w-5 h-5" /></button>
              <button onClick={(e) => onDelete(targetType, e)} className="p-2.5 hover:bg-red-500/40 rounded-xl transition-all text-white active:scale-95"><DeleteIcon className="w-5 h-5" /></button>
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
