import { useState, useEffect, useRef } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { optimizeImageUrl, createBlurPlaceholder } from '../utils/imageOptimizer';

/**
 * Optimized Image Component
 * Handles lazy loading, responsive images, and format optimization
 */
function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 80,
  sizes,
  objectFit = 'cover',
  onLoad,
  onError,
  placeholder = 'blur',
  ...props
}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Optimize image URL
    const optimized = optimizeImageUrl(src, {
      width,
      height,
      quality,
      format: 'auto',
      fit: objectFit
    });
    
    setImageSrc(optimized);
  }, [src, width, height, quality, objectFit]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) onError(e);
  };

  // Generate placeholder
  const placeholderSrc = placeholder === 'blur' 
    ? createBlurPlaceholder(10, 10)
    : placeholder;

  if (hasError) {
    return (
      <div 
        className={`image-error ${className}`}
        style={{
          width: width || '100%',
          height: height || 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.1)',
          color: 'rgba(255, 255, 255, 0.5)'
        }}
      >
        <i className="fas fa-image" style={{ fontSize: '2rem' }}></i>
      </div>
    );
  }

  if (priority) {
    // High priority images load immediately
    return (
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`optimized-image ${className} ${isLoaded ? 'loaded' : ''}`}
        style={{ objectFit }}
        onLoad={handleLoad}
        onError={handleError}
        loading="eager"
        fetchpriority="high"
        {...props}
      />
    );
  }

  // Lazy load images
  return (
    <LazyLoadImage
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={`optimized-image ${className}`}
      style={{ objectFit }}
      effect="blur"
      placeholderSrc={placeholderSrc}
      threshold={100}
      onLoad={handleLoad}
      onError={handleError}
      wrapperClassName="optimized-image-wrapper"
      {...props}
    />
  );
}

export default OptimizedImage;
