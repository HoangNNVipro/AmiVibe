
import React from 'react';
import { ImageData } from '../types';

interface ImageUploaderProps {
  label: string;
  icon: string;
  onImageSelect: (data: ImageData) => void;
  maxFiles?: number;
  currentFilesCount?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  label, 
  icon, 
  onImageSelect, 
  maxFiles = 1, 
  currentFilesCount = 0 
}) => {
  const logClientError = async (message: string) => {
    try {
      await fetch('http://localhost:5000/api/v1/client-log/log-client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: message })
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to forward client log:', err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (currentFilesCount >= maxFiles) {
      alert(`Maximum ${maxFiles} image(s) allowed.`);
      return;
    }

    const file = files[0];
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      const errorMsg = `Unsupported file type: ${file.type || file.name}`;
      // eslint-disable-next-line no-console
      console.error('=== CLIENT AVIF/MIME LOG ===');
      // eslint-disable-next-line no-console
      console.error(errorMsg);
      logClientError(errorMsg);
      alert("Please upload JPG or PNG files.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      onImageSelect({
        base64,
        mimeType: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-indigo-500 transition-colors bg-white">
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="text-center">
          <i className={`${icon} text-3xl text-gray-400 mb-2`}></i>
          <p className="text-sm text-gray-500">
            {currentFilesCount < maxFiles ? "Click or drag to upload" : "Limit reached"}
          </p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 10MB</p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
