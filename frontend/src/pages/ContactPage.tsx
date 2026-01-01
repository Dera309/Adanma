import React from 'react';

const ContactPage: React.FC = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Contact Us</h1>
      <p>Get in touch with the Adanma team.</p>
      <div style={{ marginTop: '20px' }}>
        <p><strong>Email:</strong> support@adanma.com</p>
        <p><strong>Phone:</strong> +234 123 456 7890</p>
        <p><strong>Address:</strong> Lagos, Nigeria</p>
      </div>
    </div>
  );
};

export default ContactPage;