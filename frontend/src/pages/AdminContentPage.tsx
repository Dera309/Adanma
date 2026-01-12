import React, { useState, useEffect } from 'react';

interface ContentItem {
  title: string;
  content: string;
}

const AdminContentPage: React.FC = () => {
  const [contents, setContents] = useState<{[key: string]: ContentItem}>({});
  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(false);

  const contentTypes = [
    { key: 'about', label: 'About' },
    { key: 'terms', label: 'Terms of Service' },
    { key: 'privacy', label: 'Privacy Policy' },
    { key: 'contact', label: 'Contact' }
  ];

  useEffect(() => {
    loadAllContent();
  }, []);

  const loadAllContent = async () => {
    for (const type of contentTypes) {
      try {
        const response = await fetch(`/api/content/${type.key}`);
        const data = await response.json();
        if (data.success) {
          setContents(prev => ({ ...prev, [type.key]: data.data }));
        }
      } catch (error) {
        console.error(`Failed to load ${type.key}:`, error);
      }
    }
  };

  const saveContent = async (type: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/content/${type}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contents[type])
      });

      const data = await response.json();
      if (data.success) {
        alert('Content saved successfully!');
      } else {
        alert('Failed to save content');
      }
    } catch (error) {
      alert('Error saving content');
    } finally {
      setLoading(false);
    }
  };

  const updateContent = (type: string, field: 'title' | 'content', value: string) => {
    setContents(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Content Management</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {contentTypes.map(type => (
          <button
            key={type.key}
            onClick={() => setActiveTab(type.key)}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === type.key ? '#10b981' : '#f3f4f6',
              color: activeTab === type.key ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {type.label}
          </button>
        ))}
      </div>

      {contents[activeTab] && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Title:</label>
            <input
              type="text"
              value={contents[activeTab].title}
              onChange={(e) => updateContent(activeTab, 'title', e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Content:</label>
            <textarea
              value={contents[activeTab].content}
              onChange={(e) => updateContent(activeTab, 'content', e.target.value)}
              rows={10}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
            />
          </div>
          
          <button
            onClick={() => saveContent(activeTab)}
            disabled={loading}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminContentPage;