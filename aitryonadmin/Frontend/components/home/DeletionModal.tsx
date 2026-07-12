import React from 'react';

interface DeletionModalProps {
  id: string | null;
  onClose: () => void;
  onConfirm: () => void;
  type: 'try-on' | 'virtual-model' | 'image';
}

export const DeletionModal: React.FC<DeletionModalProps> = ({
  id,
  onClose,
  onConfirm,
  type
}) => {
  if (!id && type !== 'image') return null;

  const getTitle = () => {
    if (type === 'try-on') return 'Delete Try On?';
    if (type === 'virtual-model') return 'Delete Model?';
    return 'Delete this image?';
  };

  const getDescription = () => {
    if (type === 'try-on') return 'Are you sure you want to delete this recorded try on? This action cannot be undone.';
    if (type === 'virtual-model') return 'Are you sure you want to delete this recorded model? This action cannot be undone.';
    return 'Are you sure you want to remove this specific image from the record?';
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 text-red-500">
          <i className={`fa-solid ${type === 'image' ? 'fa-image-slash' : 'fa-trash-can'} text-2xl`}></i>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{getTitle()}</h3>
        <p className="text-white/50 text-sm mb-8 leading-relaxed">{getDescription()}</p>
        <div className="flex gap-3 w-full">
          <button 
            onClick={onClose}
            className="flex-1 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all"
          >
            No, Keep it
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};
