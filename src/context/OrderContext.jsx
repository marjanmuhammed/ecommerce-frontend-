
// context/OrderContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const OrderContext = createContext();

export const useOrderContext = () => {
  return useContext(OrderContext);
};

export const OrderProvider = ({ children }) => {
  const [ordersUpdated, setOrdersUpdated] = useState(0);
  
  const triggerOrdersUpdate = () => {
    setOrdersUpdated(prev => prev + 1);
  };

  const value = {
    ordersUpdated,
    triggerOrdersUpdate
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};