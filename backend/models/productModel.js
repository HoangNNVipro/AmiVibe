import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: Array, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  sizes: { type: Array, required: true },
  // Cấu trúc: { "SizeName": { total: Number, remaining: Number } }. Ví dụ: { "M": { total: 100, remaining: 100 } }
  stock: { type: Object, required: true, default: {} },
  seasons: { type: Array, required: true },
  styles: { type: Array, required: true },
  colors: { type: Array, required: true },
  materials: { type: Array, required: true },
  fit: { type: String, required: true },
  occasions: { type: Array, required: true },
  bestseller: { type: Boolean },
  inStock: { type: Boolean, required: true, default: true },
  date: { type: Number, required: true }
})

const productModel = mongoose.models.product || mongoose.model("product", productSchema)

export default productModel;
