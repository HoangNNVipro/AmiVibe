import { GoogleGenAI } from "@google/genai";
import {
  TryOnRequest,
  GarmentCategory,
  Gender,
  AgeGroup,
  AspectRatio,
} from "../types";

const generateSingleTryOnImage = async (
  params: TryOnRequest,
  ai: any,
): Promise<string> => {
  const categoryInstructions = params.clothingItems
    .map((item) => {
      if (item.category === GarmentCategory.TOP)
        return "ONLY extract the TOP clothing item (shirt/jacket/blazer) design from the second image.";
      if (item.category === GarmentCategory.BOTTOM)
        return "ONLY extract the BOTTOM clothing item (pants/skirt/shorts) design from the second image.";
      return "ONLY extract the COMPLETE OUTFIT (both top and bottom clothing items) design from the second image.";
    })
    .join(" ");

  const basePrompt = `
TASK: Photorealistic Virtual Try-On (STRICT GARMENT REPLACEMENT)

YOU ARE GIVEN:
- Image A (TARGET MODEL): the person who will wear the garment.
- Image B (GARMENT REFERENCE): the garment design to transfer (ignore any person in B).

PRIMARY GOAL:
Replace the TARGET MODEL's clothing with the GARMENT REFERENCE clothing with ZERO leftovers.

CATEGORY-SPECIFIC INSTRUCTIONS:
${categoryInstructions}

STRICT EDIT SCOPE (LOCK EVERYTHING ELSE):
- Only change pixels belonging to the TARGET MODEL's clothing region that is being replaced.
- Do NOT change: face, hair, makeup, skin tone/texture, body shape, pose, hands/fingers, background, camera angle, composition, lighting direction of the scene.
- Do NOT add/remove accessories unless they are part of the referenced garment itself.

GARMENT EXTRACTION RULES (FROM IMAGE B):
- Extract ONLY the garment(s): exact design, cut, seams, collar, cuffs, waistband, length, logos, prints, patterns, fabric type, texture, color, and fit.
- If B shows a person wearing it: IGNORE the person completely. Do NOT transfer their body, face, hair, hands, skin, or background.
- Preserve garment proportions and details. No redesign.

REPLACEMENT RULES (ON IMAGE A):
- FULL REPLACEMENT: remove the original garment entirely. No original clothing may remain visible (0%).
- Correct body coverage: the new garment MUST cover the same body areas as in B, consistent with the category (TOP/BOTTOM/FULL).
- Natural fit: garment must conform to A's body contours and pose with realistic drape, folds, wrinkles, tension points, and occlusions (arms/hair/objects in front stay in front).
- Match scene lighting/shadows on the garment to A's environment while keeping the rest of the image unchanged.

QUALITY:
- Photorealistic fashion photo quality, sharp textures, natural shadows, no artifacts, no blurry patches.

NEGATIVE (MUST NOT):
- No mixing, blending, or partial overlay of old clothing.
- No new person, no duplicate limbs, no warped anatomy.
- No background changes, no face changes, no body reshaping.
- No text distortions unless it matches the garment print exactly.

OUTPUT:
One realistic image of Image A wearing the complete garment from Image B, with everything else identical to Image A.
  `.trim();

  // Combine base prompt with custom prompt if provided
  const finalPrompt = params.prompt
    ? `${basePrompt}\n\nADDITIONAL CREATIVE INSTRUCTIONS: ${params.prompt}`
    : basePrompt;

  const parts: any[] = [
    {
      inlineData: {
        data: params.modelImage.base64,
        mimeType: params.modelImage.mimeType,
      },
    },
    ...params.clothingItems.map((item) => ({
      inlineData: {
        data: item.image.base64,
        mimeType: item.image.mimeType,
      },
    })),
    { text: finalPrompt },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",

    //    gemini-2.0-flash
    //    gemini-2.5-flash-image --- model cũ
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: params.aspectRatio,
      },
    },
  });

  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("No response from AI model.");
  }

  let resultBase64 = "";
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      resultBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      break;
    }
  }

  if (!resultBase64) {
    throw new Error("AI failed to generate an image part.");
  }

  return resultBase64;
};

export const processVirtualTryOn = async (
  params: TryOnRequest,
  count: number,
): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const promises = Array.from({ length: count }).map(() =>
    generateSingleTryOnImage(params, ai),
  );
  return Promise.all(promises);
};

const generateSingleModelImage = async (
  settings: any,
  aspectRatio: AspectRatio,
  ai: any,
): Promise<string> => {
  const { gender, age, skinTone, prompt: userPrompt } = settings;

  // Map hex color to descriptive name for better AI understanding
  const skinToneDesc =
    skinTone === "#EFC194"
      ? "Fair/Light"
      : skinTone === "#F9E4D4"
        ? "Very Fair/Pale"
        : skinTone === "#B36D3C"
          ? "Tan/Medium"
          : skinTone === "#4A2E19"
            ? "Deep/Dark"
            : "Natural";

  const prompt = `
    Create a high-quality, realistic virtual model image with the following characteristics:
    - Gender: ${gender}
    - Age: ${age}
    - Skin Tone: ${skinToneDesc} (${skinTone})
    
    Image Style: Realistic, studio lighting, professional fashion photography, high quality, sharp details.
    The model should be standing straight with a natural pose. The face must be clear and unobstructed.
    
    Additional user requirements: ${userPrompt || "None"}
    
    Strict rules: No text, no watermarks, no logos on the image. Full body or upper body portrait based on aspect ratio.
  `.trim();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",

    //  gemini-2.0-flash
    //  gemini-2.5-flash-image --- ver cũ
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
      },
    },
  });

  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("No response from AI model.");
  }

  let resultBase64 = "";
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      resultBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      break;
    }
  }

  if (!resultBase64) {
    throw new Error("AI failed to generate an image part.");
  }

  return resultBase64;
};

export const generateVirtualModel = async (
  settings: any,
  aspectRatio: AspectRatio,
  count: number,
): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const promises = Array.from({ length: count }).map(() =>
    generateSingleModelImage(settings, aspectRatio, ai),
  );
  return Promise.all(promises);
};
