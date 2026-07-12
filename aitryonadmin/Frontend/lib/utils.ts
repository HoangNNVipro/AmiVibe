import { ImageData } from '../types';

const trimTrailingSlash = (value: string) => value.replace(/\/+$|^\s+|\s+$/g, '');
const trimLeadingSlash = (value: string) => value.replace(/^\/+/, '');

export const buildApiUrl = (base: string | undefined, path: string) => {
  const normalizedBase = base ? trimTrailingSlash(base) : '';
  const normalizedPath = trimLeadingSlash(path);
  return normalizedBase ? `${normalizedBase}/${normalizedPath}` : `/${normalizedPath}`;
};

export const imageUrlToImageData = async (url: string): Promise<ImageData> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({ base64, mimeType: blob.type, name: 'selected-model' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
