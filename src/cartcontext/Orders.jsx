import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbarcontext/Navbar";
import { getUserOrders } from "../Api/orderApi";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

        if (!loggedInUser) {
          navigate("/login");
          return;
        }

        if (loggedInUser.role !== "user") {
          navigate("/admin");
          return;
        }

        const response = await getUserOrders();
        setOrders(response.data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    };

    fetchOrders();
  }, [navigate]);

  const calculateOrderTotal = (items) =>
    items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="relative w-full min-h-screen bg-gray-50">
      <Navbar />

      <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">📦 My Orders</h2>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No orders found.</p>
      ) : (
        <div className="space-y-6 px-4 md:px-10">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 hover:shadow-xl transition duration-300"
            >
              {/* Order Header */}
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-gray-800">Order ID: {order.id}</h4>
                <span
                  className={`px-3 py-1 text-sm font-semibold text-white rounded-md ${
                    order.paymentMethod === "Cash on Delivery" ? "bg-green-500" : "bg-blue-500"
                  }`}
                >
                  {order.paymentMethod || order.status}
                </span>
              </div>

              {/* Shipping Address */}
              <p className="text-gray-700 mt-2">
                <strong>Shipping Address:</strong> {order.address.fullName}, {order.address.addressLine},{" "}
                {order.address.pincode}
              </p>

              {/* Order Status */}
              <div className="mt-4">
                <p className="text-lg font-semibold text-gray-800">
                  📦 Order Status: <span className="text-blue-600">{order.status}</span>
                </p>
              </div>

              {/* Items */}
              <div className="mt-4 border-t pt-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">🛍️ Items Ordered:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center bg-gray-100 p-4 rounded-lg hover:shadow-md transition duration-300"
                    >
                      <img
                        src={item.imageUrl || "https://via.placeholder.com/100"}
                        alt={item.name}
                        className="w-24 h-24 object-contain rounded-lg"
                      />
                      <p className="font-medium text-gray-900 mt-2">{item.name}</p>
                      {item.description && (
                        <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                      )}
                      <p className="text-gray-600 mt-1">
                        <span className="text-green-600 font-bold">₹{item.price}</span> x {item.quantity}
                      </p>
                      <p className="text-gray-800 font-semibold mt-1">₹{item.totalPrice}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="mt-4 flex justify-between font-semibold text-gray-800">
                <span>Order Total:</span>
                <span>₹{calculateOrderTotal(order.items)}</span>
              </div>

              {/* Track Button */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate(`/track-order/${order.id}`)}
                  className="px-6 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition duration-300"
                >
                  🚛 Track Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Continue Shopping */}
      <div className="text-center mt-10">
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
        >
          🛒 Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default Orders;
