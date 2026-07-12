import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-image';

const buildModelPrompt = (settings: any) => {
  return `Generate a high-quality fashion model image. 
    Gender: ${settings.gender}
    Age group: ${settings.age}
    Skin tone hex: ${settings.skinTone}
    Additional details: Hyper-realistic fashion model photography, strictly ONE single model per image, full body shot from head to toe, perfectly centered composition. Natural standing pose (generate a uniquely different natural pose). Clean empty studio background. Soft and even lighting, high-end e-commerce photography style. Wearing simple solid clothes in neutral colors and appropriate footwear (e.g., simple sneakers, dress shoes, or sandals) that complements the simple outfit, NO logos, NO accessories. Arms resting naturally at sides, hands MUST NOT block, touch, or cover the clothes.${settings.prompt ? `\n    User specific style to integrate: ${settings.prompt}` : ''}
    Ensure the person's features and skin tone strictly match the description.`;
};

const buildTryOnPrompt = (request: any) => {
  const garmentDescriptions = request.clothingItems.map((item: any) => item.category).join(' and ');
  const isDress = request.clothingItems.some(
    (item: any) => (item as any).subCategory?.toLowerCase() === 'dress' || item.category?.toLowerCase() === 'dress'
  );

  return isDress
    ? `Perform a high-fidelity virtual try-on focusing on a one-piece dress.
INPUTS: You are provided with a model image and a dress garment image (${garmentDescriptions}).

CRITICAL INSTRUCTIONS FOR DRESS FITTING:
1. Completely REMOVE and REPLACE the model's existing topwear and bottomwear (shorts/pants). Do NOT overlay or layer the dress on top of the model's original pants or shorts.
2. The model must ONLY wear the newly provided dress. 
3. Since the original model wears short pants, you MUST render bare, natural legs extending from the bottom hem of the dress down to the footwear. There should be absolutely no traces of the old clothes visible underneath or around the dress edges.
4. Seamlessly blend the dress onto the model's body, maintaining perfect body contours, realistic fabric draping, natural folds, proper shadows, and matching the studio's soft lighting.
5. Keep the original model's identity (face, pose, skin tone, hair) and footwear completely intact. Only change the clothing.`
    : `Perform a virtual try-on. 
    Take the provided garments (${garmentDescriptions}) and place them naturally on the person in the model image. 
    The outfit should fit perfectly, following the body contours and lighting of the model. 
    Maintain high realism and fashion photography quality.`;
};

const extractInlineData = (response: any) => {
  const results: string[] = [];
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      results.push(`data:image/png;base64,${part.inlineData.data}`);
    }
  }
  return results;
};

export const generateVirtualModel = async (req: Request, res: Response) => {
  try {
    const { gender, age, skinTone, prompt = '', ratio, count } = req.body;
    const promptText = buildModelPrompt({ gender, age, skinTone, prompt });
    const results: string[] = [];

    for (let i = 0; i < (count || 1); i++) {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: {
          parts: [{ text: promptText }]
        },
        config: {
          imageConfig: {
            aspectRatio: ratio
          }
        }
      });
      results.push(...extractInlineData(response));
    }

    res.json({ results });
  } catch (error: any) {
    console.error('Generate Virtual Model Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate virtual model' });
  }
};

export const processVirtualTryOn = async (req: Request, res: Response) => {
  try {
    const { modelImage, clothingItems, aspectRatio, count } = req.body;
    const promptText = buildTryOnPrompt({ clothingItems });

    const clothingParts = clothingItems.map((item: any) => ({
      inlineData: {
        data: item.image.base64,
        mimeType: item.image.mimeType
      }
    }));

    const modelPart = {
      inlineData: {
        data: modelImage.base64,
        mimeType: modelImage.mimeType
      }
    };

    const results: string[] = [];
    for (let i = 0; i < (count || 1); i++) {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: {
          parts: [modelPart, ...clothingParts, { text: promptText }]
        },
        config: {
          imageConfig: {
            aspectRatio
          }
        }
      });
      results.push(...extractInlineData(response));
    }

    res.json({ results });
  } catch (error: any) {
    console.error('Process Virtual Try-On Error:', error);
    res.status(500).json({ error: error.message || 'Failed to process virtual try-on' });
  }
};
