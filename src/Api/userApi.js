// import axios from "axios";

// const API_URL = "https://localhost:7175/api/UserProfile";

// const authHeaders = (token) => ({
//   headers: { Authorization: `Bearer ${token}` },
// });

// export const fetchUserProfile = (token) => axios.get(`${API_URL}/profile`, authHeaders(token));
// // PUT update profile: api/UserProfile
// export const updateUserProfile = (token, data) => axios.put(`${API_URL}`, data, authHeaders(token));

// // PUT change password: api/UserProfile/profile/changepassword
// export const changePassword = (token, data) =>  axios.put(`${API_URL}/profile/changepassword`, data, authHeaders(token));




// // userApi.js
// import api from "../Api/axiosSetup";   // ✅ use the configured instance

// export const fetchUserProfile = () => api.get("/UserProfile/profile");

// export const updateUserProfile = (data) => api.put("/UserProfile", data);

// export const changePassword = (data) =>
//   api.put("/UserProfile/profile/changepassword", data);




import api from "../Api/axiosSetup";

export const fetchUserProfile = () => api.get("/UserProfile/profile");
export const updateUserProfile = (data) => api.put("/UserProfile", data);
export const changePassword = (data) => 
  api.put("/UserProfile/profile/changepassword", data);
