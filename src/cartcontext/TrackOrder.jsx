import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, ProgressBar, Badge } from 'react-bootstrap';
import { 
  Truck, 
  Box, 
  Clock, 
  CheckCircle, 
  GeoAlt, 
  Telephone, 
  Chat, 
  Envelope,
  House,
  Person,
  ListCheck,
  ArrowLeft
} from 'react-bootstrap-icons';
import api from '../Api/axiosSetup';
import TrackOrderNavbar from './Trackordernavbar';

const TrackOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // Get the specific order details
        const response = await api.get(`/orders/${orderId}`);
        setOrder(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching order details:", error);
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}, ${date.toLocaleTimeString()}`;
  };

  const getDeliveryDate = (orderDate) => {
    const date = new Date(orderDate);
    date.setDate(date.getDate() + 4);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const stages = [
    { name: "Confirmed", icon: <CheckCircle size={20} /> },
    { name: "Processing", icon: <ListCheck size={20} /> },
    { name: "Shipped", icon: <Truck size={20} /> },
    { name: "Out for Delivery", icon: <GeoAlt size={20} /> },
    { name: "Delivered", icon: <Box size={20} /> }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-gray-600">Loading your order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800">Order not found</h3>
          <button 
            onClick={() => navigate('/orders')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const currentStageIndex = stages.findIndex(stage => stage.name === order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <TrackOrderNavbar/>

      <Container className="py-8">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/orders')}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-800 transition"
        >
          <ArrowLeft className="mr-2" /> Back to Orders
        </button>

        {/* Header */}
        <Card className="mb-4 shadow-sm border-0">
          <Card.Body className="p-4">
            <Row className="align-items-center">
              <Col md={8}>
                <h2 className="mb-1 d-flex align-items-center">
                  <Truck className="text-indigo-600 me-2" />
                  Track Your Order
                </h2>
                <p className="text-muted mb-0">Tracking ID: {order.trackingNumber || `TRK${order.id}789`}</p>
              </Col>
              <Col md={4} className="text-md-end">
                <p className="text-muted mb-1">Estimated Delivery</p>
                <p className="h5 text-indigo-600 mb-0">{getDeliveryDate(order.orderDate)}</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Row>
          <Col lg={8}>
            {/* Order Summary */}
            <Card className="mb-4 shadow-sm border-0">
              <Card.Body className="p-4">
                <h5 className="mb-3 d-flex align-items-center">
                  <Box className="text-indigo-600 me-2" />
                  Order Summary
                </h5>
                <Row>
                  <Col md={6} className="mb-3">
                    <p className="text-muted mb-1">Order ID</p>
                    <p className="fw-semibold">{order.id}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted mb-1">Order Date</p>
                    <p className="fw-semibold">{formatDateTime(order.orderDate)}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted mb-1">Shipping Address</p>
                    <p className="fw-semibold">
                      {order.address.fullName},<br />
                      {order.address.addressLine},<br />
                      {order.address.pincode}, {order.address.state || ''}
                    </p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <p className="text-muted mb-1">Carrier</p>
                    <Badge bg="primary" className="fs-6 py-2">
                      {order.carrier || "SpeedyExpress"}
                    </Badge>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Order Status Timeline */}
            <Card className="mb-4 shadow-sm border-0">
              <Card.Body className="p-4">
                <h5 className="mb-4 d-flex align-items-center">
                  <ListCheck className="text-indigo-600 me-2" />
                  Order Status
                </h5>
                
                <div className="position-relative">
                  {/* Progress line */}
                  <div className="position-absolute top-50 start-0 end-0 translate-middle-y">
                    <ProgressBar 
                      now={(currentStageIndex / (stages.length - 1)) * 100} 
                      className="mb-4"
                      style={{ height: '4px' }}
                    />
                  </div>
                  
                  <div className="d-flex justify-content-between position-relative">
                    {stages.map((stage, index) => {
                      const isCompleted = index < currentStageIndex;
                      const isCurrent = index === currentStageIndex;
                      
                      return (
                        <div key={index} className="text-center" style={{ width: '20%' }}>
                          <div className={`d-inline-flex align-items-center justify-content-center rounded-circle mb-2 
                            ${isCompleted ? 'bg-success' : isCurrent ? 'bg-primary' : 'bg-secondary'} 
                            ${isCurrent ? 'pulse-dot' : ''}`}
                            style={{ width: '40px', height: '40px' }}
                          >
                            {React.cloneElement(stage.icon, { 
                              className: `text-white ${isCurrent ? 'animate-blink' : ''}` 
                            })}
                          </div>
                          <p className={`fw-semibold mb-1 ${isCompleted ? 'text-success' : isCurrent ? 'text-primary' : 'text-muted'}`}>
                            {stage.name}
                          </p>
                         <p className="text-muted small">
  {order.timeline && order.timeline[stage.name.toLowerCase().replace(/\s+/g, '')] 
    ? formatDateTime(order.timeline[stage.name.toLowerCase().replace(/\s+/g, '')])
    : stage.name === "Confirmed"
      ? formatDateTime(order.orderDate)
      : "N/A"
  }
</p>

                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Ordered Items */}
            <Card className="shadow-sm border-0">
              <Card.Body className="p-4">
                <h5 className="mb-4 d-flex align-items-center">
                  <Box className="text-indigo-600 me-2" />
                  Items in this order
                </h5>
                <Row>
                  {order.items.map((item, index) => (
                    <Col md={6} key={index} className="mb-3">
                      <div className="d-flex bg-light p-3 rounded">
                        <img 
                          src={item.imageUrl || "https://via.placeholder.com/100"} 
                          alt={item.name} 
                          className="w-20 h-20 object-contain rounded me-3"
                        />
                        <div>
                          <h6 className="mb-1">{item.name}</h6>
                          {item.description && (
                            <p className="text-muted small mb-1">{item.description}</p>
                          )}
                          <p className="text-muted mb-1">
                          Price  ₹{item.price}  x {item.quantity}
                          </p>
                          <p className="fw-semibold mb-0">Grant Total : ₹{item.totalPrice}</p>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            {/* Support Card */}
            <Card className="shadow-sm border-0 sticky-top" style={{ top: '20px' }}>
              <Card.Body className="p-4">
                <h5 className="mb-3 d-flex align-items-center">
                  <Telephone className="text-indigo-600 me-2" />
                  Need Help?
                </h5>
                <p className="text-muted">
                  If you have any questions about your delivery, contact our support team
                </p>
                
                <div className="d-grid gap-2">
                  <button className="btn btn-primary d-flex align-items-center justify-content-center">
                    <Telephone className="me-2" />
                    Call Support
                  </button>
                  <button className="btn btn-outline-primary d-flex align-items-center justify-content-center">
                    <Chat className="me-2" />
                    Chat with us
                  </button>
                  <button className="btn btn-outline-primary d-flex align-items-center justify-content-center">
                    <Envelope className="me-2" />
                    Email Support
                  </button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <style>{`
        .pulse-dot {
          animation: pulse 1.5s infinite;
        }
        
        .animate-blink {
          animation: blink 1s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TrackOrder;