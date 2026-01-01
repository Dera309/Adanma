import React from 'react';
import './Form.css';

interface FormErrorProps {
  message?: string;
  errors?: string[];
  onClose?: () => void;
}

const FormError: React.FC<FormErrorProps> = ({ message, errors, onClose }) => {
  if (!message && (!errors || errors.length === 0)) {
    return null;
  }

  return (
    <div className="form-message form-message-error">
      <div className="form-message-content">
        <span className="form-message-icon">⚠️</span>
        <div className="form-message-text">
          {message && <p>{message}</p>}
          {errors && errors.length > 0 && (
            <ul className="form-error-list">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {onClose && (
        <button 
          className="form-message-close" 
          onClick={onClose}
          aria-label="Close error message"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default FormError;
