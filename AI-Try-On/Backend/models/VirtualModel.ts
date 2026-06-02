import mongoose from 'mongoose';

const VirtualModelSchema = new mongoose.Schema({
    gender: String,
    age: String,
    skinTone: String,
    prompt: String,
    ratio: String,
    outputCount: Number,
    resultImages: [String], // Cloudinary URLs
    createdAt: { type: Date, default: Date.now }
});

export const VirtualModel = mongoose.model('VirtualModel', VirtualModelSchema);
