import React, { useState, useEffect } from 'react';

const AboutPage: React.FC = () => {
  const [content, setContent] = useState({ title: 'About Adanma', content: 'Loading...' });

  useEffect(() => {
    fetch('http://localhost:5001/api/content/about')
      .then(res => res.json())
      .then(data => data.success && setContent(data.data))
      .catch(() => {});
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>{content.title}</h1>
      <div style={{ whiteSpace: 'pre-line' }}>{content.content}</div>
    </div>
  );
};

export default AboutPage;