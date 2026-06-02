import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary.ts';
import { TryOn } from '../models/TryOn.ts';

export const saveTryOn = async (req: Request, res: Response) => {
    try {
        const { modelImage, modelSource, garmentMode, clothingItems, resultImages, aspectRatio, outputCount } = req.body;

        // Upload model image if it's base64
        let modelImageUrl = modelImage;
        if (modelImage && typeof modelImage === 'string' && modelImage.startsWith('data:')) {
            console.log("Detected base64 model image, uploading to Cloudinary...");
            try {
                const upload = await cloudinary.uploader.upload(modelImage, {
                    folder: 'try_ons/models',
                    resource_type: 'image'
                });
                modelImageUrl = upload.secure_url;
                console.log("Model image uploaded successfully:", modelImageUrl);
            } catch (uploadError) {
                console.error("Cloudinary Model Upload Error:", uploadError);
                throw new Error("Failed to upload model image to Cloudinary");
            }
        }

        // Upload clothing item images if they are base64
        console.log("Processing clothing items for potential base64 uploads...");
        const clothingItemsWithUrls = await Promise.all(clothingItems.map(async (item: any, index: number) => {
            let itemUrl = item.imageUrl;
            if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.startsWith('data:')) {
                console.log(`Detected base64 clothing item at index ${index}, uploading...`);
                try {
                    const upload = await cloudinary.uploader.upload(item.imageUrl, {
                        folder: 'try_ons/clothing',
                        resource_type: 'image'
                    });
                    itemUrl = upload.secure_url;
                    console.log(`Clothing item ${index} uploaded successfully:`, itemUrl);
                } catch (uploadError) {
                    console.error(`Cloudinary Clothing Upload Error at index ${index}:`, uploadError);
                    throw new Error(`Failed to upload clothing item ${index} to Cloudinary`);
                }
            }
            return { category: item.category, imageUrl: itemUrl, productId: item.productId, source: item.source };
        }));

        // Upload resulting images from Gemini
        console.log("Uploading result images to Cloudinary...");
        const resultUploadPromises = resultImages.map((base64: string, index: number) => 
            cloudinary.uploader.upload(base64, {
                folder: 'try_ons/results',
                resource_type: 'image'
            }).then(result => {
                console.log(`Result image ${index} uploaded:`, result.secure_url);
                return result;
            })
        );

        const resultUploads = await Promise.all(resultUploadPromises);
        const resultUrls = resultUploads.map(result => result.secure_url);

        const newTryOn = new TryOn({
            modelImage: modelImageUrl,
            modelSource,
            garmentMode,
            clothingItems: clothingItemsWithUrls,
            resultImages: resultUrls,
            aspectRatio,
            outputCount
        });

        const savedItem = await newTryOn.save();
        console.log("Try-On saved to MongoDB with ID:", savedItem._id);
        res.status(201).json(savedItem);
    } catch (error: any) {
        console.error("Save TryOn Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const updateTryOn = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { modelImage, modelSource, garmentMode, clothingItems, resultImages, aspectRatio, outputCount } = req.body;

        const existingTryOn = await TryOn.findById(id);
        if (!existingTryOn) {
            return res.status(404).json({ error: "Try-On record not found" });
        }

        // Handle model image
        let modelImageUrl = modelImage;
        if (modelImage && typeof modelImage === 'string' && modelImage.startsWith('data:')) {
            console.log("Detected base64 model image in Update, uploading to Cloudinary...");
            try {
                const upload = await cloudinary.uploader.upload(modelImage, {
                    folder: 'try_ons/models',
                    resource_type: 'image'
                });
                modelImageUrl = upload.secure_url;
                console.log("Model image updated and uploaded:", modelImageUrl);
            } catch (uploadError) {
                console.error("Cloudinary Model Update Error:", uploadError);
                throw new Error("Failed to upload updated model image to Cloudinary");
            }
        }

        // Handle clothing items
        console.log("Processing clothing items for potential base64 uploads in Update...");
        const clothingItemsWithUrls = await Promise.all(clothingItems.map(async (item: any, index: number) => {
            let itemUrl = item.imageUrl;
            if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.startsWith('data:')) {
                console.log(`Detected base64 clothing item at index ${index} in Update, uploading...`);
                try {
                    const upload = await cloudinary.uploader.upload(item.imageUrl, {
                        folder: 'try_ons/clothing',
                        resource_type: 'image'
                    });
                    itemUrl = upload.secure_url;
                    console.log(`Clothing item ${index} updated and uploaded:`, itemUrl);
                } catch (uploadError) {
                    console.error(`Cloudinary Clothing Update Error at index ${index}:`, uploadError);
                    throw new Error(`Failed to upload updated clothing item ${index} to Cloudinary`);
                }
            }
            return { category: item.category, imageUrl: itemUrl, productId: item.productId, source: item.source };
        }));

        // Handle result images (usually these are all new from Gemini in the edit flow)
        let resultUrls = resultImages;
        if (resultImages && resultImages.length > 0 && resultImages[0].startsWith('data:')) {
            console.log("Uploading new result images to Cloudinary...");
            const resultUploadPromises = resultImages.map((base64: string) => 
                cloudinary.uploader.upload(base64, {
                    folder: 'try_ons/results',
                    resource_type: 'image'
                }).then(result => result.secure_url)
            );
            resultUrls = await Promise.all(resultUploadPromises);
        }

        const updatedTryOn = await TryOn.findByIdAndUpdate(
            id,
            {
                modelImage: modelImageUrl,
                modelSource,
                garmentMode,
                clothingItems: clothingItemsWithUrls,
                resultImages: resultUrls,
                aspectRatio,
                outputCount
            },
            { new: true }
        );

        res.json(updatedTryOn);
    } catch (error: any) {
        console.error("Update TryOn Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const deleteTryOn = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedItem = await TryOn.findByIdAndDelete(id);
        if (!deletedItem) {
            return res.status(404).json({ error: "Try-On record not found" });
        }
        res.json({ message: "Try-On record deleted successfully" });
    } catch (error: any) {
        console.error("Delete TryOn Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const removeImageFromTryOn = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { imageUrl } = req.body;

        const updatedItem = await TryOn.findByIdAndUpdate(
            id,
            { $pull: { resultImages: imageUrl } },
            { new: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ error: "Try-On record not found" });
        }

        res.json(updatedItem);
    } catch (error: any) {
        console.error("Remove Image TryOn Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getTryOns = async (req: Request, res: Response) => {
    try {
        const items = await TryOn.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
