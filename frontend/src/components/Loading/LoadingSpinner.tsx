import { memo } from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({
  size = 'medium',
  color = 'primary',
  className = ''
}) => {
  return (
    <div 
      className={`loading-spinner loading-spinner-${size} loading-spinner-${color} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <div className="spinner" aria-hidden="true"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;