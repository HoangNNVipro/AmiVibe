
// Style presets for the virtual try-on experience
export enum StylePreset {
  REALISTIC = "realistic",
  CINEMATIC = "cinematic",
  STUDIO = "studio",
  VINTAGE = "vintage",
  CUSTOM = "custom"
}

// Aspect ratios supported by gemini-2.5-flash-image and gemini-3-pro-image-preview
export enum AspectRatio {
  SQUARE = "1:1",
  PORTRAIT_3_4 = "3:4",
  PORTRAIT_2_3 = "2:3",
  STORY = "9:16",
  LANDSCAPE_4_3 = "4:3",
  LANDSCAPE_16_9 = "16:9"
}

export enum GarmentCategory {
  TOP = "Top",
  BOTTOM = "Bottom",
  DRESS_SUIT = "All fit"
}

export enum Gender {
  MALE = "Male",
  FEMALE = "Female"
}

export enum AgeGroup {
  CHILDREN = "Children",
  YOUTH = "Youth",
  ELDERLY = "Elderly"
}

export interface ImageData {
  base64: string;
  mimeType: string;
  name: string;
  originalMimeType?: string;
  convertedFromAvif?: boolean;
}

export interface ClothingItem {
  image: ImageData;
  category: GarmentCategory;
}

export interface TryOnRequest {
  modelImage: ImageData;
  clothingItems: ClothingItem[];
  aspectRatio: AspectRatio;
  prompt?: string;
}

export type MainTab = 'virtual-model' | 'try-on';

export interface AppState {
  mainTab: MainTab;
  // Model Creator state
  creatorSettings: {
    gender: Gender;
    age: AgeGroup;
    skinTone: string;
    prompt: string;
  };
  modelImage: ImageData | null;
  clothingImages: ImageData[];
  singleGarment: ImageData | null;
  singleGarmentCategory: GarmentCategory;
  multipleGarments: (ImageData | null)[];
  aspectRatio: AspectRatio;
  outputCount: number;
  isProcessing: boolean;
  resultImages: string[];
  error: string | null;
}
