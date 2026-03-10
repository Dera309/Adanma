import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const query = searchParams.get('q') || '';

  useEffect(() => {
    const searchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        const result = await response.json();
        if (result.success) {
          setProducts(result.data.products);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      searchProducts();
    } else {
      setLoading(false);
    }
  }, [query]);

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart!');
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Searching...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Search Results for "{query}"</h1>
      <p>{products.length} products found</p>
      
      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <p>No products found matching your search.</p>
          <p>Try different keywords or browse our categories.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          {products.map(product => (
            <div key={product.id} style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '1rem',
              backgroundColor: 'white'
            }}>
              <img 
                src={product.image} 
                alt={product.name}
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <h3 style={{ margin: '1rem 0 0.5rem 0' }}>{product.name}</h3>
              <p style={{ color: '#666', margin: '0.5rem 0' }}>{product.category}</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#007bff', margin: '0.5rem 0' }}>
                ${product.price.toFixed(2)}
              </p>
              <button
                onClick={() => addToCart(product)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;