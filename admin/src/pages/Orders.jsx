import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl, currency } from "../App";
import { assets } from "../assets/assets";


const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false); 
  
  // Advanced search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date-desc");

  // Manage custom dropdown open/close states
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Auto-close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".custom-dropdown-container")) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch actual order data from API
  const fetchAllOrders = async () => {
    if (!token) {
      return null;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        backendUrl + "/api/order/list",
        {},
        { headers: { token } }
      );
      
      if (response.data.success) {
        const fetchedOrders = response.data.orders || [];
        setOrders([...fetchedOrders].reverse());
      } else {
        toast.error(response.data.message || "Failed to fetch order list.");
      }
    } catch (error) {
      console.error("API Connection Error:", error);
      toast.error(error.message || "Server connection error");
    } finally {
      setLoading(false);
    }
  };

  // Update order processing status
  const statusHandler = async (orderId, newStatus) => {
    setActiveDropdown(null); // Close dropdown menu after selection
    
    try {
      const response = await axios.post(
        backendUrl + "/api/order/status", 
        { orderId, status: newStatus }, 
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Status updated successfully!");
        await fetchAllOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(error.response?.data?.message || error.message || "Update operation failed");
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllOrders();
    }
  }, [token]);

  // Quick stats calculations
  const stats = useMemo(() => {
    const total = orders.length;
    const revenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
    const pendingPayment = orders.filter(order => !order.payment).length;
    const delivered = orders.filter(order => order.status === "Delivered").length;

    return { total, revenue, pendingPayment, delivered };
  }, [orders]);

  // Optimal data filtering via useMemo
  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    // 1. Search by Keyword
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => {
        const fullName = `${order.address?.firstName || ""} ${order.address?.lastName || ""}`.toLowerCase();
        const phone = (order.address?.phone || "").toLowerCase();
        const orderId = (order._id || "").toLowerCase();
        const hasItem = order.items?.some(item => (item.name || "").toLowerCase().includes(term));

        return fullName.includes(term) || phone.includes(term) || orderId.includes(term) || hasItem;
      });
    }

    // 2. Filter by Processing Status
    if (statusFilter !== "All") {
      result = result.filter(order => order.status === statusFilter);
    }

    // 3. Filter by Payment Status
    if (paymentFilter !== "All") {
      if (paymentFilter === "Paid") {
        result = result.filter(order => order.payment === true);
      } else if (paymentFilter === "Pending") {
        result = result.filter(order => order.payment === false);
      } else if (paymentFilter === "COD") {
        result = result.filter(order => order.paymentMethod === "COD");
      }
    }

    // 4. Sort Order
    result.sort((a, b) => {
      if (sortBy === "date-desc") return (b.date || 0) - (a.date || 0);
      if (sortBy === "date-asc") return (a.date || 0) - (b.date || 0);
      if (sortBy === "amount-desc") return (b.amount || 0) - (a.amount || 0);
      if (sortBy === "amount-asc") return (a.amount || 0) - (b.amount || 0);
      return 0;
    });

    return result;
  }, [orders, searchTerm, statusFilter, paymentFilter, sortBy]);

  // Display text for processing status filter
  const statusFilterOptions = {
    "All": "Status: All",
    "Order Placed": "Order Placed",
    "Packing": "Packing",
    "Shipped": "Shipped",
    "Out of delivery": "Out of delivery",
    "Delivered": "Delivered"
  };

  // Display text for changing order status
  const orderStatusLabels = {
    "Order Placed": "Order Placed",
    "Packing": "Packing",
    "Shipped": "Shipped",
    "Out of delivery": "Out for delivery",
    "Delivered": "Delivered"
  };

  // Display text for payment filter
  const paymentFilterOptions = {
    "All": "Payment: All",
    "Paid": "Paid Only",
    "Pending": "Pending Only",
    "COD": "Cash on Delivery (COD)"
  };

  // Sorting order options
  const sortByOptions = {
    "date-desc": "Newest First",
    "date-asc": "Oldest First",
    "amount-desc": "Highest Amount",
    "amount-asc": "Lowest Amount"
  };

  // Order status badge colors
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
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen font-sans text-slate-800">

      {/* PAGE HEADER */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Order Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage shipping statuses, actual revenue, and cash flow.</p>
        </div>
        
        {/* RELOAD DATA BUTTON */}
        <button 
          onClick={fetchAllOrders} 
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 border border-slate-200 bg-white hover:border-slate-350 rounded-lg hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed group cursor-pointer"
          title="Reload order list"
        >
          {loading ? (
            <svg className="animate-spin h-3.5 w-3.5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-slate-500 transition-transform duration-300 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          )}
          Refresh List
        </button>
      </div>

      {/* 4 DASHBOARD STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Total Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
            <h4 className="text-lg font-bold text-slate-900 mt-0.5">{stats.total}</h4>
          </div>
        </div>

        {/* Card 2: System Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Revenue</p>
            <h4 className="text-lg font-bold text-slate-900 mt-0.5">
              {stats.revenue.toLocaleString()}<span className="text-xs ml-0.5 text-slate-500">{currency}</span>
            </h4>
          </div>
        </div>

        {/* Card 3: Pending Payment */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Payment</p>
            <h4 className="text-lg font-bold text-slate-900 mt-0.5">{stats.pendingPayment}</h4>
          </div>
        </div>

        {/* Card 4: Delivered */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delivered</p>
            <h4 className="text-lg font-bold text-slate-900 mt-0.5">{stats.delivered}</h4>
          </div>
        </div>
      </div>

      {/* SMART FILTER & SEARCH AREA */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <input 
              type="text" 
              placeholder="Search by customer name, phone, order ID, item name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm outline-none transition"
            />
            <div className="absolute left-3 top-3.5 text-slate-400">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* CUSTOM DROPDOWN: Processing Status Filter */}
          <div className="relative custom-dropdown-container">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === "statusFilter" ? null : "statusFilter")}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:border-slate-300 hover:bg-slate-50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition flex items-center justify-between gap-2"
            >
              <span className="truncate">{statusFilterOptions[statusFilter]}</span>
              <svg 
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeDropdown === "statusFilter" ? "rotate-180" : ""}`} 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {activeDropdown === "statusFilter" && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                {Object.entries(statusFilterOptions).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setStatusFilter(key);
                      setActiveDropdown(null);
                    }}
                    className={`w-[calc(100%-8px)] mx-1 text-left px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center justify-between transition-colors ${
                      statusFilter === key 
                        ? "bg-indigo-50 text-indigo-700" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    <span>{label}</span>
                    {statusFilter === key && (
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CUSTOM DROPDOWN: Payment Status Filter */}
          <div className="relative custom-dropdown-container">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === "paymentFilter" ? null : "paymentFilter")}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:border-slate-300 hover:bg-slate-50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition flex items-center justify-between gap-2"
            >
              <span className="truncate whitespace-nowrap">{paymentFilterOptions[paymentFilter]}</span>
              <svg 
                className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${activeDropdown === "paymentFilter" ? "rotate-180" : ""}`} 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {activeDropdown === "paymentFilter" && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150 min-w-[210px]">
                {Object.entries(paymentFilterOptions).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setPaymentFilter(key);
                      setActiveDropdown(null);
                    }}
                    className={`w-[calc(100%-8px)] mx-1 text-left px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center justify-between transition-colors ${
                      paymentFilter === key 
                        ? "bg-indigo-50 text-indigo-700" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    <span>{label}</span>
                    {paymentFilter === key && (
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results Counter and Sorter */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 gap-2">
          <div>
            Showing <span className="font-bold text-slate-800">{filteredAndSortedOrders.length}</span> out of <span className="font-bold text-slate-800">{orders.length}</span> orders
          </div>
          
          {/* CUSTOM DROPDOWN: Sort Orders */}
          <div className="flex items-center gap-2 relative custom-dropdown-container">
            <span className="font-medium text-slate-400">Sort by:</span>
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === "sortBy" ? null : "sortBy")}
              className="text-slate-800 font-bold hover:text-indigo-600 transition flex items-center gap-1.5 focus:outline-none"
            >
              <span>{sortByOptions[sortBy]}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {activeDropdown === "sortBy" && (
              <div className="absolute right-0 top-6 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150 min-w-[200px]">
                {Object.entries(sortByOptions).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSortBy(key);
                      setActiveDropdown(null);
                    }}
                    className={`w-[calc(100%-8px)] mx-1 text-left px-3.5 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-between transition-colors ${
                      sortBy === key 
                        ? "bg-indigo-50 text-indigo-700" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    <span>{label}</span>
                    {sortBy === key && (
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ORDERS LIST */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-slate-500 text-sm font-medium">Loading orders data...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedOrders.map((order) => (
            <div 
              key={order._id} 
              className="bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              {/* ORDER CARD HEADER AREA */}
              <div className="bg-slate-50/70 px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center p-2 bg-white rounded-xl border border-slate-100 text-indigo-600 shadow-sm">
                    {assets && assets.parcel_icon ? (
                      <img src={assets.parcel_icon} alt="parcel_icon" className="w-5 h-5 object-contain" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    )}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-800 text-sm">Order ID #{order._id.slice(-8).toUpperCase()}</span>
                      <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">({order._id})</span>
                    </div>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Order Time: {new Date(order.date).toLocaleDateString()} {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* ORDER CARD CONTENT DETAILS */}
              <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* 1. Product Details */}
                <div className="lg:col-span-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Product Details ({order.items.length})</h4>
                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                    {order.items.map((item, index) => (
                      <div key={item._id || index} className="py-2.5 first:pt-0 last:pb-0 flex gap-3">
                        {item.image && item.image[0] ? (
                          <img 
                            src={item.image[0]} 
                            alt={item.name} 
                            className="w-12 h-12 rounded-xl object-cover border border-slate-100 flex-shrink-0 animate-fade-in"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=150'; }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 text-slate-400 font-bold text-xs">
                            SP
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-slate-500">
                            <span>Qty: <strong className="text-slate-800">{item.quantity}</strong></span>
                            {item.size && (
                              <span className="inline-flex items-center px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-medium text-[11px]">
                                Size: {item.size}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Shipping Information */}
                <div className="lg:col-span-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/70 space-y-2.5 text-xs sm:text-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Shipping Information</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-[11px]">
                      {((order.address?.firstName?.charAt(0) || "U") + (order.address?.lastName?.charAt(0) || "C")).toUpperCase()}
                    </div>
                    <span className="font-bold text-slate-800">{order.address?.firstName} {order.address?.lastName}</span>
                  </div>
                  <div className="space-y-2 text-slate-600">
                    <p className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="leading-relaxed">
                        {order.address?.street}, {order.address?.city}
                        {order.address?.state && `, ${order.address.state}`}
                        {order.address?.country && `, ${order.address.country}`}
                        {order.address?.zipcode && ` (${order.address.zipcode})`}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="font-bold text-slate-800">{order.address?.phone}</span>
                    </p>
                    {order.address?.email && (
                      <p className="flex items-center gap-2 text-slate-500 truncate">
                        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{order.address?.email}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Payment & Status Update */}
                <div className="lg:col-span-3 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment & Status</h4>
                  
                  <div>
                    <span className="text-xs text-slate-500 block">Total Amount:</span>
                    <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">
                      {currency}{order.amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Method:</span>
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">{order.paymentMethod}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Payment:</span>
                      {order.payment ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Pending / COD
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CUSTOM DROPDOWN: Quick Status Update */}
                  <div className="pt-3 border-t border-slate-100 relative custom-dropdown-container">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Update Status
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveDropdown(activeDropdown === order._id ? null : order._id)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white hover:border-slate-300 hover:bg-slate-50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition flex items-center justify-between gap-1"
                    >
                      <span>{orderStatusLabels[order.status] || order.status}</span>
                      <svg 
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${activeDropdown === order._id ? "rotate-180" : ""}`} 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {activeDropdown === order._id && (
                      <div className="absolute left-0 right-0 bottom-full mb-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-30 py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
                        {Object.entries(orderStatusLabels).map(([statusKey, statusLabel]) => (
                          <button
                            key={statusKey}
                            type="button"
                            onClick={() => statusHandler(order._id, statusKey)}
                            className={`w-[calc(100%-8px)] mx-1 text-left px-3 py-1.5 text-[11px] font-bold rounded-lg flex items-center justify-between transition-colors ${
                              order.status === statusKey 
                                ? "bg-indigo-50 text-indigo-700" 
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                            }`}
                          >
                            <span>{statusLabel}</span>
                            {order.status === statusKey && (
                              <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>
          ))}

          {/* NO RESULTS FOUND STATE */}
          {filteredAndSortedOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
              <svg className="w-14 h-14 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-bold text-slate-800 text-lg">No orders found</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-sm">No results match your filters or search keyword.</p>
              <button 
                onClick={() => { setSearchTerm(""); setStatusFilter("All"); setPaymentFilter("All"); }}
                className="mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition shadow-sm"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Orders;