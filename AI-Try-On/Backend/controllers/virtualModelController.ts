import type { Request, Response } from 'express';
import cloudinary from '../config/cloudinary.ts';
import { VirtualModel } from '../models/VirtualModel.ts';

export const saveVirtualModel = async (req: Request, res: Response) => {
    try {
        const { gender, age, skinTone, prompt, ratio, outputCount, resultImages } = req.body;

        console.log("Starting Cloudinary upload for", resultImages.length, "images...");
        const uploadPromises = resultImages.map((base64: string, index: number) => 
            cloudinary.uploader.upload(base64, {
                folder: 'virtual_models',
                resource_type: 'image'
            }).then(result => {
                console.log(`Image ${index} uploaded:`, result.secure_url);
                return result;
            })
        );

        const uploadResults = await Promise.all(uploadPromises);
        const imageUrls = uploadResults.map(result => result.secure_url);
        console.log("All images uploaded successfully to Cloudinary.");

        const newVirtualModel = new VirtualModel({
            gender,
            age,
            skinTone,
            prompt,
            ratio,
            outputCount,
            resultImages: imageUrls
        });

        const savedItem = await newVirtualModel.save();
        console.log("Virtual Model saved to MongoDB with ID:", savedItem._id);
        res.status(201).json(savedItem);
    } catch (error: any) {
        console.error("Save Virtual Model Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const updateVirtualModel = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { gender, age, skinTone, prompt, ratio, outputCount, resultImages } = req.body;

        console.log("Updating Virtual Model:", id);

        // Upload results to Cloudinary
        const uploadPromises = resultImages.map((base64: string, index: number) => {
            // Check if it's already a URL
            if (base64.startsWith('http')) {
                return Promise.resolve({ secure_url: base64 });
            }
            return cloudinary.uploader.upload(base64, {
                folder: 'virtual_models',
                resource_type: 'image'
            }).then(result => {
                console.log(`Image ${index} uploaded:`, result.secure_url);
                return result;
            });
        });

        const uploadResults = await Promise.all(uploadPromises);
        const imageUrls = uploadResults.map(result => result.secure_url);

        const updatedItem = await VirtualModel.findByIdAndUpdate(id, {
            gender,
            age,
            skinTone,
            prompt,
            ratio,
            outputCount,
            resultImages: imageUrls
        }, { new: true });

        if (!updatedItem) {
            return res.status(404).json({ error: "Virtual Model not found" });
        }

        console.log("Virtual Model updated successfully in MongoDB");
        res.json(updatedItem);
    } catch (error: any) {
        console.error("Update Virtual Model Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const removeImageFromVirtualModel = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { imageUrl } = req.body;

        console.log("Removing image from Virtual Model:", id, imageUrl);

        const updatedItem = await VirtualModel.findByIdAndUpdate(id, {
            $pull: { resultImages: imageUrl }
        }, { new: true });

        if (!updatedItem) {
            return res.status(404).json({ error: "Virtual Model not found" });
        }

        console.log("Image removed successfully from MongoDB");
        res.json(updatedItem);
    } catch (error: any) {
        console.error("Remove Image Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const deleteVirtualModel = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log("Deleting Virtual Model:", id);
        
        const deletedItem = await VirtualModel.findByIdAndDelete(id);
        
        if (!deletedItem) {
            return res.status(404).json({ error: "Virtual Model not found" });
        }

        console.log("Virtual Model deleted successfully from MongoDB");
        res.json({ message: "Deleted successfully" });
    } catch (error: any) {
        console.error("Delete Virtual Model Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getVirtualModels = async (req: Request, res: Response) => {
    try {
        const items = await VirtualModel.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
