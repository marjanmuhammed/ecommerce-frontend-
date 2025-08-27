import axios from "../Api/axiosSetup";

const BASE_URL = "/admin/AdminProducts";

// Fetch all products
export const getAllProducts = async () => {
  return await axios.get(BASE_URL);
};

// Fetch products by category
export const getProductsByCategory = async (categoryId) => {
  return await axios.get(`${BASE_URL}/category/${categoryId}`);
};

// Create new product
export const createProduct = async (productData) => {
  return await axios.post(BASE_URL, productData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Update product
export const updateProduct = async (id, productData) => {
  return await axios.put(`${BASE_URL}/${id}`, productData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Delete product
export const deleteProduct = async (id) => {
  return await axios.delete(`${BASE_URL}/${id}`);
};
