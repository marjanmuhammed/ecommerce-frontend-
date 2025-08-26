import api from "../Api/axiosSetup"; // ithanu neett axios setup file

// Create new order
export const createOrder = async (orderData) => {
  return await api.post("/orders", orderData);
};

// Get user orders
export const getUserOrders = async () => {
  return await api.get("/orders"); // backend extracts user from JWT
};
// // Get all orders (Admin only)
// export const getAllOrders = async () => {
//   return await api.get("/orders");
// };

// // Update order status (Admin only)
// export const updateOrderStatus = async (orderId, status) => {
//   return await api.put(`/orders/${orderId}/status?status=${status}`);
// };

export const cancelOrder = async (orderId) => {
  return await api.delete(`/orders/${orderId}`);
};



