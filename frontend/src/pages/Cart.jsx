import React from 'react'
import { ShopContext } from '../context/ShopContext';
import { useContext, useState, useEffect } from 'react';
import Title from '../components/Title';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';
import { toast } from 'react-toastify';

const Cart = () => {

  const {products, currency, cartItems, updateQuantity, navigate} = useContext(ShopContext);

  const [cartData, setCartData] = useState([]);

  useEffect(() => {

    if (products.length > 0) {
      let tempData = [];
      for (let items in cartItems) {
        for (let item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            tempData.push({
              _id: items,
              size: item,
              quantity: cartItems[items][item],
            })
          }
        }
      }
      setCartData(tempData);
    }
  }, [cartItems, products]);

  return (
    <div className='border-t pt-14 bg-white'>
      <div className='text-2xl mb-6'>
        <Title text1={'YOUR'} text2={'CART'} />
      </div>

      {/* Thêm space-y-4 để tạo khoảng cách đều giữa các thẻ sản phẩm */}
      <div className='space-y-4'>
        {
          cartData.map((item, index) => {

            const productData = products.find((product) => product._id === item._id);
            
            if (!productData) return null;

            return (
              // Bỏ border-t/b cũ, thay bằng dạng Card bo góc (rounded-2xl) với viền nhẹ và hiệu ứng bóng đổ khi hover
              <div key={index} className='p-4 sm:p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4'>
                <div className='flex items-start gap-6'>
                  {/* Bo tròn ảnh sản phẩm (rounded-xl) */}
                  <img src={productData.image[0]} alt="" className='w-16 sm:w-20 rounded-xl object-cover'/>
                  <div>
                    <p className='text-xs sm:text-lg font-medium'>{productData.name}</p>
                    <div className='flex items-center gap-5 mt-2'>
                      <p className='font-semibold'>{currency}{productData.price}</p>
                      {/* Bo góc và làm mềm màu nền của ô size (rounded-md) */}
                      <p className='px-2 sm:px-3 sm:py-1 border border-gray-200 bg-gray-50 rounded-md text-sm'>{item.size}</p>
                    </div>
                  </div>
                </div>
                {/* Bo góc ô input, thêm hiệu ứng viền đen khi focus */}
                <input 
                  type="number" 
                  min={1} 
                  max={productData.stock?.[item.size]?.remaining || 0} 
                  defaultValue={item.quantity}
                  placeholder="1"
                  onChange={(e) => {
                    const val = e.target.value;
                    
                    // Temporarily avoid updating state while the user clears the field or types 0.
                    if (val === '' || val === '0') return; 
                    
                    const num = Number(val);
                    const availableStock = productData.stock?.[item.size]?.remaining || 0;
                    
                    // If input exceeds stock, clamp UI to max and persist that quantity.
                    if (num > availableStock) {
                      toast.error(`Chỉ còn ${availableStock} sản phẩm trong kho`);
                      e.target.value = availableStock; 
                      updateQuantity(item._id, item.size, availableStock);
                    } else {
                      updateQuantity(item._id, item.size, num);
                    }
                  }}
                  onBlur={(e) => {
                    // Safety net: empty or 0 becomes quantity 1 after leaving the field.
                    if (e.target.value === '' || e.target.value === '0') {
                      e.target.value = 1;
                      updateQuantity(item._id, item.size, 1);
                    }
                  }}
                  className='border border-gray-300 rounded-lg max-w-12 sm:max-w-20 px-2 sm:px-3 py-1.5 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-center placeholder:text-gray-300 placeholder:font-light' 
                />
                {/* Thêm hiệu ứng phóng to nhẹ và rõ lên khi trỏ chuột vào icon xóa */}
                <img onClick={()=>updateQuantity(item._id, item.size, 0)} className='w-4 sm:w-5 cursor-pointer opacity-70 hover:opacity-100 hover:scale-110 transition-all duration-200 justify-self-end mr-2 sm:mr-4' src={assets.bin_icon} alt=""/>
              </div>
            )
          })
        }
      </div>

      <div className='flex justify-end my-20'>
        {/* Bọc phần tổng tiền vào một khối bo tròn để đồng bộ thiết kế */}
        <div className='w-full sm:w-[450px] bg-white p-6 rounded-2xl border border-gray-100 shadow-sm'>
          <CartTotal />
          <div className='w-full text-end mt-6'>
            {/* Bo tròn hoàn toàn nút bấm (rounded-full), thêm hiệu ứng nảy khi click (active:scale-95) */}
            <button onClick={()=>navigate('/place-order')} className='bg-black text-white font-medium text-sm px-8 py-3.5 rounded-full hover:bg-gray-800 hover:shadow-lg active:scale-95 transition-all duration-300 w-full sm:w-auto'>
              PROCEED TO CHECKOUT
            </button>
          </div>
        </div>
      </div>
    
    </div>
  )
}

export default Cart
