import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../Navbarcontext/Navbar";
import { getUserOrders } from "../Api/orderApi";

const TrackOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  // Timeline stages
  const stages = ["Confirmed", "Pending", "Shipped", "Arrived", "Out for Delivery"];

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await getUserOrders();
        const foundOrder = res.data.find((o) => o.id === parseInt(orderId));
        if (!foundOrder) setError("Order not found");
        else setOrder(foundOrder);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch order");
      }
    };
    fetchOrder();
  }, [orderId]);

  const formatDateTime = (dateStr) => new Date(dateStr).toLocaleString();

  const getDeliveryDate = () => {
    if (!order) return "";
    const d = new Date(order.orderDate);
    d.setDate(d.getDate() + 4); // 4 days after order
    return d.toLocaleString();
  };

  if (!order)
    return (
      <div className="min-h-screen flex items-center justify-center">
        {error || "Loading..."}
      </div>
    );

  const currentIndex = stages.indexOf(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-3xl font-bold text-center mb-6">🚚 Track Order</h2>

        {/* Timeline */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between relative">
            {stages.map((stage, idx) => {
              const isCompleted = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center relative">
                  {/* Connecting line */}
                  {idx < stages.length - 1 && (
                    <div
                      className={`absolute top-3 left-1/2 w-full h-1 ${
                        isCompleted ? "bg-green-500" : "bg-gray-300"
                      }`}
                      style={{ zIndex: 0 }}
                    ></div>
                  )}

                  {/* Circle */}
                  <div
                    className={`z-10 w-6 h-6 rounded-full border-4 ${
                      isCompleted
                        ? "bg-green-500 border-green-500"
                        : isCurrent && order.status === "Pending"
                        ? "bg-red-500 border-red-500 animate-pulse"
                        : "bg-gray-200 border-gray-400"
                    }`}
                  ></div>

                  {/* Stage label */}
                  <p
                    className={`mt-2 text-center text-sm font-semibold ${
                      isCompleted
                        ? "text-green-600"
                        : isCurrent
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                  >
                    {stage}{" "}
                    {isCurrent && order.status === "Pending"
                      ? "- We are updating soon"
                      : ""}
                  </p>

                  {/* Stage timestamps */}
                  {stage === "Confirmed" && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDateTime(order.orderDate)}
                    </p>
                  )}
                  {stage === "Out for Delivery" && idx <= currentIndex && (
                    <p className="text-xs text-gray-500 mt-1">
                      Expected: {getDeliveryDate()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Ordered items */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-lg mb-4">🛍️ Items in this order:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center bg-gray-100 p-4 rounded-lg shadow-sm"
              >
                <img
                  src={item.imageUrl || "https://via.placeholder.com/100"}
                  alt={item.name}
                  className="w-24 h-24 object-contain rounded"
                />
                <p className="font-medium mt-2">{item.name}</p>
                <p className="text-gray-600 mt-1">
                  ₹{item.price} x {item.quantity}
                </p>
                <p className="font-semibold mt-1">₹{item.totalPrice}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back button */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/orders")}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ← Back to Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;


/////////////////////////////