import userModel from '../models/userModel.js';
import productModel from '../models/productModel.js';

// add products to user cart
const addToCart = async (req, res) => {
  try {
    const { userId, itemId, size } = req.body;

    const userData = await userModel.findById(userId);
    const product = await productModel.findById(itemId);
    const availableStock = product?.stock?.[size]?.remaining || 0;
    let cartData = await userData.cartData;
    const currentQty = cartData?.[itemId]?.[size] || 0;

    if (currentQty + 1 > availableStock) {
      return res.json({ success: false, message: "Not enough stock available" });
    }

    if (cartData[itemId]) {
      if (cartData[itemId][size]) {
        cartData[itemId][size] += 1;
      } else {
        cartData[itemId][size] = 1;
      }
    } else {
      cartData[itemId] = {};
      cartData[itemId][size] = 1;
    }

    await userModel.findByIdAndUpdate(userId, { cartData });

    return res.json({ success: true, message: "Item added to cart" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
}

// update user cart
const updateCart = async (req, res) => {
  try {
    const { userId, itemId, size, quantity } = req.body;

    const userData = await userModel.findById(userId);
    const product = await productModel.findById(itemId);
    const availableStock = product?.stock?.[size]?.remaining || 0;
    let cartData = await userData.cartData;

    if (quantity > availableStock) {
      return res.json({ success: false, message: "Not enough stock available" });
    }

    cartData[itemId][size] = quantity;

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Cart Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

// get user cart
const getUserCart = async (req, res) => {
  try {
    const { userId } = req.body;

    const userData = await userModel.findById(userId);
    let cartData = await userData.cartData;

    res.json({ success: true, cartData });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
}

export { addToCart, updateCart, getUserCart };
