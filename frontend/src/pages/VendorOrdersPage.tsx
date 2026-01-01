import { useAuth } from '../contexts/AuthContext';

const VendorOrdersPage = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>Vendor Orders</h1>
      <p>Manage orders for your products and track sales.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <p>No orders received yet. Start selling to see orders here!</p>
      </div>
    </div>
  );
};

export default VendorOrdersPage;