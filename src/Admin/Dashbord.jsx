import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import axios from "axios";
import { fetchUserProfile } from "../Api/userApi";
import { getAllOrders, updateOrderStatus } from "../Api/adminOrderApi";
import { useOrderContext } from "../context/OrderContext";
import {getAllUsers} from "../Api/adminUserApi"
import { toast } from "react-toastify";

const BASE_URL = "https://localhost:7175/api";

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// API functions
const api = {
  fetchTotalProducts: () => axios.get(`${BASE_URL}/Products/count`),
  fetchMenProducts: () => axios.get(`${BASE_URL}/Products/category/Men`),
  fetchWomenProducts: () => axios.get(`${BASE_URL}/Products/category/Women`),
  fetchDealsProducts: () => axios.get(`${BASE_URL}/Products/category/Best Deals`),
  fetchHomeProducts: () => axios.get(`${BASE_URL}/Products/category/Home`),
 
  fetchTotalRevenue: () => axios.get(`${BASE_URL}/orders/total-revenue`),
  fetchRecentOrders: () => axios.get(`${BASE_URL}/orders/recent`),
  fetchMonthlyRevenue: () => axios.get(`${BASE_URL}/orders/monthly-revenue`),
};

const AdminDashboard = () => {   
  const [stats, setStats] = useState({
    products: {
      men: 0,
      women: 0,
      deals: 0,
      home: 0,
      total: 0,
    },
    users: {
      total: 0,
      newThisWeek: 0,
      active: 0,
    },
    orders: {
      total: 0,
      pending: 0,
      completed: 0,
    },
    revenue: {
      total: 0,
      thisMonth: 0,
      lastMonth: 0,
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [adminProfile, setAdminProfile] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [editingStatus, setEditingStatus] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const { ordersUpdated, triggerOrdersUpdate } = useOrderContext();
  const [revenue, setRevenue] = useState([]);

  const fetchData = async () => {
    try {
      // Fetch admin profile
      const profileResponse = await fetchUserProfile();
      setAdminProfile(profileResponse.data);

      // Fetch all data in parallel
      const [
        totalProductsRes,
        menProductsRes,
        womenProductsRes,
        dealsProductsRes,
        homeProductsRes,
        totalUsersRes,
        totalOrdersRes,
        totalRevenueRes,
        recentOrdersRes,
        monthlyRevenueRes
      ] = await Promise.allSettled([
        api.fetchTotalProducts(),
        api.fetchMenProducts(),
        api.fetchWomenProducts(),
        api.fetchDealsProducts(),
        api.fetchHomeProducts(),
        getAllUsers(),
        getAllOrders(),
        api.fetchTotalRevenue(),
        api.fetchRecentOrders(),
        api.fetchMonthlyRevenue()
      ]);

      // Process products data
      const menProducts = menProductsRes.status === 'fulfilled' ? menProductsRes.value.data.length : 0;
      const womenProducts = womenProductsRes.status === 'fulfilled' ? womenProductsRes.value.data.length : 0;
      const dealsProducts = dealsProductsRes.status === 'fulfilled' ? dealsProductsRes.value.data.length : 0;
      const homeProducts = homeProductsRes.status === 'fulfilled' ? homeProductsRes.value.data.length : 0;
      const totalProducts = totalProductsRes.status === 'fulfilled' ? totalProductsRes.value.data : 
        (menProducts + womenProducts + dealsProducts + homeProducts);

      // Process orders data
      let totalOrders = 0;
      let pendingOrders = 0;
      let completedOrders = 0;
      let calculatedRevenue = 0;

      if (totalOrdersRes.status === 'fulfilled') {
        const ordersData = totalOrdersRes.value.data;
        totalOrders = ordersData.length;
        pendingOrders = ordersData.filter(order => order.status === 'Pending').length;
        completedOrders = ordersData.filter(order => order.status === 'Completed').length;
        
        // Calculate total revenue from all orders
        calculatedRevenue = ordersData.reduce((sum, order) => {
          // Check if order has items array and calculate from items
          if (order.items && Array.isArray(order.items)) {
            const orderTotal = order.items.reduce((orderSum, item) => {
              return orderSum + (item.totalPrice || item.price * item.quantity || 0);
            }, 0);
            return sum + orderTotal;
          }
          
          // Fallback to order totalAmount if items array doesn't exist
          const amount = order.totalAmount || order.amount || order.total || 0;
          return sum + amount;
        }, 0);
      }

      // Process other data
 // Fetch all users
// Fetch all users
const usersData = totalUsersRes.status === 'fulfilled' ? totalUsersRes.value.data : [];
const totalUsers = usersData.length;



      const apiTotalRevenue = totalRevenueRes.status === 'fulfilled' ? totalRevenueRes.value.data : 0;
      
      // Use calculated revenue if API returns 0 or invalid value
      const finalRevenue = apiTotalRevenue > 0 ? apiTotalRevenue : calculatedRevenue;

      const recentOrdersData = recentOrdersRes.status === 'fulfilled' ? recentOrdersRes.value.data : [];
      const monthlyRevenueData = monthlyRevenueRes.status === 'fulfilled' ? monthlyRevenueRes.value.data : [];

      // Format recent orders with proper data
      const formattedRecentOrders = recentOrdersData.length > 0 
        ? recentOrdersData.map(order => ({
            id: order.id,
            customerName: order.address?.fullName || order.customerName || 'Unknown Customer',
            orderDate: order.orderDate || order.date,
            totalAmount: order.items ? order.items.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity || 0), 0) : 
                      (order.totalAmount || order.amount || order.total || 0),
            status: order.status,
            items: order.items || []
          }))
        : (totalOrdersRes.status === 'fulfilled' 
            ? totalOrdersRes.value.data.slice(0, 5).map(order => ({
                id: order.id,
                customerName: order.address?.fullName || 'Unknown Customer',
                orderDate: order.orderDate,
                totalAmount: order.items ? order.items.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity || 0), 0) : 
                          (order.totalAmount || 0),
                status: order.status,
                items: order.items || []
              }))
            : []);

      // Calculate this month and last month revenue
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      let thisMonthRevenue = 0;
      let lastMonthRevenue = 0;
      
      if (totalOrdersRes.status === 'fulfilled') {
        const orders = totalOrdersRes.value.data;
        
        thisMonthRevenue = orders
          .filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
          })
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
          
        lastMonthRevenue = orders
          .filter(order => {
            const orderDate = new Date(order.orderDate);
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const year = currentMonth === 0 ? currentYear - 1 : currentYear;
            return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === year;
          })
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      }

      // Set all data
      setStats({
        products: {
          men: menProducts,
          women: womenProducts,
          deals: dealsProducts,
          home: homeProducts,
          total: totalProducts,
        },
        users: {
          total: totalUsers,
         newThisWeek: Math.floor(totalUsers * 0.1), // Placeholder calculation
active: Math.floor(totalUsers * 0.75), // Placeholder calculation

        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          completed: completedOrders,
        },
        revenue: {
          total: finalRevenue,
          thisMonth: thisMonthRevenue,
          lastMonth: lastMonthRevenue,
        }
      });

      setRecentOrders(formattedRecentOrders);
      
      // Format monthly revenue data for the chart
      if (monthlyRevenueData.length > 0) {
        setMonthlyRevenue(monthlyRevenueData);
      } else {
        // Create sample data if API doesn't return data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const sampleData = months.map((month, index) => ({
          month,
          revenue: index <= currentMonth ? Math.floor(Math.random() * 10000) + 5000 : 0
        }));
        setMonthlyRevenue(sampleData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Fetching error:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ordersUpdated]);

  const handleStatusChange = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, { status: newStatus });
    triggerOrdersUpdate();
  };
// AdminDashboard.js - Update the handleStatusUpdate function
 const handleStatusUpdate = async (orderId) => {
    try {
      // Validate input
      if (!newStatus) {
        toast.error("Please select a status");
        return;
      }

      // Check if status is actually changing
      if (newStatus === editingStatus.prevStatus) {
        setEditingStatus(null);
        setNewStatus("");
        return;
      }

      console.log("Updating order:", orderId, "to status:", newStatus);
      
      // Send the status as a string directly instead of an object
      const response = await updateOrderStatus(orderId, newStatus);
      
      if (response.status === 200) {
        // Success - update UI
        setRecentOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        
        // Update stats
        setStats(prevStats => {
          const updatedStats = { ...prevStats };
          const oldStatus = editingStatus.prevStatus;
          
          // Decrement old status count
          if (oldStatus === 'Pending') updatedStats.orders.pending--;
          if (oldStatus === 'Completed') updatedStats.orders.completed--;
          if (oldStatus === 'Processing') {
            // Handle processing count if tracked
          }
          
          // Increment new status count
          if (newStatus === 'Pending') updatedStats.orders.pending++;
          if (newStatus === 'Completed') updatedStats.orders.completed++;
          if (newStatus === 'Processing') {
            // Handle processing count if tracked
          }
          
          return updatedStats;
        });
        
        triggerOrdersUpdate();
        toast.success("Order status updated successfully!");
      }
      
      setEditingStatus(null);
      setNewStatus("");
      
    } catch (error) {
      console.error("Error updating order status:", error);
      
      if (error.response?.status === 400) {
        toast.error("Invalid request. Please check the status value.");
      } else if (error.response?.status === 404) {
        toast.error("Order not found.");
      } else {
        toast.error("Failed to update order status. Please try again.");
      }
    }
  };

  // Data for charts
  const productCategoryData = [
    { name: "Men", value: stats.products.men },
    { name: "Women", value: stats.products.women },
    { name: "Deals", value: stats.products.deals },
    { name: "Home", value: stats.products.home },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-4 bg-gray-800 border border-gray-700 rounded shadow-md">
          <p className="text-white">{`${label}`}</p>
          <p className="text-blue-400">{`Value: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-6 flex flex-col space-y-6 fixed h-full">
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-blue-600 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
        </div>
        
        <div className="space-y-2">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`w-full text-left py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors ${activeTab === "overview" ? "bg-blue-600" : "hover:bg-gray-700"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Dashboard</span>
          </button>
          
          <Link
            to="/admin/products"
            className="block w-full text-left py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>Products</span>
          </Link>
          
          <Link
            to="/admin/users"
            className="block w-full text-left py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Users</span>
          </Link>
          
          <button className="w-full text-left py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>Orders</span>
          </button>
          
          <button className="w-full text-left py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Reports</span>
          </button>
        </div>
        
        <div className="mt-auto p-4 bg-gray-750 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">{adminProfile?.fullName || 'Admin User'}</p>
              <p className="text-xs text-gray-400">{adminProfile?.email || 'admin@example.com'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-6 bg-gray-800 border-b border-gray-700">
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="relative">
              <button className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold">
                    {adminProfile?.fullName ? adminProfile.fullName.charAt(0) : 'A'}
                  </span>
                </div>
                <span>{adminProfile?.fullName || 'Admin'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Products</p>
                      <h3 className="text-2xl font-bold mt-1">{stats.products.total}</h3>
                      <p className="text-green-500 text-sm mt-2">+5% from last month</p>
                    </div>
                    <div className="bg-blue-500 p-3 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Users</p>
                      <h3 className="text-2xl font-bold mt-1">{stats.users.total}</h3>
                      <p className="text-green-500 text-sm mt-2">+12% from last week</p>
                    </div>
                    <div className="bg-green-500 p-3 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Orders</p>
                      <h3 className="text-2xl font-bold mt-1">{stats.orders.total}</h3>
                      <p className="text-green-500 text-sm mt-2">
                        {stats.orders.completed} completed, {stats.orders.pending} pending
                      </p>
                    </div>
                    <div className="bg-yellow-500 p-3 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Revenue</p>
                      <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.revenue.total)}</h3>
                      <p className="text-green-500 text-sm mt-2">
                        This month: {formatCurrency(stats.revenue.thisMonth)}
                      </p>
                    </div>
                    <div className="bg-red-500 p-3 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Chart */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" stroke="#888888" />
                        <YAxis stroke="#888888" />
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#333', border: 'none' }} 
                          formatter={(value) => [formatCurrency(value), 'Revenue']}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Product Categories Chart */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Product Categories</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={productCategoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {productCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Recent Activity Table */}
              <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {recentOrders.length > 0 ? (
                        recentOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap">#{order.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{order.customerName}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{formatDate(order.orderDate)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(order.totalAmount)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingStatus && editingStatus.orderId === order.id ? (
                            <select
  value={newStatus}
  onChange={(e) => setNewStatus(e.target.value)}
  className="bg-gray-700 text-white p-1 rounded"
>
  <option value="Pending">Pending</option>
  <option value="Processing">Processing</option>
  <option value="Shipped">Shipped</option>
  <option value="Out for Delivery">Out for Delivery</option>
  <option value="Delivered">Delivered</option>
  <option value="Cancelled">Cancelled</option>
</select>

                              ) : (
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  order.status === 'Completed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : order.status === 'Processing' 
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : order.status === 'Pending'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {order.status}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingStatus && editingStatus.orderId === order.id ? (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleStatusUpdate(order.id)}
                                    className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                                  >
                                    Save
                                  </button>

                                  <button
                                    onClick={() => setEditingStatus(null)}
                                    className="px-2 py-1 bg-gray-600 text-white rounded text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingStatus({ orderId: order.id, prevStatus: order.status });
                                      setNewStatus(order.status);
                                    }}
                                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                                  >
                                    Edit
                                  </button>
                               
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-center text-gray-400">
                            No recent orders found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end">
                
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;