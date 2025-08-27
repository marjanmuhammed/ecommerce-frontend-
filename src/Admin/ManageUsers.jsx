import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  deleteUser as deleteUserApi,
} from "../Api/adminUserApi";
import { getOrdersByUserId } from "../Api/adminOrderApi";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [userToBlock, setUserToBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAllUsers();
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (user) => {
    try {
      const userRes = await getUserById(user.id);
      setSelectedUser(userRes.data);

      const ordersRes = await getOrdersByUserId(user.id);
      const userOrdersData = ordersRes.data.map((order) => ({
        ...order,
        products: order.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          description: item.description,
          image: item.imageUrl,
          price: item.price,
          quantity: item.quantity,
          totalPrice: item.price * item.quantity,
        })),
      }));
      setUserOrders(userOrdersData);
    } catch (error) {
      console.error("Error fetching user details or orders", error);
      toast.error("Failed to fetch user details or orders");
    }
  };

  const toggleBlockUser = async () => {
    if (!userToBlock) return;

    try {
      if (userToBlock.isBlocked) {
        await unblockUser(userToBlock.id);
        toast.success("User unblocked successfully");
      } else {
        await blockUser(userToBlock.id);
        toast.success("User blocked successfully");
      }
      fetchUsers();
      setShowBlockModal(false);
    } catch (error) {
      console.error("Error updating user status", error);
      toast.error("Failed to update user status");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUserApi(userId);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user", error);
      toast.error("Failed to delete user");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.emailAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "blocked" && user.isBlocked) ||
      (filterStatus === "active" && !user.isBlocked);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString() + " " + new Date(dateStr).toLocaleTimeString();

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">User Management</h1>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by name or email"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="user">User</option>
          </select>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th>User</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Orders</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div>{user.fullName}</div>
                            <div className="text-gray-500">{user.emailAddress}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.isBlocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td>{user.role}</td>
                      <td>{userOrders.filter((o) => o.userId === user.id).length}</td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => handleViewUser(user)}>View</button>
                          <button
                            onClick={() => {
                              setUserToBlock(user);
                              setShowBlockModal(true);
                            }}
                          >
                            {user.isBlocked ? "Unblock" : "Block"}
                          </button>
                          <button onClick={() => deleteUser(user.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected User Orders */}
        {selectedUser && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2>{selectedUser.fullName} Details</h2>
            <p>Email: {selectedUser.emailAddress}</p>
            <p>Joined: {formatDate(selectedUser.createdAt)}</p>

            <h3 className="mt-4 mb-2">Orders:</h3>
            {userOrders.length > 0 ? (
              userOrders.map((order) => (
                <div key={order.id} className="border p-3 rounded-md mb-3 bg-gray-50">
                  <p>Order ID: {order.id}</p>
                  <p>Date: {formatDate(order.orderDate)}</p>
                  <p>Products:</p>
                  <div className="ml-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {order.products.map((prod) => (
                      <div key={prod.productId} className="bg-gray-100 p-3 rounded-lg">
                        <img src={prod.image} alt={prod.name} className="w-24 h-24 object-contain mb-2" />
                        <p className="font-medium">{prod.name}</p>
                        {prod.description && <p className="text-sm text-gray-600">{prod.description}</p>}
                        <p>Price ₹{prod.price} x {prod.quantity}</p>
                        <p>Total: ₹{prod.totalPrice}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 font-semibold">Grand Total: ₹{order.products.reduce((a,b)=>a+b.totalPrice,0)}</p>
                </div>
              ))
            ) : (
              <p>No orders found</p>
            )}
          </div>
        )}

        {/* Block Modal */}
        {showBlockModal && userToBlock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2>Confirm Action</h2>
              <p>Are you sure you want to {userToBlock.isBlocked ? "unblock" : "block"} {userToBlock.fullName}?</p>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setShowBlockModal(false)}>Cancel</button>
                <button onClick={toggleBlockUser}>{userToBlock.isBlocked ? "Unblock" : "Block"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
