import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbarcontext/Navbar";
import { getUserOrders, cancelOrder } from "../Api/orderApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useOrderContext } from "../context/OrderContext"; 

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const navigate = useNavigate();
  const { ordersUpdated, triggerOrdersUpdate } = useOrderContext(); // Get triggerOrdersUpdate

  const cancelOptions = [
    "Delivery time issue",
    "Change product",
    "Change color/size",
    "Others",
  ];

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
  }, [navigate, ordersUpdated]); // Add ordersUpdated to dependency array
  
  const calculateOrderTotal = (items) =>
    items.reduce((sum, item) => sum + item.totalPrice, 0);

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  const openCancelPopup = (orderId) => {
    setSelectedOrderId(orderId);
    setCancelReason("");
    setShowCancelPopup(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason) {
      toast.error("Please select a reason for cancellation.");
      return;
    }
    try {
      await cancelOrder(selectedOrderId, { reason: cancelReason });
      // Update the local state to remove the cancelled order
      setOrders((prev) =>
        prev.filter((order) => order.id !== selectedOrderId)
      );
      // Trigger a global orders update to refresh all components
      triggerOrdersUpdate();
      toast.success("✅ Order cancelled successfully!");
      setShowCancelPopup(false);
      setSelectedOrderId(null);
      setCancelReason("");
    } catch (err) {
      console.error("Failed to cancel order:", err);
      toast.error("❌ Failed to cancel order. Please try again.");
    }
  };

  const getDeliveryDate = (orderDate) => {
    const date = new Date(orderDate);
    date.setDate(date.getDate() + 4);
    return date.toLocaleDateString();
  };

  const trackOrder = (orderId) => {
    navigate(`/track-order/${orderId}`);
  };

const stages = ["Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered"];

  return (
    <div className="relative w-full min-h-screen bg-gray-50">
      <Navbar />

      <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">
        📦 My Orders
      </h2>

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
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-semibold text-gray-800">
                  Order ID: {order.id}
                </h4>
            <span className={`px-3 py-1 text-xs rounded-full relative ${
  order.status === 'Completed' 
    ? 'bg-green-100 text-green-800' 
    : order.status === 'Processing' 
    ? 'bg-yellow-100 text-yellow-800'
    : order.status === 'Pending'
    ? 'bg-blue-100 text-blue-800 animate-pulse' // Added animate-pulse class
    : order.status === 'Cancelled'
    ? 'bg-red-100 text-red-800'
    : 'bg-gray-100 text-gray-800'
}`}>
  {order.status}
  {order.status === 'Pending' && (
    <span className="absolute -top-1 -right-1 flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
    </span>
  )}
</span>
              </div>

              {/* Order Time */}
              <p className="text-gray-500 text-sm mb-2">
                🕒 Ordered At: {formatDateTime(order.orderDate)}
              </p>

              {/* Expected Delivery */}
              {order.status !== 'Cancelled' && (
                <p className="text-gray-500 text-sm mb-2">
                  🚚 Expected Delivery: {getDeliveryDate(order.orderDate)}
                </p>
              )}

              {/* Shipping Address */}
              <p className="text-gray-700 mb-2">
                <strong>Shipping Address:</strong> {order.address.fullName},{" "}
                {order.address.addressLine}, {order.address.pincode}
              </p>

            {order.status !== 'Cancelled' && (
  <div className="mt-4">
    <h4 className="text-lg font-semibold mb-2">Order Progress:</h4>
    <div className="flex items-center justify-between">
      {stages.map((stage, idx) => {
        // Determine current stage index
        let stageIndex = stages.indexOf(order.status);
        // If status is "Out for Delivery", map it to the correct index
        if (order.status === "Out for Delivery") {
          stageIndex = 3;
        }
        
        return (
          <div key={idx} className="flex-1 text-center relative">
            <div
              className={`mx-auto w-6 h-6 rounded-full border-2 ${
                idx <= stageIndex
                  ? "border-green-500 bg-green-500"
                  : "border-gray-300 bg-white"
              }`}
            />
            {idx < stages.length - 1 && (
              <div
                className={`absolute top-3 left-1/2 w-full h-1 ${
                  idx < stageIndex
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              ></div>
            )}
            <p
              className={`mt-2 text-xs ${
                idx <= stageIndex
                  ? "text-green-600 font-semibold"
                  : "text-gray-400"
              }`}
            >
              {stage}
            </p>
          </div>
        );
      })}
    </div>
  </div>
)}

              {/* Items */}
              <div className="mt-4 border-t pt-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  🛍️ Items Ordered:
                </h4>
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
                        <span className="text-green-600 font-bold">
                         Price ₹{item.price}
                        </span>{" "}
                        x {item.quantity}
                      </p>
                      <p className="text-gray-800 font-semibold mt-1">
                      Total Amount :  ₹{item.totalPrice}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="mt-4 flex justify-between font-semibold text-gray-800">
                <span>Grand Total:</span>
                <span>₹{calculateOrderTotal(order.items)}</span>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => trackOrder(order.id)}
                  className="px-6 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition duration-300"
                >
                  🚛 Track Order
                </button>
                {order.status === "Pending" && (
                  <button
                    onClick={() => openCancelPopup(order.id)}
                    className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition duration-300"
                  >
                    ❌ Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Order Popup */}
      {showCancelPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80 shadow-lg animate-fadeIn">
            <h3 className="text-lg font-bold mb-4 text-center">
              Why are you cancelling?
            </h3>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full border p-2 rounded mb-4"
            >
              <option value="">Select a reason</option>
              {cancelOptions.map((opt, idx) => (
                <option key={idx} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelPopup(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Confirm
              </button>
            </div>
          </div>
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