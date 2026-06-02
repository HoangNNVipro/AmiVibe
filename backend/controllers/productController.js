import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js';

const parseArrayField = (value, fieldName) => {
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`${fieldName} phải là mảng và có ít nhất 1 phần tử`);
  }
  return parsed;
};

const parseStockField = (value) => {
  if (!value) return {};

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Dữ liệu tồn kho (stock) không hợp lệ");
    }
    return parsed;
  } catch {
    throw new Error("Dữ liệu tồn kho (stock) không hợp lệ");
  }
};

// function to add product
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      stock,
      seasons,
      styles,
      colors,
      materials,
      fit,
      occasions,
      bestseller,
      inStock,
    } = req.body;

    const imageFiles = (req.files || [])
      .filter((file) => /^image\d+$/.test(file.fieldname))
      .sort(
        (a, b) =>
          Number(a.fieldname.replace("image", "")) -
          Number(b.fieldname.replace("image", ""))
      );

    if (imageFiles.length === 0) {
      return res.json({
        success: false,
        message: "Vui lòng tải lên ít nhất 1 hình ảnh sản phẩm",
      });
    }

    if (!fit) {
      return res.json({
        success: false,
        message: "Vui lòng chọn phom dáng sản phẩm",
      });
    }

    const imagesUrl = await Promise.all(
      imageFiles.map(async (item) => {
        const result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    const productData = {
      name,
      description,
      category,
      price: Number(price),
      subCategory,
      bestseller: bestseller === "true" || bestseller === true,
      sizes: parseArrayField(sizes, "sizes"),
      stock: parseStockField(stock),
      seasons: parseArrayField(seasons, "seasons"),
      styles: parseArrayField(styles, "styles"),
      colors: parseArrayField(colors, "colors"),
      materials: parseArrayField(materials, "materials"),
      fit,
      occasions: parseArrayField(occasions, "occasions"),
      image: imagesUrl,
      inStock:
        inStock === undefined || inStock === null
          ? true
          : inStock === "true" || inStock === true,
      date: Date.now(),
    };

    console.log(productData);

    const product = new productModel(productData);

    await product.save();

    return res.json({ success: true, message: "Product added successfully" });
  
    } catch (error) {

        console.log(error);
        return res.json({ success: false, message: error.message });
    
    }
}

// function for list products
const listProducts = async (req, res) => {
  try {
    // Lọc ngay từ database: inStock là true HOẶC trường inStock không tồn tại
    const products = await productModel.find({
      $or: [
        { inStock: true },
        { inStock: { $exists: false } }
      ]
    }).lean();

    // Vì database chỉ trả về các sản phẩm thỏa mãn điều kiện trên,
    // ta chỉ cần map để gán cứng thuộc tính inStock: true cho những sản phẩm chưa có trường này (để frontend đồng nhất dữ liệu)
    const normalized = products.map((p) => ({
      ...p,
      inStock: p.inStock ?? true, 
    }));

    res.json({ success: true, products: normalized });
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// function for admin list products
const adminListProducts = async (req, res) => {
  try {
    const products = await productModel.find({}).lean();
    const normalized = products.map((p) => ({
      ...p,
      inStock: p.inStock ?? true,
    }));
    res.json({ success: true, products: normalized });
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// function for removing product
const removeProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Product Removed" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// function to single product info
const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId);
    res.json({ success: true, product })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Cập nhật trạng thái còn hàng / hết hàng
const updateProductStock = async (req, res) => {
  try {
    const { id, inStock } = req.body;
    if (!id || typeof inStock !== "boolean") {
      return res.json({
        success: false,
        message: "Thiếu id hoặc inStock không hợp lệ",
      });
    }
    const updated = await productModel.findByIdAndUpdate(
      id,
      { inStock },
      { new: true }
    );
    if (!updated) {
      return res.json({ success: false, message: "Không tìm thấy sản phẩm" });
    }
    return res.json({ success: true, message: "Đã cập nhật trạng thái kho", product: updated });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Restock (Add to Inventory)
const restockProduct = async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;

    if (!productId || !size || !quantity || isNaN(quantity) || quantity <= 0) {
      return res.json({ success: false, message: "Invalid restock data provided" });
    }

    const updateKeyTotal = `stock.${size}.total`;
    const updateKeyRemaining = `stock.${size}.remaining`;

    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      { 
        $inc: { 
          [updateKeyTotal]: quantity, 
          [updateKeyRemaining]: quantity 
        } 
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Restocked successfully", product: updatedProduct });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Cập nhật toàn bộ thông tin sản phẩm (hỗ trợ giữ URL ảnh cũ + ảnh mới upload)
const updateProduct = async (req, res) => {
  try {
    const {
      productId,
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      stock,
      seasons,
      styles,
      colors,
      materials,
      fit,
      occasions,
      bestseller,
      inStock,
      existingImageUrls,
      imagePlan,
    } = req.body;

    if (!productId) {
      return res.json({ success: false, message: "Thiếu productId" });
    }

    const existing = await productModel.findById(productId);
    if (!existing) {
      return res.json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    if (!fit) {
      return res.json({
        success: false,
        message: "Vui lòng chọn phom dáng sản phẩm",
      });
    }

    const imageFiles = (req.files || [])
      .filter((file) => /^image\d+$/.test(file.fieldname))
      .sort(
        (a, b) =>
          Number(a.fieldname.replace("image", "")) -
          Number(b.fieldname.replace("image", ""))
      );

    const newUrls = await Promise.all(
      imageFiles.map(async (item) => {
        const result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    let parsedExisting = [];
    if (existingImageUrls) {
      try {
        parsedExisting = JSON.parse(existingImageUrls);
      } catch {
        parsedExisting = [];
      }
    }

    let finalImages = [];
    if (imagePlan) {
      try {
        const plan = JSON.parse(imagePlan);
        finalImages = plan
          .map((token) => {
            const [type, idxStr] = String(token).split(":");
            const idx = Number(idxStr);
            if (type === "e" && parsedExisting[idx]) return parsedExisting[idx];
            if (type === "n" && newUrls[idx] !== undefined) return newUrls[idx];
            return null;
          })
          .filter(Boolean);
      } catch {
        finalImages = [...parsedExisting, ...newUrls];
      }
    } else {
      finalImages = [...parsedExisting, ...newUrls];
    }

    if (finalImages.length === 0) {
      return res.json({
        success: false,
        message: "Vui lòng có ít nhất 1 hình ảnh sản phẩm",
      });
    }

    const updatePayload = {
      name,
      description,
      category,
      subCategory,
      price: Number(price),
      bestseller: bestseller === "true" || bestseller === true,
      inStock:
        inStock === undefined || inStock === null
          ? existing.inStock ?? true
          : inStock === "true" || inStock === true,
      sizes: parseArrayField(sizes, "sizes"),
      stock: parseStockField(stock),
      seasons: parseArrayField(seasons, "seasons"),
      styles: parseArrayField(styles, "styles"),
      colors: parseArrayField(colors, "colors"),
      materials: parseArrayField(materials, "materials"),
      fit,
      occasions: parseArrayField(occasions, "occasions"),
      image: finalImages,
    };

    const updated = await productModel.findByIdAndUpdate(
      productId,
      updatePayload,
      { new: true }
    );

    return res.json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      product: updated,
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

export {
  addProduct,
  listProducts,
  adminListProducts,
  removeProduct,
  singleProduct,
  updateProductStock,
  restockProduct,
  updateProduct,
};
