import type { Request, Response } from "express";
import mongoose from "mongoose";
import Product from "../models/Product.ts";

const getQueryIds = (ids: string[]) => {
  const queryIds: any[] = [];
  ids.forEach(id => {
    if (id) {
      queryIds.push(id);
      if (mongoose.Types.ObjectId.isValid(id)) {
        queryIds.push(new mongoose.Types.ObjectId(id));
      }
    }
  });
  return queryIds;
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error: error instanceof Error ? error.message : String(error) });
  }
};

export const getProductsByIds = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    const queryIds = getQueryIds(ids || []);
    
    // Finding by either _id or custom id field to be safe
    const products = await Product.find({
      $or: [
        { _id: { $in: queryIds } },
        { id: { $in: queryIds } }
      ]
    } as any);
    res.json(products);
  } catch (error) {
    console.error("Error in getProductsByIds:", error);
    res.status(500).json({ message: "Error fetching products by ids", error: error instanceof Error ? error.message : String(error) });
  }
};

export const syncProductImages = async (req: Request, res: Response) => {
  try {
    const { imageUrl, selectedIds, unselectedIds } = req.body;
    console.log(`Syncing image ${imageUrl} for selected: ${selectedIds}, unselected: ${unselectedIds}`);

    // Handle additions
    if (selectedIds && selectedIds.length > 0) {
      const sIds = getQueryIds(selectedIds);
      const addResult = await Product.updateMany(
        {
          $or: [
            { _id: { $in: sIds } },
            { id: { $in: sIds } }
          ]
        } as any,
        { $addToSet: { image: imageUrl } }
      );
      console.log('Sync Additions Match Count:', addResult.matchedCount);
    }

    // Handle removals
    if (unselectedIds && unselectedIds.length > 0) {
      const uIds = getQueryIds(unselectedIds);
      const removeResult = await Product.updateMany(
        {
          $or: [
            { _id: { $in: uIds } },
            { id: { $in: uIds } }
          ]
        } as any,
        { $pull: { image: imageUrl } }
      );
      console.log('Sync Removals Match Count:', removeResult.matchedCount);
    }

    res.json({ message: "Product images synced successfully" });
  } catch (error) {
    console.error("Error in syncProductImages:", error);
    res.status(500).json({ message: "Error syncing product images", error: error instanceof Error ? error.message : String(error) });
  }
};
