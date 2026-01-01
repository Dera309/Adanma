import { useAuth } from '../contexts/AuthContext';

const VendorProductsPage = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>My Products</h1>
      <p>Manage your product listings and inventory.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <p>No products listed yet. Add your first product to start selling!</p>
      </div>
    </div>
  );
};

export default VendorProductsPage;