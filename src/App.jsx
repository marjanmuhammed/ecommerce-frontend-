import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./auth/Register";
import Login from "./auth/Login";
import Home from "./pages/Home";
import About from "./pages/About";
import Men from "./pages/Men";
import Women from "./pages/Women";
import BestDeals from './pages/BestDeals'
import OurStory from "./pages/Ourstory";
import Contact from "./pages/Contact";
import Cart from "./cartcontext/Cart";
import ProductProvider from "./ProductContext/ProductContext";
import Orders from "./cartcontext/Orders";
import TrackOrder from "./cartcontext/TrackOrder";
import AdminDashboard from "./Admin/Dashbord";
import ManageProducts from "./Admin/ManageProducts";
import ManageUsers from "./Admin/ManageUsers";
import Wishlist from "./pages/Whishlist";
import ProfilePage from "./Userprofile/ProfilePage";
import { ToastContainer } from "react-toastify";
import Payment from "../src/cartcontext/Payment";
import TrackOrderNavbar from "./cartcontext/Trackordernavbar";





const App = () => {
  return (
    <ProductProvider>

    <Router>
      
    
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/men" element={<Men />} />
          <Route path="/women" element={<Women />} />
          <Route path="/bestdeals" element={<BestDeals/>}/>
          <Route path="/ourstory" element={<OurStory/>}/>
          <Route path="/contact" element={<Contact/>}/>
          <Route path="/cart" element={<Cart/>}/>
          <Route path="/pay" element={<Payment/>}/>  
          <Route path="/orders" element={<Orders/>}/>  
          <Route path="/track-order/:orderId" element={<TrackOrder />} /> 
          <Route path="/dashboard" element={<AdminDashboard/>}/>
          <Route path="/admin/products" element={<ManageProducts />} />
          <Route path="/admin/users" element={<ManageUsers />} /> 
          <Route path="/wishlist" element={<Wishlist />} />
           <Route path="/profile" element={<ProfilePage />} />
           <Route path="/trackordernavbar" element={<TrackOrderNavbar/>}/>

       
          
        </Routes>

     <ToastContainer
  position="top-center"  // Changed from bottom-right
  autoClose={3000}
  hideProgressBar={false}
  newestOnTop={true}     // Ensures new toasts appear on top of stack
  closeOnClick
  rtl={false}
  pauseOnFocusLoss
  draggable
  pauseOnHover
  theme="light"
/>   
     
    </Router>
    </ProductProvider>
  );
};

export default App;
