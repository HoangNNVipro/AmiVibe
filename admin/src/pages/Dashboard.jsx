import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { 
  ShoppingBag, Users, DollarSign, Package, TrendingUp, AlertCircle, 
  ArrowUpRight, ArrowDownRight, Zap, Filter, Calendar, Download, Eye, 
  MoreHorizontal, Activity, CheckCircle, Clock, Truck, ShieldAlert,
  MapPin, ShoppingCart, RefreshCw, Sparkles, Award, Archive
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl } from '../App';

const getOrderStatusLabel = (status, t) => {
  switch (status) {
    case 'Order Placed':
      return t('orders_status_order_placed');
    case 'Packing':
      return t('orders_status_packing');
    case 'Shipped':
      return t('orders_status_shipped');
    case 'Out of delivery':
      return t('orders_status_out_of_delivery');
    case 'Delivered':
      return t('orders_status_delivered');
    default:
      return status;
  }
};

const getPieStatusLabel = (name, t) => {
  switch (name) {
    case 'Placed':
      return t('orders_status_order_placed');
    case 'Packing':
      return t('orders_status_packing');
    case 'Shipped':
      return t('orders_status_shipped');
    case 'Delivered':
      return t('orders_status_delivered');
    default:
      return name;
  }
};

const Dashboard = ({ token }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // --- RECENT ORDERS TABLE STATES ---
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [orderSortBy, setOrderSortBy] = useState("date-desc");
  const [orderPage, setOrderPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const itemsPerPage = 5;

  // Dynamically load Google Font to ensure perfect, unified typography across all browsers & platforms
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Fetch all real data from backend API
  const loadDashboardData = async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    try {
      // Parallel API calls for high-speed response
      const [usersRes, productsRes, ordersRes] = await Promise.all([
        axios.get(backendUrl + '/api/user/list', { headers: { token } }),
        axios.get(backendUrl + '/api/product/list'),
        axios.post(backendUrl + '/api/order/list', {}, { headers: { token } })
      ]);

      if (usersRes.data.success) {
        setUsers(usersRes.data.users || []);
      } else {
        toast.error(usersRes.data.message || "Failed to load registered members");
      }

      if (productsRes.data.success) {
        setProducts(productsRes.data.products || []);
      } else {
        toast.error(productsRes.data.message || "Failed to load product catalog");
      }

      if (ordersRes.data.success) {
        // Reverse order list to place newest orders at the top
        const fetchedOrders = ordersRes.data.orders || [];
        setOrders([...fetchedOrders].reverse());
      } else {
        toast.error(ordersRes.data.message || "Failed to load order history");
      }

    } catch (error) {
      console.error("Dashboard Load Error:", error);
      toast.error(error.message || "Server connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [token]);

  // =========================================================================
  // 1. CALCULATE GLOBAL KPI OVERVIEW METRICS
  // =========================================================================
  const stats = useMemo(() => {
    const totalRev = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
    
    // Monthly Revenue (within last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const monthlyRev = orders
      .filter(o => o.date >= thirtyDaysAgo)
      .reduce((sum, o) => sum + (o.amount || 0), 0);

    const totalOrd = orders.length;
    const completedOrd = orders.filter(o => o.status === "Delivered").length;
    const pendingOrd = orders.filter(o => ["Order Placed", "Packing", "Shipped", "Out of delivery"].includes(o.status)).length;
    
    const totalCust = users.length;
    const activeCust = users.filter(u => u.status === "Active").length;

    const totalProd = products.length;
    let inStockProd = 0;
    let outOfStockProd = 0;
    products.forEach(p => {
      let totalRemaining = 0;
      if (p.stock) {
        Object.values(p.stock).forEach(s => {
          totalRemaining += (s.remaining || 0);
        });
      }
      if (totalRemaining > 0) inStockProd++;
      else outOfStockProd++;
    });

    const avgOrderValue = totalOrd > 0 ? Math.round(totalRev / totalOrd) : 0;
    
    // Conversion Rate based on active carts
    const activeCartsCount = users.filter(u => u.cartData && Object.keys(u.cartData).length > 0).length;
    const conversionRate = totalCust > 0 ? (((totalOrd + activeCartsCount) / totalCust) * 10).toFixed(1) : "0.0";

    return {
      totalRev,
      monthlyRev,
      totalOrd,
      completedOrd,
      pendingOrd,
      totalCust,
      activeCust,
      totalProd,
      inStockProd,
      outOfStockProd,
      avgOrderValue,
      conversionRate
    };
  }, [orders, users, products]);

  const stockAlerts = useMemo(() => {
    const alerts = [];
    products.forEach(p => {
      if (p.stock) {
        Object.entries(p.stock).forEach(([size, data]) => {
          const remaining = data.remaining || 0;
          if (remaining <= 5) {
            alerts.push({
              _id: `${p._id}-${size}`,
              name: p.name,
              image: p.image?.[0],
              size: size,
              remaining: remaining,
              isOut: remaining === 0
            });
          }
        });
      }
    });
    // Sort priority: out of stock first, then low stock from 1 upward.
    return alerts.sort((a, b) => a.remaining - b.remaining);
  }, [products]);

  // =========================================================================
  // 2. TIMELINE REVENUE & ORDERS (SALES ANALYTICS)
  // =========================================================================
  const salesChartData = useMemo(() => {
    const groups = {};
    orders.forEach(o => {
      const day = new Date(o.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (!groups[day]) {
        groups[day] = { name: day, revenue: 0, ordersCount: 0 };
      }
      groups[day].revenue += o.amount || 0;
      groups[day].ordersCount += 1;
    });

    return Object.values(groups).slice(-7); // Get the 7 most recent active periods
  }, [orders]);

  // Order Fulfillment Stage (Pie Chart)
  const orderStatusDistribution = useMemo(() => {
    const counts = { "Placed": 0, "Packing": 0, "Shipped": 0, "Delivered": 0 };
    orders.forEach(o => {
      if (o.status === "Order Placed") counts["Placed"] += 1;
      else if (counts[o.status] !== undefined) counts[o.status] += 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const COLORS_STATUS = ["#3b82f6", "#f59e0b", "#8b5cf6", "#10b981"];

  // =========================================================================
  // 3. PRODUCT ANALYTICS INSIGHTS (FASHION SPECIFIC)
  // =========================================================================
  const productInsights = useMemo(() => {
    const categoryRevenue = {};
    const subCategoryRevenue = {};
    const sizeDistribution = {};
    const colorDistribution = {};

    orders.forEach(o => {
      o.items?.forEach(item => {
        const rawProd = products.find(p => p._id === item._id);
        const cat = item.category || rawProd?.category || "Other";
        const subCat = item.subCategory || rawProd?.subCategory || "Other";
        const revenue = (item.price || rawProd?.price || 0) * (item.quantity || 1);

        // Revenue by main Category
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + revenue;

        // Revenue by SubCategory
        subCategoryRevenue[subCat] = (subCategoryRevenue[subCat] || 0) + revenue;

        // Best-selling Sizes
        if (item.size) {
          sizeDistribution[item.size] = (sizeDistribution[item.size] || 0) + (item.quantity || 1);
        }

        // Color popularity
        if (rawProd?.colors) {
          rawProd.colors.forEach(col => {
            colorDistribution[col] = (colorDistribution[col] || 0) + (item.quantity || 1);
          });
        }
      });
    });

    const categoryData = Object.entries(categoryRevenue).map(([name, value]) => ({ name, value }));
    const subCategoryData = Object.entries(subCategoryRevenue).map(([name, value]) => ({ name, value }));
    const sizeData = Object.entries(sizeDistribution).map(([name, value]) => ({ name, value }));
    const colorData = Object.entries(colorDistribution).map(([name, value]) => ({ name, value }));

    return { categoryData, subCategoryData, sizeData, colorData };
  }, [orders, products]);

  // =========================================================================
  // 4. FILTER & SORT LOGIC (RECENT ORDERS TABLE)
  // =========================================================================
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // 1. Search by ID, Phone, or Customer Name
    if (orderSearch.trim() !== "") {
      const q = orderSearch.toLowerCase();
      result = result.filter(o => {
        const fullName = `${o.address?.firstName || ""} ${o.address?.lastName || ""}`.toLowerCase();
        const phone = (o.address?.phone || "").toLowerCase();
        const id = (o._id || "").toLowerCase();
        return fullName.includes(q) || phone.includes(q) || id.includes(q);
      });
    }

    // 2. Status filtration
    if (orderStatusFilter !== "All") {
      result = result.filter(o => o.status === orderStatusFilter);
    }

    // 3. Sorting mechanism
    result.sort((a, b) => {
      if (orderSortBy === "date-desc") return (b.date || 0) - (a.date || 0);
      if (orderSortBy === "date-asc") return (a.date || 0) - (b.date || 0);
      if (orderSortBy === "amount-desc") return (b.amount || 0) - (a.amount || 0);
      if (orderSortBy === "amount-asc") return (a.amount || 0) - (b.amount || 0);
      return 0;
    });

    return result;
  }, [orders, orderSearch, orderStatusFilter, orderSortBy]);

  // Order table pagination segment
  const paginatedOrders = useMemo(() => {
    const startIndex = (orderPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, orderPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;

  useEffect(() => {
    setOrderPage(1);
  }, [orderSearch, orderStatusFilter]);

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 font-['Plus_Jakarta_Sans',sans-serif] antialiased text-slate-800 selection:bg-indigo-500/10 select-none">
      
      {/* HEADER AREA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Activity className="text-indigo-600 w-8 h-8 animate-pulse" />
            {t('dashboard_title')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t('dashboard_subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {t('dashboard_sync_system')}
          </button>
        </div>
      </div>

      {/* DASHBOARD TAB NAVIGATION */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto whitespace-nowrap scrollbar-none gap-2">
        {[
          { id: "overview", labelKey: "dashboard_tab_overview_metrics" },
          { id: "products", labelKey: "dashboard_tab_style_performance" },
          { id: "orders", labelKey: "dashboard_tab_transactional_management" },
          { id: "customers", labelKey: "dashboard_tab_customer_segments" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3.5 px-4 font-bold text-sm transition-all relative cursor-pointer ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t(tab.labelKey)}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTabGlow" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-150/70 shadow-xs">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-slate-500 text-sm font-medium">{t('dashboard_querying_data')}</p>
          </div>
        ) : (
          <>
            {activeTab === "overview" && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }} className="space-y-8">
                
                {/* TOP KPI GRID */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* FINANCIAL */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-1">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{t('dashboard_total_revenue')}</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">${stats.totalRev.toLocaleString()}</h3>
                    <div className="text-[10px] font-semibold text-slate-400 mt-2 flex items-center justify-between">
                      <span>{t('dashboard_aov', { amount: stats.avgOrderValue })}</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-1">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{t('dashboard_monthly_revenue')}</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">${stats.monthlyRev.toLocaleString()}</h3>
                    <div className="text-[10px] font-semibold text-slate-400 mt-2 flex items-center justify-between">
                      <span>{t('dashboard_last_30_days')}</span>
                    </div>
                  </div>

                  {/* OPERATIONS */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-1">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{t('dashboard_orders_delivered')}</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">{stats.completedOrd} / {stats.totalOrd}</h3>
                    <div className="text-[10px] font-semibold text-slate-400 mt-2 flex items-center justify-between">
                      <span>{t('dashboard_delivery_pipeline')}</span>
                      <span className="text-indigo-600 font-bold">{t('dashboard_pending', { pending: stats.pendingOrd })}</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-1">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{t('dashboard_conversion_rate')}</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">{stats.conversionRate}%</h3>
                    <div className="text-[10px] font-semibold text-slate-400 mt-2 flex items-center justify-between">
                      <span>{t('dashboard_success_checkouts')}</span>
                    </div>
                  </div>

                  {/* STOCK HEALTH */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-1">
                    <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">{t('dashboard_total_products')}</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">{stats.totalProd}</h3>
                    <div className="text-[10px] font-semibold text-slate-400 mt-2 flex items-center justify-between">
                      <span>{t('dashboard_in_stock_count', { count: stats.inStockProd })}</span>
                      <span className="text-rose-600 font-bold">{t('dashboard_out_count', { count: stats.outOfStockProd })}</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-1">
                    <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">{t('dashboard_inventory_health')}</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                      {stats.totalProd > 0 ? ((stats.inStockProd / stats.totalProd) * 100).toFixed(0) : 0}%
                    </h3>
                    <div className="text-[10px] font-semibold text-slate-400 mt-2 flex items-center justify-between">
                      <span>{t('dashboard_in_stock_rate')}</span>
                    </div>
                  </div>

                  {/* CUSTOMERS */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-1">
                    <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">{t('dashboard_total_customers')}</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">{stats.totalCust}</h3>
                    <div className="text-[10px] font-semibold text-slate-400 mt-2 flex items-center justify-between">
                      <span>{t('dashboard_registered_system')}</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-1">
                    <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">{t('dashboard_active_accounts')}</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">{stats.activeCust}</h3>
                    <div className="text-[10px] font-semibold text-slate-400 mt-2 flex items-center justify-between">
                      <span>{t('dashboard_active_status')}</span>
                      <span className="text-rose-500 font-bold">{t('dashboard_suspended_count', { count: stats.totalCust - stats.activeCust })}</span>
                    </div>
                  </div>

                </div>

                {/* GRAPHICAL CHARTS CORRELATION */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Revenue area trend chart */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{t('dashboard_revenue_trend_chart')}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">{t('dashboard_revenue_trend_subtitle')}</p>
                      </div>
                      <span className="p-2 bg-slate-50 text-indigo-600 rounded-xl"><TrendingUp size={16} /></span>
                    </div>
                    <div className="h-72">
                      {salesChartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          {t('dashboard_no_transaction_data')}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={salesChartData}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} fontSize={10} stroke="#a78bfa" />
                            <Tooltip />
                            <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue ($)" />
                            <Area yAxisId="right" type="monotone" dataKey="ordersCount" stroke="#c084fc" strokeWidth={1.5} fill="none" name="Orders Count" />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Order status breakdown */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">{t('dashboard_order_status_distribution')}</h3>
                      <p className="text-[11px] text-slate-400">{t('dashboard_order_status_subtitle')}</p>
                    </div>
                    <div className="h-52 my-3">
                      {orders.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          {t('dashboard_no_order_status_data')}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={orderStatusDistribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                              {orderStatusDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {orderStatusDistribution.map((item, idx) => (
                        <div key={item.name} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_STATUS[idx] }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">{getPieStatusLabel(item.name, t)}</p>
                            <p className="font-extrabold text-slate-800">{item.value} orders</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* LOW STOCK WARNINGS & REAL-TIME ACTIVITY FEED */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Warnings panel */}
                  <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">{t('dashboard_operational_alerts')}</h3>
                      <p className="text-[11px] text-slate-400 mb-4">{t('dashboard_operational_alerts_subtitle')}</p>
                    </div>
                    <div className="space-y-3">
                      {stockAlerts.slice(0, 4).map(alert => (
                        <div key={alert._id} className={`p-3 border rounded-2xl flex items-center gap-3 ${alert.isOut ? 'bg-rose-50/50 border-rose-100' : 'bg-orange-50/50 border-orange-100'}`}>
                          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                            <img src={alert.image || 'https://placehold.co/150'} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate" title={alert.name}>{alert.name}</p>
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold mt-0.5 ${alert.isOut ? 'text-rose-600' : 'text-orange-600'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${alert.isOut ? 'bg-rose-500 animate-ping' : 'bg-orange-500'}`}></span>
                              {alert.isOut ? t('dashboard_out_of_stock') : t('dashboard_low_stock', { remaining: alert.remaining })} &bull; SIZE {alert.size}
                            </span>
                          </div>
                        </div>
                      ))}
                      {stockAlerts.length === 0 && (
                        <div className="p-10 text-center text-xs text-slate-400">
                          <CheckCircle size={24} className="text-emerald-500 mx-auto mb-2" />
                          {t('dashboard_all_stocked')}
                        </div>
                      )}
                    </div>
                    <div className="pt-4 border-t border-slate-100 mt-4 text-center">
                      <span className="text-[11px] text-slate-400">{t('dashboard_operational_health')}</span>
                    </div>
                  </div>

                  {/* Live feeding checkouts */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{t('dashboard_recent_activities')}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">{t('dashboard_recent_activities_subtitle')}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {t('dashboard_live_feed')}
                      </span>
                    </div>
                    <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 scrollbar-none">
                      {orders.slice(0, 4).map((o) => (
                        <div key={o._id} className="flex justify-between items-center p-2.5 hover:bg-slate-50 rounded-xl transition">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                              {o.address?.firstName?.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                {o.address?.firstName} {o.address?.lastName} created a new order
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {new Date(o.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {o.items?.length || 0} items
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-extrabold text-slate-900">${o.amount}</span>
                        </div>
                      ))}
                      {orders.length === 0 && (
                        <div className="py-12 text-center text-slate-400 text-xs">
                          {t('dashboard_no_transaction_activity')}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </motion.div>
            )}

            {activeTab === "products" && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }} className="space-y-8">
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Revenue by SubCategory */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 mb-6">{t('dashboard_revenue_by_product_line')}</h3>
                    <div className="h-64">
                      {productInsights.subCategoryData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          {t('dashboard_no_subcategory_data')}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={productInsights.subCategoryData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" />
                            <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="#94a3b8" />
                            <Tooltip />
                            <Bar dataKey="value" fill="#818cf8" radius={[4, 4, 0, 0]} name="Revenue ($)" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Popular Sizes representation */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{t('dashboard_popular_sizes')}</h3>
                      <p className="text-[11px] text-slate-400">{t('dashboard_popular_sizes_subtitle')}</p>
                    </div>
                    <div className="h-44 mt-4">
                      {productInsights.sizeData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          {t('dashboard_no_size_data')}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={productInsights.sizeData} innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                              {productInsights.sizeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={["#818cf8", "#f472b6", "#34d399", "#fbbf24"][index % 4]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="space-y-2 mt-4">
                      {productInsights.sizeData.map((item, idx) => (
                        <div key={item.name} className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ["#818cf8", "#f472b6", "#34d399", "#fbbf24"][idx % 4] }} />
                            {t('dashboard_size_label', { name: item.name })}
                          </span>
                          <span className="font-extrabold text-slate-800">{t('dashboard_items_sold', { count: item.value })}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Popular Inventory Catalog Grid */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-6">{t('dashboard_featured_products')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {products.slice(0, 4).map((p) => {
                      const hasStock = p.stock ? Object.values(p.stock).reduce((acc, curr) => acc + (curr.remaining || 0), 0) > 0 : false;

                      return (
                        <div key={p._id} className="group border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition duration-200">
                          <div className="relative aspect-square overflow-hidden bg-slate-50">
                            <img src={p.image?.[0] || 'https://placehold.co/150'} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt="" />
                            {p.bestseller && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black rounded-full border border-amber-200 tracking-wider">
                                {t('dashboard_bestseller')}
                              </span>
                            )}
                            <span className={`absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black border ${hasStock ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                              {hasStock ? t('dashboard_in_stock') : t('dashboard_out_of_stock_badge')}
                            </span>
                          </div>
                          <div className="p-4 space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.category} &bull; {p.subCategory}</p>
                            <h4 className="text-xs font-extrabold text-slate-800 truncate" title={p.name}>{p.name}</h4>
                            <p className="text-sm font-black text-slate-900">${p.price}</p>
                          </div>
                        </div>
                      );
                    })}
                    {products.length === 0 && (
                      <div className="col-span-4 py-12 text-center text-slate-400 text-xs">
                        {t('dashboard_no_products_found')}
                      </div>
                    )}
                  </div>
                </div>

              </motion.div>
            )}

            {activeTab === "orders" && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }} className="space-y-6">
                
                {/* SEARCH & FILTERS CONTROLS */}
                <div className="bg-white p-4 rounded-2xl border border-slate-150/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <input 
                      type="text" 
                      placeholder={t('dashboard_search_orders_placeholder')}
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 bg-slate-50/50"
                    />
                    <span className="absolute left-3 top-3 text-slate-400">
                      <Filter size={14} />
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="All">{t('dashboard_all_statuses')}</option>
                      <option value="Order Placed">{t('orders_status_order_placed')}</option>
                      <option value="Packing">{t('orders_status_packing')}</option>
                      <option value="Shipped">{t('orders_status_shipped')}</option>
                      <option value="Delivered">{t('orders_status_delivered')}</option>
                    </select>

                    <select
                      value={orderSortBy}
                      onChange={(e) => setOrderSortBy(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-600 font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="date-desc">{t('dashboard_newest_first')}</option>
                      <option value="date-asc">{t('dashboard_oldest_first')}</option>
                      <option value="amount-desc">{t('dashboard_highest_amount')}</option>
                      <option value="amount-asc">{t('dashboard_lowest_amount')}</option>
                    </select>

                  </div>
                </div>

                {/* ORDER RECORD TABLE */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2.5">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-4 w-32">{t('dashboard_order_id_date')}</th>
                          <th className="py-3 px-3 w-48">{t('dashboard_customer')}</th>
                          <th className="py-3 px-3 w-28 text-center">{t('dashboard_payment')}</th>
                          <th className="py-3 px-3 w-28 text-center">{t('dashboard_method')}</th>
                          <th className="py-3 px-3 w-32 text-right">{t('dashboard_total_amount')}</th>
                          <th className="py-3 px-3 w-40 text-center">{t('dashboard_delivery_status')}</th>
                          <th className="py-3 px-4 text-right w-16">{t('dashboard_details')}</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {paginatedOrders.map((o) => (
                          <React.Fragment key={o._id}>
                            <tr className="bg-white hover:shadow-xs transition duration-150">
                              
                              <td className="py-3 px-4 rounded-l-xl border-y border-l border-slate-100/70">
                                <span className="font-extrabold text-slate-900 block">#{o._id.slice(-8).toUpperCase()}</span>
                                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                                  {new Date(o.date).toLocaleDateString('en-US')}
                                </span>
                              </td>

                              <td className="py-3 px-3 border-y border-slate-100/70">
                                <span className="font-bold text-slate-800 block">{o.address?.firstName} {o.address?.lastName}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">{o.address?.phone}</span>
                              </td>

                              <td className="py-3 px-3 border-y border-slate-100/70 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${o.payment ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                  <span className={`w-1 h-1 rounded-full ${o.payment ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
                                  {o.payment ? t('orders_completed') : t('orders_pending_payment')}
                                </span>
                              </td>

                              <td className="py-3 px-3 border-y border-slate-100/70 text-center">
                                <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase">
                                  {o.paymentMethod}
                                </span>
                              </td>

                              <td className="py-3 px-3 border-y border-slate-100/70 text-right font-black text-slate-900 text-sm">
                                ${o.amount?.toLocaleString()}
                              </td>

                              <td className="py-3 px-3 border-y border-slate-100/70 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${getStatusStyle(o.status)}`}>
                                  {getOrderStatusLabel(o.status, t)}
                                </span>
                              </td>

                              <td className="py-3 px-4 rounded-r-xl border-y border-r border-slate-100/70 text-right">
                                <button
                                  onClick={() => setExpandedOrderId(expandedOrderId === o._id ? null : o._id)}
                                  className="p-1.5 text-slate-400 hover:text-slate-900 bg-slate-50 border border-slate-200 rounded-lg transition active:scale-95 cursor-pointer"
                                  title="Order Details"
                                >
                                  <Eye size={14} />
                                </button>
                              </td>
                            </tr>

                            {expandedOrderId === o._id && (
                              <tr>
                                <td colSpan={7} className="px-6 py-4 bg-slate-50/50 border-x border-b border-slate-100 rounded-b-2xl">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('dashboard_shipping_address')}</p>
                                      <div className="space-y-1 text-xs">
                                        <p className="font-bold text-slate-800">{o.address?.street}</p>
                                        <p className="text-slate-500">{o.address?.city}, {o.address?.state || ''} {o.address?.zipcode || ''}</p>
                                        <p className="text-slate-500">{o.address?.country || 'Vietnam'}</p>
                                        <p className="text-slate-600 font-medium">Email: {o.address?.email}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('dashboard_products_in_order', { count: o.items?.length || 0 })}</p>
                                      <div className="space-y-2.5">
                                        {o.items?.map((item, idx) => (
                                          <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-2.5">
                                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                                <img src={item.image?.[0] || 'https://placehold.co/150'} className="w-full h-full object-cover" alt="" />
                                              </div>
                                              <div>
                                                <p className="font-bold text-slate-800 text-[11px] truncate max-w-[150px]">{item.name}</p>
                                                <p className="text-[10px] text-slate-400">Size: {item.size || 'N/A'} &bull; Qty: {item.quantity}</p>
                                              </div>
                                            </div>
                                            <span className="font-bold text-slate-800 text-xs">${item.price}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                        {filteredOrders.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400">
                              <ShoppingBag size={32} className="mx-auto mb-2 text-slate-300" />
                              {t('dashboard_no_orders_match_filters')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* TABLE PAGINATION */}
                  {filteredOrders.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <span className="text-slate-400 font-medium">
                        Showing <b className="text-slate-700">{Math.min(filteredOrders.length, (orderPage - 1) * itemsPerPage + 1)}-{Math.min(filteredOrders.length, orderPage * itemsPerPage)}</b> of <b className="text-slate-700">{filteredOrders.length}</b> total orders
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={orderPage === 1}
                          onClick={() => setOrderPage(prev => Math.max(1, prev - 1))}
                          className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 font-bold transition-all disabled:opacity-40 cursor-pointer"
                        >
                          Prev
                        </button>
                        {Array.from({ length: totalPages }).map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setOrderPage(idx + 1)}
                            className={`w-8 h-8 rounded-lg font-bold border transition-all cursor-pointer ${orderPage === idx + 1 ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'}`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                        <button
                          disabled={orderPage === totalPages}
                          onClick={() => setOrderPage(prev => Math.min(totalPages, prev + 1))}
                          className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 font-bold transition-all disabled:opacity-40 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </motion.div>
            )}

            {activeTab === "customers" && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }} className="space-y-8">
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Account status allocation segment */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 mb-6">{t('dashboard_member_status_distribution')}</h3>
                    <div className="h-64">
                      {users.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          {t('dashboard_no_members_to_analyze')}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={[
                              { name: 'Active', value: stats.activeCust },
                              { name: 'Suspended', value: stats.totalCust - stats.activeCust }
                            ]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                              <Cell fill="#10b981" />
                              <Cell fill="#f43f5e" />
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="flex justify-center gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>{t('dashboard_active')} ({stats.activeCust})</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>{t('dashboard_suspended')} ({stats.totalCust - stats.activeCust})</span>
                    </div>
                  </div>

                  {/* System registered users list */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">{t('dashboard_recently_registered_members')}</h3>
                    <div className="divide-y divide-slate-100 max-h-[280px] overflow-y-auto scrollbar-none pr-1">
                      {users.map(u => (
                        <div key={u._id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0">
                              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&color=fff&bold=true`} alt="" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{u.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{u.email}</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${u.status === 'Active' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                            {u.status === 'Active' ? t('dashboard_active') : t('dashboard_suspended')}
                          </span>
                        </div>
                      ))}
                      {users.length === 0 && (
                        <div className="py-12 text-center text-slate-400 text-xs">
                          No members registered yet.
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

// Helper: Get style colors for order status badges (Synchronized with Orders.jsx)
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

export default Dashboard;
