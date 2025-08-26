import React from "react";
import { useNavigate } from "react-router-dom";

const TrackOrderNavbar = () => {
  const navigate = useNavigate(); // navigation hook

  return (
    <nav className="bg-white shadow-md py-4 px-6">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <i className="fas fa-box text-indigo-600 text-2xl mr-2"></i>
          <span className="text-xl font-bold text-gray-800">ShipTrack</span>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 text-gray-600 hover:text-indigo-600"
          >
            <i className="fas fa-home mr-1"></i> Home
          </button>
          <button
            onClick={() => navigate("/orders")}
            className="px-4 py-2 text-gray-600 hover:text-indigo-600"
          >
            <i className="fas fa-history mr-1"></i> Orders
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="px-4 py-2 text-gray-600 hover:text-indigo-600"
          >
            <i className="fas fa-user mr-1"></i> Account
          </button>
        </div>
      </div>
    </nav>
  );
};

export default TrackOrderNavbar;




/////////////////////////////////////////////