import React, { memo } from 'react';
import './Form.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input: React.FC<InputProps> = memo(({ 
  label, 
  error, 
  helperText, 
  className = '', 
  ...props 
}) => {
  const inputId = props.id || props.name;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {props.required && <span className="required" aria-label="required">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        className={`form-input ${error ? 'form-input-error' : ''}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      
      {error && (
        <span 
          id={errorId}
          className="form-error-text" 
          role="alert" 
          aria-live="polite"
        >
          {error}
        </span>
      )}
      {!error && helperText && (
        <span 
          id={helperId}
          className="form-helper-text"
        >
          {helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
