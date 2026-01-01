import { useState, useEffect, useRef, memo } from 'react';
import './OptimizedImage.css';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  lazy?: boolean;
  aspectRatio?: string; // e.g., "16/9", "4/3", "1/1"
}

/**
 * Optimized image component with lazy loading and placeholder support
 */
const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  src,
  alt,
  placeholder,
  lazy = true,
  aspectRatio,
  className = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px' // Start loading 50px before image enters viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
  };

  const containerStyle = aspectRatio
    ? { aspectRatio }
    : undefined;

  return (
    <div 
      className={`optimized-image-container ${className}`}
      style={containerStyle}
    >
      {!isLoaded && !error && (
        <div className="optimized-image-placeholder">
          {placeholder ? (
            <img 
              src={placeholder} 
              alt="" 
              aria-hidden="true"
              className="placeholder-img"
            />
          ) : (
            <div className="placeholder-shimmer" />
          )}
        </div>
      )}
      
      {error ? (
        <div className="optimized-image-error" role="img" aria-label={alt}>
          <span>Failed to load image</span>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={isInView ? src : undefined}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`optimized-image ${isLoaded ? 'loaded' : ''}`}
          loading={lazy ? 'lazy' : 'eager'}
          {...props}
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;