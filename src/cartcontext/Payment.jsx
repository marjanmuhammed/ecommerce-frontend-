<script src="https://checkout.razorpay.com/v1/checkout.js"></script>

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { fetchUserProfile } from "../Api/userApi";
import { fetchAddresses, addAddress, updateAddress, deleteAddress } from "../Api/addressApi";
import { getUserCart,removeCartItem } from "../Api/cartApi";
import { createOrder } from "../Api/orderApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RAZORPAY_KEY_ID = "rzp_test_R8s9mangMgbzCb";

const Payment = () => {
  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [newAddress, setNewAddress] = useState({ fullName:"", email:"", phoneNumber:"", addressLine:"", pincode:"" });
  const [userProfile, setUserProfile] = useState(null);
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isAddressValid = newAddress.fullName && newAddress.email && newAddress.phoneNumber && newAddress.addressLine && newAddress.pincode;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const profileRes = await fetchUserProfile();
        setUserProfile(profileRes.data);

        const cartRes = await getUserCart();
        const dbCart = cartRes.data.map(item => ({ ...item, productQuantity: item.quantity }));
        setCart(dbCart);
        if (!dbCart.length) navigate("/");

        await loadAddresses(profileRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const loadAddresses = async (profile) => {
    try {
      const res = await fetchAddresses();
      const addrData = res.data || [];
      setAddresses(addrData);

      if (addrData.length > 0) {
        setSelectedAddress(addrData[0]);
        setShowNewAddressForm(false);
      } else {
        setShowNewAddressForm(true);
      }

      setNewAddress(prev => ({ ...prev, fullName: profile.fullName || "", email: profile.email || "" }));
    } catch (err) {
      console.error("Error loading addresses:", err);
      setShowNewAddressForm(true);
    }
  };

  const handleSaveAddress = async () => {
    if (!isAddressValid) return;
    try {
      const payload = { ...newAddress, id: editingAddressId || 0 };
      if (editingAddressId) await updateAddress(editingAddressId, payload);
      else await addAddress(payload);

      await loadAddresses(userProfile);
      setNewAddress({ fullName: userProfile?.fullName || "", email: userProfile?.email || "", phoneNumber:"", addressLine:"", pincode:"" });
      setShowNewAddressForm(false);
      setEditingAddressId(null);
    } catch (err) {
      console.error("Error saving address:", err.response?.data || err.message);
      setError("Failed to save address. Please try again.");
    }
  };

  const handleEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    setNewAddress({ ...addr });
    setShowNewAddressForm(true);
  };
const handleDeleteAddress = async (addrId) => {
  try {
    await deleteAddress(addrId);
    const updatedAddresses = addresses.filter(a => a.id !== addrId);
    setAddresses(updatedAddresses);
    setSelectedAddress(updatedAddresses[0] || null);
    if (updatedAddresses.length === 0) setShowNewAddressForm(true);
  } catch (err) {
    console.error("Error deleting address:", err.response?.data || err.message);

    // Show backend message if available
    if (err.response?.status === 500) {
      setError("This address cannot be deleted because it is linked to an order.");
    } else {
      setError("Failed to delete address. Please try again.");
    }
  }
};


  const getSubtotal = () => cart.reduce((t,i) => t + i.productPrice*i.productQuantity, 0);
  const getTotalPrice = () => paymentMethod==="Cash on Delivery"? getSubtotal()*1.05 : getSubtotal();
const handlePlaceOrder = async (paymentStatus="Pending", paymentId=null, razorpaySignature=null) => {
  if (!cart.length) return setError("Cart is empty");
  if (!selectedAddress && !isAddressValid) return setError("Please provide a valid delivery address");

  // Use selectedAddress if it exists, otherwise newAddress
  const orderAddress = selectedAddress ? selectedAddress : { ...newAddress };

  const orderData = {
    orderItems: cart.map(item => ({
      productId: item.productId || item.id,
      quantity: item.productQuantity > 0 ? item.productQuantity : 1
    })),
      paymentMethod, 
    paymentStatus,
    paymentId,
    razorpaySignature,
    address: orderAddress
  };

  try {
    const res = await createOrder(orderData);
    console.log("Order created successfully:", res.data);

    // Remove items from cart
    for (let item of cart) {
      try {
        await removeCartItem(item.id || item.productId);
      } catch (err) {
        console.error("Failed to remove cart item:", err);
      }
    }

    setCart([]);
    toast.success("🎉 Order placed successfully!", {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
    });
    navigate("/orders", { state: { orderId: res.data.orderId } });
  } catch (err) {
    console.error("Error placing order:", err.response?.data || err.message);
    if(err.response?.data?.errors) console.error("Backend Validation Errors:", err.response.data.errors);
    setError("Failed to place order: " + (err.response?.data?.message || "Check console for details."));
  }
};


  const initiateRazorpayPayment = async () => {
    setIsProcessingPayment(true);
    try {
      const amount = Math.round(getTotalPrice()*100);
      const options = {
        key: RAZORPAY_KEY_ID,
        amount,
        currency: "INR",
        name: "Shoe's Store",
        description: "Order Payment",
        handler: function(response){
          handlePlaceOrder("Paid", response.razorpay_payment_id, response.razorpay_signature)
            .then(()=>console.log("Order placed after payment"))
            .catch(err=>console.error("Failed after payment:", err));
        },
        prefill: {
          name: userProfile?.fullName || "",
          email: userProfile?.email || "",
          contact: selectedAddress?.phoneNumber || newAddress.phoneNumber || ""
        },
        theme: { color: "#3399cc" }
      };
      new window.Razorpay(options).open();
    } catch(err){
      console.error("Payment initiation error:", err);
      setError("Failed to initiate payment. Please try again.");
    } finally{
      setIsProcessingPayment(false);
    }
  };

  if(isLoading) return <div className="min-h-screen flex justify-center items-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start p-6">
      <div className="max-w-4xl w-full bg-white p-6 rounded-lg shadow-lg">

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error} <button onClick={() => setError("")} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Step 1: Address */}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold mb-6 border-b pb-2">Delivery Address</h2>

            {addresses.length > 0 && !showNewAddressForm && (
              <div className="space-y-4 mb-6">
                {addresses.map(addr => (
                  <div key={addr.id} className={`border p-4 rounded-lg ${selectedAddress?.id === addr.id ? "border-blue-500 bg-blue-50" : ""}`}>
                    <p className="font-bold">{addr.fullName}</p>
                    <p>{addr.addressLine}, {addr.pincode}</p>
                    <p>Mobile: {addr.phoneNumber}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => setSelectedAddress(addr)} className={`px-3 py-1 rounded ${selectedAddress?.id === addr.id ? "bg-green-500 text-white" : "bg-blue-500 text-white"}`}>{selectedAddress?.id === addr.id ? "Selected" : "Choose"}</button>
                      <button onClick={() => handleEditAddress(addr)} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
                      <button onClick={() => handleDeleteAddress(addr.id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => {setShowNewAddressForm(!showNewAddressForm); setEditingAddressId(null)}} className="text-blue-500 mb-4">
              {showNewAddressForm ? "← Choose saved address" : "+ Add new address"}
            </button>

            {showNewAddressForm && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <input type="text" placeholder="Full Name" value={newAddress.fullName} onChange={e => setNewAddress({...newAddress, fullName:e.target.value})} className="border p-3 rounded" required />
                <input type="email" placeholder="Email" value={newAddress.email} onChange={e => setNewAddress({...newAddress, email:e.target.value})} className="border p-3 rounded" required />
                <input type="tel" placeholder="Phone" value={newAddress.phoneNumber} onChange={e => setNewAddress({...newAddress, phoneNumber:e.target.value})} className="border p-3 rounded" required />
                <input type="text" placeholder="Pincode" value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode:e.target.value})} className="border p-3 rounded" required />
                <input type="text" placeholder="Address" value={newAddress.addressLine} onChange={e => setNewAddress({...newAddress, addressLine:e.target.value})} className="border p-3 rounded col-span-2" required />
                <button onClick={handleSaveAddress} disabled={!isAddressValid} className={`px-6 py-2 rounded font-semibold ${isAddressValid ? "bg-green-500 text-white" : "bg-gray-300"}`}>Save</button>
              </div>
            )}

            {!showNewAddressForm && (
              <button onClick={() => setStep(2)} disabled={!selectedAddress && !isAddressValid} className="bg-blue-500 text-white px-6 py-2 rounded">Continue to Payment</button>
            )}
          </>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold mb-6 border-b pb-2">Payment Method</h2>
            <div className="flex gap-4 mb-6">
              <button onClick={() => setPaymentMethod("Cash on Delivery")} className={`px-6 py-3 rounded border ${paymentMethod==="Cash on Delivery"?"bg-green-500 text-white":"hover:bg-gray-100"}`}>Cash on Delivery (+5%)</button>
              <button onClick={() => setPaymentMethod("Online Payment")} className={`px-6 py-3 rounded border ${paymentMethod==="Online Payment"?"bg-blue-500 text-white":"hover:bg-gray-100"}`}>Online Payment</button>
            </div>

            <div className="border rounded-lg p-4 shadow-md mb-4">
              <h3 className="font-semibold">Delivery to:</h3>
              <p>{selectedAddress ? selectedAddress.fullName : newAddress.fullName}</p>
              <p>{selectedAddress ? selectedAddress.addressLine : newAddress.addressLine}, {selectedAddress ? selectedAddress.pincode : newAddress.pincode}</p>
              <p>Mobile: {selectedAddress ? selectedAddress.phoneNumber : newAddress.phoneNumber}</p>
              <button onClick={()=>setStep(1)} className="text-blue-500 text-sm mt-2">Change address</button>
            </div>

            <div className="border rounded-lg p-4 shadow-md mb-4">
              <h2 className="text-xl font-bold mb-3">Order Summary</h2>
              {cart.map((item,index)=>(<div key={index} className="flex justify-between py-2 border-b"><span>{item.productName} x {item.productQuantity}</span><span>₹{item.productPrice*item.productQuantity}</span></div>))}
              <div className="flex justify-between font-semibold mt-2"><span>Subtotal:</span><span>₹{getSubtotal()}</span></div>
              {paymentMethod==="Cash on Delivery" && <div className="flex justify-between text-sm text-gray-600">COD Fee 5%: <span>₹{Math.round(getSubtotal()*0.05)}</span></div>}
              <div className="flex justify-between font-bold mt-2">Grand Total:<span>₹{Math.round(getTotalPrice())}</span></div>
            </div>

            {paymentMethod==="Online Payment" ? (
              <button onClick={initiateRazorpayPayment} disabled={isProcessingPayment} className="bg-blue-600 text-white px-6 py-3 rounded w-full">{isProcessingPayment?"Processing...":"Pay Now"}</button>
            ) : paymentMethod==="Cash on Delivery" ? (
              <button onClick={()=>handlePlaceOrder("Pending")} className="bg-orange-500 text-white px-6 py-3 rounded w-full">Place Order</button>
            ) : (
              <p className="text-red-600 font-bold text-center mt-2">Please select a payment method</p>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default Payment;
