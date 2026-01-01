import React from 'react';
import './Form.css';

interface FormSuccessProps {
  message: string;
  onClose?: () => void;
}

const FormSuccess: React.FC<FormSuccessProps> = ({ message, onClose }) => {
  if (!message) {
    return null;
  }

  return (
    <div className="form-message form-message-success">
      <div className="form-message-content">
        <span className="form-message-icon">✓</span>
        <div className="form-message-text">
          <p>{message}</p>
        </div>
      </div>
      {onClose && (
        <button 
          className="form-message-close" 
          onClick={onClose}
          aria-label="Close success message"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default FormSuccess;
