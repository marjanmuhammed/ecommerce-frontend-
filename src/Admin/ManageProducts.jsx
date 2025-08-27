import React, { useState, useEffect } from "react";
import { getAllProducts, createProduct, updateProduct, deleteProduct } from "../Api/adminProductApi";
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useNavigate } from "react-router-dom";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("products");
  const productsPerPage = 8;
  const navigate = useNavigate();

  const [productData, setProductData] = useState({
    name: "",
    price: "",
    description: "",
    categoryId: 1, // Default to first category
    image: null,
  });

  // Map category names to IDs - Ensure these match your backend categories
 const categories = [
  { id: 2, name: "Men's Collection" },
  { id: 3, name: "Women's Collection" },
  { id: 4, name: "Best Deals" },
  { id: 1, name: "Home" }
];

  useEffect(() => {
    fetchProducts();
  }, []);

  // Prepare data for charts - Fixed to ensure all categories are included
// Count products by category
const categoryCount = categories.reduce((acc, category) => {
  const count = products.filter(product => Number(product.categoryId) === category.id).length;
  acc[category.name] = count;
  return acc;
}, {});


  const categoryChartData = {
    labels: Object.keys(categoryCount),
    datasets: [
      {
        label: 'Products by Category',
        data: Object.values(categoryCount),
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

const fetchProducts = async () => {
  setLoading(true);
  try {
    const response = await getAllProducts();
    
    // Backend ninnu vann products categoryId correct aayittu integer aanu enn assume cheyyu
    const fetchedProducts = response.data.map(product => ({
      ...product,
      categoryId: Number(product.categoryId) // Ensure correct number
    }));

    setProducts(fetchedProducts);
  } catch (error) {
    console.error("Error fetching products", error);
    showNotification("Failed to fetch products", "error");
  } finally {
    setLoading(false);
  }
};


  const handleEdit = (product) => {
    setEditingProduct(product);
    setProductData({
      name: product.name,
      price: product.price,
      description: product.description,
      categoryId: product.categoryId,
      image: null,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    setProductData(prev => ({
      ...prev,
      [name]: type === "file" ? files[0] : value
    }));
  };
const handleSaveProduct = async () => {
  if (!productData.name || !productData.price || !productData.description) {
    showNotification("Please fill all required fields", "error");
    return;
  }

  setLoading(true);
  const formData = new FormData();
  
  formData.append("Name", productData.name);
  formData.append("Price", productData.price);
  formData.append("Description", productData.description);
  formData.append("CategoryId", Number(productData.categoryId)); // Ensure correct number

  if (productData.image) {
    formData.append("Image", productData.image);
  }

  try {
    if (editingProduct) {
      await updateProduct(editingProduct.id, formData);
      showNotification("Product updated successfully!");
    } else {
      await createProduct(formData);
      showNotification("Product added successfully!");
    }
    
    // Reset form
    setProductData({
      name: "",
      price: "",
      description: "",
      categoryId: 1,
      image: null,
    });
    setEditingProduct(null);

    // Fetch products correctly
    await fetchProducts(); 
  } catch (error) {
    console.error("Error saving product", error);
    const errorMessage = error.response?.data?.message || "Failed to save product";
    showNotification(errorMessage, "error");
  } finally {
    setLoading(false);
  }
};


  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    try {
      await deleteProduct(id);
      showNotification("Product deleted successfully!");
      await fetchProducts(); // Wait for products to refresh
    } catch (error) {
      console.error("Error deleting product", error);
      const errorMessage = error.response?.data?.message || "Failed to delete product. It might be referenced in orders.";
      showNotification(errorMessage, "error");
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setProductData({
      name: "",
      price: "",
      description: "",
      categoryId: 1,
      image: null,
    });
  };

  // Filter and sort products
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "price") return a.price - b.price;
    if (sortBy === "category") {
      const categoryA = categories.find(c => c.id === a.categoryId)?.name || "";
      const categoryB = categories.find(c => c.id === b.categoryId)?.name || "";
      return categoryA.localeCompare(categoryB);
    }
    return 0;
  });

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
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
            onClick={() => navigate("/dashboard")}
            className={`w-full text-left py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors ${activeTab === "dashboard" ? "bg-blue-600" : "hover:bg-gray-700"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab("products")}
            className={`w-full text-left py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors ${activeTab === "products" ? "bg-blue-600" : "hover:bg-gray-700"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>Products</span>
          </button>
          
          <button 
            onClick={() => navigate("/admin/users")}
            className="w-full text-left py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Users</span>
          </button>
          
          <button 
            onClick={() => navigate("/admin/orders")}
            className="w-full text-left py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>Orders</span>
          </button>
          
          <button 
            onClick={() => navigate("/admin/reports")}
            className="w-full text-left py-3 px-4 rounded-lg flex items-center space-x-3 transition-colors hover:bg-gray-700"
          >
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
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-400">admin@example.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1">
        {/* Notification */}
        {notification.show && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
            notification.type === "error" ? "bg-red-600" : "bg-blue-600"
          }`}>
            {notification.message}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Product Management</h1>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Sort by Name</option>
                <option value="price">Sort by Price</option>
                <option value="category">Sort by Category</option>
              </select>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Products by Category</h2>
              <div className="h-64">
                <Bar 
                  data={categoryChartData} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        labels: {
                          color: 'white'
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          color: 'white'
                        },
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)'
                        }
                      },
                      x: {
                        ticks: {
                          color: 'white'
                        },
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)'
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>
            
            {/* Additional chart for better visualization */}
            <div className="bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Category Distribution</h2>
              <div className="h-64">
                <Doughnut 
                  data={categoryChartData} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: 'white',
                          padding: 15
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Product Form */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-xl shadow-md p-6 sticky top-6">
                <h2 className="text-xl font-semibold text-white mb-6">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                      value={productData.name}
                      onChange={handleInputChange}
                      placeholder="Enter product name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Price (₹ ) *</label>
                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                      value={productData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description *</label>
                    <textarea
                      name="description"
                      rows="3"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                      value={productData.description}
                      onChange={handleInputChange}
                      placeholder="Enter product description"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Category *</label>
                    <select
                      name="categoryId"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                      value={productData.categoryId}
                      onChange={handleInputChange}
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Product Image</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-400">
                          <label className="relative cursor-pointer rounded-md font-medium text-blue-500 hover:text-blue-400 focus-within:outline-none">
                            <span>Upload an image</span>
                            <input 
                              type="file" 
                              name="image" 
                              className="sr-only" 
                              onChange={handleInputChange}
                              accept="image/*"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        {productData.image && (
                          <p className="text-xs text-green-500 mt-2">Image selected: {productData.image.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                      onClick={handleSaveProduct}
                      disabled={loading}
                    >
                      {loading ? "Processing..." : editingProduct ? "Update Product" : "Add Product"}
                    </button>
                    
                    {editingProduct && (
                      <button
                        className="px-4 py-2.5 border border-gray-600 rounded-lg font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                        onClick={handleCancelEdit}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Products List */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700">
                  <h2 className="text-xl font-semibold text-white">Products</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : currentProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-white">No products found</h3>
                    <p className="mt-1 text-sm text-gray-400">Get started by creating a new product.</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-700">
                      {currentProducts.map((product) => {
                        const categoryName = categories.find(c => c.id === product.categoryId)?.name || "Unknown";
                        
                        return (
                          <div key={product.id} className="p-6 flex flex-col sm:flex-row">
                            <div className="flex-shrink-0 sm:mr-6 mb-4 sm:mb-0">
                              <img
                                className="h-24 w-24 object-contain rounded-lg bg-gray-700"
                                src={product.imageUrl || "https://via.placeholder.com/200"} 
                                alt={product.name || "Product Image"}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://via.placeholder.com/200";
                                }}
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-medium text-white truncate">{product.name}</h3>
                                  <p className="mt-1 text-sm text-gray-400 truncate">{product.description}</p>
                                </div>
                              </div>
                              
                              <div className="mt-4 flex flex-wrap items-center">
                                <span className="text-lg font-bold text-blue-400">${product.price}</span>
                                <span className="mx-2 text-gray-600">•</span>
                                <span className={`text-sm px-2 py-1 rounded-full ${
                                  product.categoryId === 1 ? "bg-blue-500/20 text-blue-300" :
                                  product.categoryId === 2 ? "bg-pink-500/20 text-pink-300" :
                                  product.categoryId === 3 ? "bg-purple-500/20 text-purple-300" :
                                  "bg-orange-500/20 text-orange-300"
                                }`}>
                                  {categoryName}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-4 sm:mt-0 sm:ml-6 flex items-center space-x-3">
                              <button
                                onClick={() => handleEdit(product)}
                                className="inline-flex items-center px-3 py-2 border border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="px-6 py-4 bg-gray-750 border-t border-gray-700 flex items-center justify-between">
                        <div className="flex-1 flex justify-between sm:hidden">
                          <button
                            onClick={() => paginate(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-400">
                              Showing <span className="font-medium text-white">{indexOfFirstProduct + 1}</span> to{' '}
                              <span className="font-medium text-white">
                                {Math.min(indexOfLastProduct, filteredProducts.length)}
                              </span>{' '}
                              of <span className="font-medium text-white">{filteredProducts.length}</span> results
                            </p>
                          </div>
                          <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                              <button
                                onClick={() => paginate(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                              >
                                <span className="sr-only">Previous</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                              
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                  key={page}
                                  onClick={() => paginate(page)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === page
                                      ? 'z-10 bg-blue-600 border-blue-500 text-white'
                                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                                  }`}
                                >
                                  {page}
                                </button>
                              ))}
                              
                              <button
                                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                              >
                                <span className="sr-only">Next</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageProducts;