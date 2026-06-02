import express from "express";
import { saveVirtualModel, getVirtualModels, updateVirtualModel, deleteVirtualModel, removeImageFromVirtualModel } from "../controllers/virtualModelController.ts";
import { saveTryOn, getTryOns, updateTryOn, deleteTryOn, removeImageFromTryOn } from "../controllers/tryOnController.ts";
import { getProducts, getProductsByIds, syncProductImages } from "../controllers/productController.ts";

const router = express.Router();

// Mock health check
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Product Routes
router.get("/products", getProducts);
router.post("/products/fetch-by-ids", getProductsByIds);
router.post("/products/sync-images", syncProductImages);

// Virtual Model Routes
router.get("/virtual-models", getVirtualModels);
router.post("/virtual-models", saveVirtualModel);
router.put("/virtual-models/:id", updateVirtualModel);
router.delete("/virtual-models/:id", deleteVirtualModel);
router.patch("/virtual-models/:id/remove-image", removeImageFromVirtualModel);

// Try-On Routes
router.get("/try-ons", getTryOns);
router.post("/try-ons", saveTryOn);
router.put("/try-ons/:id", updateTryOn);
router.delete("/try-ons/:id", deleteTryOn);
router.patch("/try-ons/:id/remove-image", removeImageFromTryOn);

export default router;
