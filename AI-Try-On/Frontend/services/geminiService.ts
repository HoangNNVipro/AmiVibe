import { GoogleGenAI } from "@google/genai";
import { AspectRatio, Gender, AgeGroup, TryOnRequest } from "../types";

// Note: In Vite, process.env.GEMINI_API_KEY is replaced during build
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface CreatorSettings {
  gender: Gender;
  age: AgeGroup;
  skinTone: string;
  prompt: string;
}

export const generateVirtualModel = async (settings: CreatorSettings, ratio: AspectRatio, count: number): Promise<string[]> => {
  const prompt = `Generate a high-quality fashion model image. 
    Gender: ${settings.gender}
    Age group: ${settings.age}
    Skin tone hex: ${settings.skinTone}
    Additional details: Hyper-realistic fashion model photography, strictly ONE single model per image, full body shot from head to toe, perfectly centered composition. Natural standing pose (generate a uniquely different natural pose). Clean empty studio background. Soft and even lighting, high-end e-commerce photography style. Wearing simple solid clothes in neutral colors (such as white, black, gray, light brown, or light blue) and appropriate footwear (e.g., simple sneakers, dress shoes, or sandals) that complements the simple outfit, NO logos, NO accessories. Arms resting naturally at sides, hands MUST NOT block, touch, or cover the clothes.${settings.prompt ? `\n    User specific style to integrate: ${settings.prompt}` : ''}
    Ensure the person's features and skin tone strictly match the description.`;

  const results: string[] = [];
  
  // We handle multiple outputs by making multiple calls or using a model that supports it if available
  // Here we'll do one by one for reliability in this implementation
  for (let i = 0; i < count; i++) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: ratio
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        results.push(`data:image/png;base64,${part.inlineData.data}`);
      }
    }
  }

  return results;
};

export const processVirtualTryOn = async (request: TryOnRequest, count: number): Promise<string[]> => {
  const garmentDescriptions = request.clothingItems.map(item => item.category).join(' and ');
  const prompt = `Perform a virtual try-on. 
    Take the provided garments (${garmentDescriptions}) and place them naturally on the person in the model image. 
    The outfit should fit perfectly, following the body contours and lighting of the model. 
    Maintain high realism and fashion photography quality.`;

  const results: string[] = [];
  
  const clothingParts = request.clothingItems.map(item => ({
    inlineData: {
      data: item.image.base64,
      mimeType: item.image.mimeType
    }
  }));

  const modelPart = {
    inlineData: {
      data: request.modelImage.base64,
      mimeType: request.modelImage.mimeType
    }
  };

  for (let i = 0; i < count; i++) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          modelPart,
          ...clothingParts,
          { text: prompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: request.aspectRatio
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        results.push(`data:image/png;base64,${part.inlineData.data}`);
      }
    }
  }

  return results;
};
