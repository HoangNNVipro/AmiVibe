/// <reference types="vite/client" />
import { AspectRatio, Gender, AgeGroup, TryOnRequest } from "../types";
import { buildApiUrl } from "../lib/utils";

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

export interface CreatorSettings {
  gender: Gender;
  age: AgeGroup;
  skinTone: string;
  prompt: string;
}

export const generateVirtualModel = async (settings: CreatorSettings, ratio: AspectRatio, count: number): Promise<string[]> => {
  const response = await fetch(buildApiUrl(API_BASE, '/api/ai/generate-model'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gender: settings.gender,
      age: settings.age,
      skinTone: settings.skinTone,
      prompt: settings.prompt,
      ratio,
      count
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate virtual model');
  }

  return data.results || [];
};

export const processVirtualTryOn = async (request: TryOnRequest, count: number): Promise<string[]> => {
  const response = await fetch(buildApiUrl(API_BASE, '/api/ai/process-try-on'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelImage: request.modelImage,
      clothingItems: request.clothingItems,
      aspectRatio: request.aspectRatio,
      count
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to process virtual try-on');
  }

  return data.results || [];
};
