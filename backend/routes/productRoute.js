import express from 'express';
import {
  addProduct,
  listProducts,
  removeProduct,
  singleProduct,
  updateProductStock,
  restockProduct,
  updateProduct,
  adminListProducts,
} from '../controllers/productController.js';
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';

const productRouter = express.Router();

productRouter.post('/add', adminAuth, upload.any(), addProduct);
productRouter.get('/list', listProducts);
productRouter.get('/adminlist', adminAuth, adminListProducts);
productRouter.post('/remove',adminAuth, removeProduct);
productRouter.post('/single', singleProduct);
productRouter.post('/update-stock', adminAuth, updateProductStock);
productRouter.post('/restock', adminAuth, restockProduct);
productRouter.post('/update', adminAuth, upload.any(), updateProduct);

export default productRouter;   
