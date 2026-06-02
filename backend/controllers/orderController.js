import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import productModel from '../models/productModel.js';



// global variables
// const currency = 'inr'
const currency = 'usd'
const deliveryCharge = 10;
// gateway initialization
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const razorpayInstance = new Razorpay({
  key_id: (process.env.RAZORPAY_KEY_ID || '').trim(),
  key_secret: (process.env.RAZORPAY_KEY_SECRET || '').trim()
});

const deductInventory = async (items) => {
  try {
    for (const item of items) {
      const updateKey = `stock.${item.size}.remaining`;
      await productModel.findByIdAndUpdate(item._id, {
        $inc: { [updateKey]: -item.quantity }
      });
    }
  } catch (error) {
    console.log("Lỗi khi trừ kho:", error);
  }
};

console.log('Razorpay initialized with:');
console.log('KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✓ Set' : '✗ Missing');
console.log('KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✓ Set' : '✗ Missing');
console.log('KEY_ID value:', process.env.RAZORPAY_KEY_ID ? `${process.env.RAZORPAY_KEY_ID.substring(0, 10)}...` : 'N/A');
console.log('KEY_ID length:', process.env.RAZORPAY_KEY_ID?.length || 0);
console.log('KEY_SECRET length:', process.env.RAZORPAY_KEY_SECRET?.length || 0);
console.log('Razorpay instance config:', {
  key_id: razorpayInstance.auth?.username || 'not set',
  key_id_length: razorpayInstance.auth?.username?.length || 0
});

// Placing Orders using COD Method
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    const orderData = {
      userId,
      items,
      amount,
      address,
      paymentMethod: "COD",
      payment: false,
      date: Date.now()
    }

    const newOrder = new orderModel(orderData);
    await newOrder.save();
    await deductInventory(items);

    // Clear user cart after placing order
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    return res.json({ success: true, message: "Order placed successfully" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
}

// Placing Orders using Stripe Method
const placeOrderStripe = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;
    const {origin} = req.headers;
    const orderData = {
      userId,
      items,
      amount,
      address,
      paymentMethod: "Stripe",
      payment: false,
      date: Date.now()
    }
    const newOrder = new orderModel(orderData);
    await newOrder.save();

    const line_items = items.map((item) => ({
      price_data: {
        currency: currency,
        product_data: {
          name: item.name
        },
        unit_amount: item.price * 100
      },
      quantity: item.quantity
    }));
    line_items.push({
      price_data: {
        currency: currency,
        product_data: {
          name: "Delivery Charges"
        },
        unit_amount: deliveryCharge * 100
      },
      quantity: 1
    });

    const session = await stripe.checkout.sessions.create({
      line_items: line_items,
      mode: 'payment',
      success_url: `${origin}/verify?success=true&order_id=${newOrder._id}`,
      cancel_url: `${origin}/verify?success=false&order_id=${newOrder._id}`,
    });
    return res.json({ success: true, session_url: session.url });

  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
}

// Verify Stripe
const verifyStripe = async (req, res) => {

  const {orderId, order_id, success, userId} = req.body;
  const stripeOrderId = orderId || order_id;

  try {
    if (success == "true") {
      const order = await orderModel.findById(stripeOrderId);
      if (!order) {
        return res.json({ success: false, message: "Order not found" });
      }
      if (!order.payment) {
        await orderModel.findByIdAndUpdate(stripeOrderId, { payment: true });
        await deductInventory(order.items);
      }
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
      return res.json({ success: true, message: "Payment successful" });
    } else {
      await orderModel.findByIdAndDelete(stripeOrderId);
      return res.json({ success: false, message: "Payment failed" });
    }
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
}

// Placing Orders using Razorpay Method
const placeOrderRazorpay = async (req, res) => {

  try {

    const { userId, items, amount, address } = req.body;

    const orderData = {
      userId,
      items,
      amount,
      address,
      paymentMethod: "Razorpay",
      payment: false,
      date: Date.now()
    }
    const newOrder = new orderModel(orderData);
    await newOrder.save();

    const options = {
      amount: amount * 100,
      currency: currency.toUpperCase(),
      receipt: newOrder._id.toString()
    }

    console.log('Creating Razorpay order with:', options);
    const order = await razorpayInstance.orders.create(options);
    console.log('Razorpay order created successfully:', order.id);
    return res.json({ success: true, order });

  } catch (error) {
    console.log('Razorpay error details:', error);
    return res.json({ success: false, message: error.message });
  }

}

const verifyRazorpay = async (req, res) => {
  try {
    const { userId, razorpay_order_id } = req.body;

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
    if (orderInfo.status == "paid") {
      const order = await orderModel.findById(orderInfo.receipt);
      await orderModel.findByIdAndUpdate(orderInfo.receipt, { payment: true });
      await deductInventory(order.items);
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
      return res.json({ success: true, message: "Payment successful" });
    } else {
      return res.json({ success: false, message: "Payment failed" });
    }
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
}

// All Orders data for Admin Panel
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});

    return res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
}

// User Orders data for Frontend
const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;

    const orders = await orderModel.find({ userId });

    return res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
}

// Update Order Status from Admin Panel
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const order = await orderModel.findById(orderId);

    if (status === 'Delivered' && !order.payment) {
      await orderModel.findByIdAndUpdate(orderId, { status, payment: true });
    } else {
      await orderModel.findByIdAndUpdate(orderId, { status });
    }

    return res.json({ success: true, message: "Order status updated successfully" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
}

export { placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus, verifyStripe, verifyRazorpay };
