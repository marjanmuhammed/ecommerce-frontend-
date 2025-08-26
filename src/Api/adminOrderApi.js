

// src/api/adminOrderApi.js
import api from "../Api/axiosSetup"; // your Axios instance with interceptors

// Get all orders (Admin only)
export const getAllOrders = () => {
  return api.get("/admin/orders");
};

// Get single order by ID (Admin only)
export const getOrderById = (orderId) => {
  return api.get(`/admin/orders/${orderId}`);
};

// Delete order by ID (Admin only)
export const deleteOrder = (orderId) => {
  return api.delete(`/admin/orders/${orderId}`);
};

// Update order status (Admin only) - Correct implementation
export const updateOrderStatus = (orderId, status) => {
  // Send the status as a string directly in the request body
  return api.put(`/admin/orders/${orderId}/status`, `"${status}"`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
};


/////////final////////////