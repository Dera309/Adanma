import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: '300px', margin: '0 0.5rem' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for products..."
        style={{
          flex: 1,
          padding: '0.4rem 0.8rem',
          border: '1px solid #ddd',
          borderRadius: '4px 0 0 4px',
          fontSize: '0.9rem',
          outline: 'none'
        }}
      />
      <button
        type="submit"
        style={{
          padding: '0.4rem 0.8rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '0 4px 4px 0',
          cursor: 'pointer',
          fontSize: '0.9rem'
        }}
      >
        🔍
      </button>
    </form>
  );
};

export default SearchBar;