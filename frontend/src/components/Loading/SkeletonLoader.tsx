import React, { memo } from 'react';
import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  variant?: 'text' | 'rectangular' | 'circular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
  animate?: boolean;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = memo(({
  variant = 'text',
  width,
  height,
  lines = 1,
  className = '',
  animate = true
}) => {
  const getStyle = () => {
    const style: React.CSSProperties = {};
    
    if (width) {
      style.width = typeof width === 'number' ? `${width}px` : width;
    }
    
    if (height) {
      style.height = typeof height === 'number' ? `${height}px` : height;
    }
    
    return style;
  };

  const renderSkeleton = () => {
    const baseClasses = `skeleton skeleton-${variant} ${animate ? 'skeleton-animate' : ''} ${className}`;
    
    if (variant === 'text' && lines > 1) {
      return (
        <div className="skeleton-text-container">
          {Array.from({ length: lines }, (_, index) => (
            <div
              key={index}
              className={`${baseClasses} ${index === lines - 1 ? 'skeleton-text-last' : ''}`}
              style={getStyle()}
            />
          ))}
        </div>
      );
    }

    if (variant === 'card') {
      return (
        <div className={`skeleton-card ${animate ? 'skeleton-animate' : ''} ${className}`} style={getStyle()}>
          <div className="skeleton-card-header">
            <div className="skeleton skeleton-circular" style={{ width: '40px', height: '40px' }} />
            <div className="skeleton-card-title">
              <div className="skeleton skeleton-text" style={{ width: '60%', height: '16px' }} />
              <div className="skeleton skeleton-text" style={{ width: '40%', height: '14px' }} />
            </div>
          </div>
          <div className="skeleton-card-content">
            <div className="skeleton skeleton-text" style={{ width: '100%', height: '14px' }} />
            <div className="skeleton skeleton-text" style={{ width: '80%', height: '14px' }} />
            <div className="skeleton skeleton-text" style={{ width: '60%', height: '14px' }} />
          </div>
        </div>
      );
    }

    return (
      <div className={baseClasses} style={getStyle()} />
    );
  };

  const skeletonElement = renderSkeleton();
  
  // Add accessibility attributes to the skeleton element
  if (React.isValidElement(skeletonElement)) {
    return React.cloneElement(skeletonElement as React.ReactElement<any>, {
      'aria-label': 'Loading content',
      'aria-busy': 'true',
      role: 'status'
    } as any);
  }
  
  return skeletonElement;
});

SkeletonLoader.displayName = 'SkeletonLoader';

export default SkeletonLoader;