// src/Api/adminUserApi.js
import api from "../Api/axiosSetup";

// Get all users
export const getAllUsers = () => api.get("/admin/AdminUsers");

// Get user by ID
export const getUserById = (id) => api.get(`/admin/AdminUsers/${id}`);

// Block user
export const blockUser = (id) => api.put(`/admin/AdminUsers/block/${id}`);

// Unblock user
export const unblockUser = (id) => api.put(`/admin/AdminUsers/unblock/${id}`);

// Delete user
export const deleteUser = (id) => api.delete(`/admin/AdminUsers/${id}`);
