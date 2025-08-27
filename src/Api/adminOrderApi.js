import api from "../Api/axiosSetup";

// Get all orders
export const getAllOrders = () => api.get("/admin/orders");

// Get order by ID
export const getOrderById = (orderId) => api.get(`/admin/orders/${orderId}`);

// Update order status
export const updateOrderStatus = (orderId, status) => {
  return api.put(
    `/admin/orders/${orderId}/status`,
    status, // send as plain string
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};

// Get all orders for a specific user
export const getOrdersByUserId = (userId) => api.get(`/admin/orders/user/${userId}`);

// Delete order
export const deleteOrder = (orderId) => api.delete(`/admin/orders/${orderId}`);


