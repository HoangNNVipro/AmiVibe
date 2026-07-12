import React, { useContext, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title'
import axios from 'axios'
import { toast } from 'react-toastify'

const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const { t } = useTranslation();
  const [orderData, setOrderData] = useState([]);
  
  // Trạng thái loading toàn trang (chỉ dùng khi vào trang lần đầu)
  const [loading, setLoading] = useState(false);
  // Trạng thái loading riêng cho từng nút Track Order
  const [trackingOrderId, setTrackingOrderId] = useState(null);

  // Thêm tham số showGlobalLoader để kiểm soát việc có bật màn hình loading to hay không
  const loadOrderData = async (showGlobalLoader = true) => {
    try {
      if (!token) return null;
      if (showGlobalLoader) setLoading(true);
      
      const response = await axios.post(backendUrl + '/api/order/userorders', {}, { headers: { token } });
      if (response.data.success) {
        setOrderData(response.data.orders.reverse());
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      if (showGlobalLoader) setLoading(false);
    }
  }

  // Hàm xử lý riêng khi bấm Track Order
  const trackOrder = async (orderId) => {
    setTrackingOrderId(orderId); // Bật loading riêng cho nút này
    await loadOrderData(false);  // Gọi API lấy dữ liệu ngầm (không chớp trang)
    setTrackingOrderId(null);    // Tắt loading
  }

  useEffect(() => {
    loadOrderData(true);
  }, [token]);

  // Hàm lấy màu sắc cho từng trạng thái đơn hàng
  const getStatusStyle = (status) => {
    switch (status) {
      case "Order Placed":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Packing":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Shipped":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "Out of delivery":
        return "bg-orange-50 text-orange-700 border-orange-100";
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  return (
    <div className='pt-10 sm:pt-16 min-h-screen bg-white'>
      <div className='text-2xl mb-8'>
        <Title text1={t('my')} text2={t('orders')}/>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-500 text-sm font-medium">{t('orders_loading')}</p>
        </div>
      ) : (
        <div className='space-y-6'>
          {orderData.length === 0 ? (
             <div className="text-center py-16 text-gray-500">{t('orders_empty')}</div>
          ) : (
            orderData.map((order, index) => (
              <div key={index} className='bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-100 hover:shadow-md transition-all duration-200 overflow-hidden'>
                
                {/* --- HEADER: Thời gian & Trạng thái (Đã xóa ảnh đại diện và mã đơn) --- */}
                <div className="bg-slate-50/70 px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      {t('orders_time')} 
                      <span className="font-medium text-slate-500">
                        {new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </span>
                  </div>

                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap ${getStatusStyle(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {/* --- BODY: Thông tin Sản phẩm & Thanh toán --- */}
                <div className='p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6'>
                  
                  {/* Cột trái: Danh sách sản phẩm */}
                  <div className='lg:col-span-8 space-y-3'>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      {t('orders_items_ordered')} ({order.items.length})
                    </h4>
                    <div className='divide-y divide-slate-100'>
                      {order.items.map((item, itemIndex) => (
                        <div key={itemIndex} className='py-3 first:pt-0 last:pb-0 flex items-start gap-4 text-sm w-full'>
                          <img src={item.image[0]} alt="" className='w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-100 flex-shrink-0'/>
                          
                          <div className='flex flex-col gap-1 mt-0.5 min-w-0 flex-1'>
                            <p className='text-sm sm:text-base font-semibold text-slate-800 truncate'>{item.name}</p>
                            
                            <div className='flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs sm:text-sm text-slate-600'>
                              <p className='font-bold text-black'>{currency}{item.price}</p>
                              <p>Qty: <strong className='text-slate-800'>{item.quantity}</strong></p>
                              {item.size && (
                                <p className='px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-medium text-[11px]'>Size: {item.size}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cột phải: Thanh toán & Nút bấm */}
                  <div className='lg:col-span-4 bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-100/70 flex flex-col justify-between h-full space-y-4'>
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">{t('orders_order_summary')}</h4>
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-500">{t('orders_total_amount')}</span>
                        <span className="text-lg font-extrabold text-slate-900">
                          {currency}{order.amount.toLocaleString()}
                        </span>
                      </div>

                      <div className="space-y-2 mt-4 text-xs sm:text-sm border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">{t('orders_method')}</span>
                          <span className="font-bold text-slate-700 uppercase bg-white border border-slate-100 shadow-sm px-2 py-0.5 rounded-md text-[11px]">
                            {order.paymentMethod}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">{t('orders_payment')}</span>
                          {order.payment ? (
                            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {t('orders_completed')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> {t('orders_pending')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button 
                        onClick={() => trackOrder(order._id)} 
                        disabled={trackingOrderId === order._id}
                        className='w-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 rounded-xl hover:border-slate-300 hover:bg-slate-50 focus:ring-4 focus:ring-indigo-500/10 active:scale-95 transition-all duration-300 shadow-sm flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait'
                      >
                        {trackingOrderId === order._id ? (
                          <svg className="animate-spin h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                        {trackingOrderId === order._id ? t('orders_tracking') : t('orders_track_order')}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Orders