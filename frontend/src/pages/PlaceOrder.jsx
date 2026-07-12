import React from "react";
import { useTranslation } from 'react-i18next';
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import { useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const PlaceOrder = () => {
  const [method, setMethod] = useState("cod");
  const { t } = useTranslation();
  const {
    navigate,
    backendUrl,
    token,
    cartItems,
    setCartItems,
    getCartAmount,
    delivery_fee,
    products,
  } = useContext(ShopContext);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setFormData((data) => ({ ...data, [name]: value }));
  };

  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Order Payment',
      description: 'Order Payment for AmiVibe',
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        console.log(response);
        try{

          const {data} = await axios.post(backendUrl + '/api/order/verifyRazorpay', response, { headers: {token} });
          if (data.success) {
            setCartItems({});
            navigate('/orders');
          } else {
            console.log(error);
            toast.error(error.message);
          }

        } catch (error) {
          console.log(error);
          toast.error(error.message);
        }
      }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      let orderItems = [];

      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            const itemInfo = structuredClone(
              products.find((product) => product._id === items)
            );
            if (itemInfo) {
              itemInfo.size = item;
              itemInfo.quantity = cartItems[items][item];
              orderItems.push(itemInfo);
            }
          }
        }
      }

      let orderData = {
        address: formData,
        items: orderItems,
        amount: getCartAmount() + delivery_fee
      }

      switch (method) {
        // API Calls for COD
        case 'cod':
          const response = await axios.post(backendUrl + '/api/order/place', orderData, { headers: {token} });
          
          if (response.data.success) {
            setCartItems({});
            navigate('/orders');
          } else {
            toast.error(response.data.message);
          }
          break;

        case 'stripe':
          const responseStripe = await axios.post(backendUrl + '/api/order/stripe', orderData, { headers: {token} });
          if (responseStripe.data.success) {
            const { session_url } = responseStripe.data;
            window.location.replace(session_url);
          } else {
            toast.error(responseStripe.data.message);
          }
          break;

        case 'razorpay':

          const responseRazorpay = await axios.post(backendUrl + '/api/order/razorpay', orderData, { headers: {token} });
          if (responseRazorpay.data.success) {
            initPay(responseRazorpay.data.order);
          }
          break;

        default:
          toast.error(t('invalid_payment_method'));
          break;
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t bg-white"
    >
      {/*---------------- Left Side ----------------*/}
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1={t('delivery')} text2={t('information')} />
        </div>
        <div className="flex gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="firstName"
            value={formData.firstName}
            className="border border-gray-300 rounded-lg py-2 px-3.5 w-full outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
            type="text"
            placeholder={t('first_name_placeholder')}
          />
          <input
            required
            onChange={onChangeHandler}
            name="lastName"
            value={formData.lastName}
            className="border border-gray-300 rounded-lg py-2 px-3.5 w-full outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
            type="text"
            placeholder={t('last_name_placeholder')}
          />
        </div>
        <input
          required
          onChange={onChangeHandler}
          name="email"
          value={formData.email}
          className="border border-gray-300 rounded-lg py-2 px-3.5 w-full outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
          type="mail"
          placeholder={t('email_address_placeholder')}
        />
        <input
          required
          onChange={onChangeHandler}
          name="street"
          value={formData.street}
          className="border border-gray-300 rounded-lg py-2 px-3.5 w-full outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
          type="text"
          placeholder={t('street_placeholder')}
        />
        <div className="flex gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="city"
            value={formData.city}
            className="border border-gray-300 rounded-lg py-2 px-3.5 w-full outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
            type="text"
            placeholder={t('city_placeholder')}
          />
          <input
            onChange={onChangeHandler}
            name="state"
            value={formData.state}
            className="border border-gray-300 rounded-lg py-2 px-3.5 w-full outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
            type="text"
            placeholder={t('state_placeholder')}
          />
        </div>
        <div className="flex gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="zipcode"
            value={formData.zipcode}
            className="border border-gray-300 rounded-lg py-2 px-3.5 w-full outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
            type="number"
            placeholder={t('zipcode_placeholder')}
          />
          <input
            required
            onChange={onChangeHandler}
            name="country"
            value={formData.country}
            className="border border-gray-300 rounded-lg py-2 px-3.5 w-full outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
            type="text"
            placeholder={t('country_placeholder')}
          />
        </div>
        <input
          required
          onChange={onChangeHandler}
          name="phone"
          value={formData.phone}
          className="border border-gray-300 rounded-lg py-2 px-3.5 w-full outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
          type="number"
          placeholder={t('phone_placeholder')}
        />
      </div>

      {/*---------------- Right Side ----------------*/}
      <div className="mt-8">
        <div className="mt-8 min-w-80 bg-white sm:p-5 sm:rounded-2xl sm:border sm:border-gray-100 sm:shadow-sm">
          <CartTotal />
        </div>

        <div className="mt-12">
          <Title text1={t('payment')} text2={t('method')} />
          {/* --- Payment Method Selection --- */}
          {/* Đã trả về đúng cấu trúc gap-3 flex-col lg:flex-row của bạn để nút tự co giãn, không ép w-full */}
          <div className="flex gap-3 flex-col lg:flex-row">
            <div
              onClick={() => setMethod("stripe")}
              className={`flex items-center gap-3 border p-2 px-3 cursor-pointer rounded-xl transition-all duration-200 ${
                method === "stripe" ? "border-black bg-gray-50 shadow-sm" : "hover:bg-gray-50 border-gray-200"
              }`}
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full transition-all ${
                  method === "stripe" ? "bg-green-500 border-green-500" : "border-gray-300"
                }`}
              ></p>
              <img className="h-5 mx-4" src={assets.stripe_logo} alt="" />
            </div>

            <div
              onClick={() => setMethod("razorpay")}
              className={`flex items-center gap-3 border p-2 px-3 cursor-pointer rounded-xl transition-all duration-200 ${
                method === "razorpay" ? "border-black bg-gray-50 shadow-sm" : "hover:bg-gray-50 border-gray-200"
              }`}
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full transition-all ${
                  method === "razorpay" ? "bg-green-500 border-green-500" : "border-gray-300"
                }`}
              ></p>
              <img className="h-5 mx-4" src={assets.razorpay_logo} alt="" />
            </div>

            <div
              onClick={() => setMethod("cod")}
              className={`flex items-center gap-3 border p-2 px-3 cursor-pointer rounded-xl transition-all duration-200 ${
                method === "cod" ? "border-black bg-gray-50 shadow-sm" : "hover:bg-gray-50 border-gray-200"
              }`}
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full transition-all ${
                  method === "cod" ? "bg-green-500 border-green-500" : "border-gray-300"
                }`}
              ></p>
              <p className="text-gray-600 text-sm font-medium mx-4">
                {t('cash_on_delivery')}
              </p>
            </div>
          </div>

          <div className="w-full text-end mt-8">
            <button
              type="submit"
              className="bg-black text-white px-16 py-3 text-sm font-medium rounded-full hover:bg-gray-800 hover:shadow-lg active:scale-95 transition-all duration-300"
            >
              {t('place_order')}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;