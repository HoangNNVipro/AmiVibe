import mongoose from 'mongoose';

const TryOnSchema = new mongoose.Schema({
    modelImage: String, // Cloudinary URL
    modelSource: String, // 'virtual' or 'upload'
    garmentMode: String, // 'single' or 'multiple'
    clothingItems: [{
        category: String,
        imageUrl: String, // Cloudinary URL
        productId: String,
        source: String // 'gallery' or 'upload'
    }],
    resultImages: [String], // Cloudinary URLs
    aspectRatio: String,
    outputCount: Number,
    createdAt: { type: Date, default: Date.now }
});

export const TryOn = mongoose.model('TryOn', TryOnSchema);
