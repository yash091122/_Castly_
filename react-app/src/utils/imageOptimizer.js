/**
 * Image Optimization Utilities
 * Handles lazy loading, compression, and responsive images
 */

// Image loading priorities
export const IMAGE_PRIORITY = {
  HIGH: 'high',
  LOW: 'low',
  AUTO: 'auto'
};

// Image formats
export const IMAGE_FORMAT = {
  WEBP: 'webp',
  AVIF: 'avif',
  JPEG: 'jpeg',
  PNG: 'png'
};

/**
 * Generate srcset for responsive images
 * @param {string} src - Base image URL
 * @param {array} sizes - Array of sizes [320, 640, 1024, 1920]
 * @returns {string} srcset string
 */
export const generateSrcSet = (src, sizes = [320, 640, 1024, 1920]) => {
  if (!src) return '';
  
  return sizes
    .map(size => `${src}?w=${size} ${size}w`)
    .join(', ');
};

/**
 * Generate sizes attribute for responsive images
 * @param {object} breakpoints - Breakpoints object
 * @returns {string} sizes string
 */
export const generateSizes = (breakpoints = {}) => {
  const defaultBreakpoints = {
    mobile: '(max-width: 767px) 100vw',
    tablet: '(max-width: 1024px) 50vw',
    desktop: '33vw'
  };
  
  const merged = { ...defaultBreakpoints, ...breakpoints };
  
  return Object.values(merged).join(', ');
};

/**
 * Preload critical images
 * @param {array} images - Array of image URLs
 * @param {string} priority - Loading priority
 */
export const preloadImages = (images, priority = IMAGE_PRIORITY.HIGH) => {
  if (typeof window === 'undefined') return;
  
  images.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.fetchPriority = priority;
    document.head.appendChild(link);
  });
};

/**
 * Lazy load image with IntersectionObserver
 * @param {HTMLImageElement} img - Image element
 * @param {object} options - Observer options
 */
export const lazyLoadImage = (img, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.01
  };
  
  const observerOptions = { ...defaultOptions, ...options };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const image = entry.target;
        const src = image.dataset.src;
        const srcset = image.dataset.srcset;
        
        if (src) image.src = src;
        if (srcset) image.srcset = srcset;
        
        image.classList.add('loaded');
        observer.unobserve(image);
      }
    });
  }, observerOptions);
  
  observer.observe(img);
  
  return observer;
};

/**
 * Compress image quality based on device
 * @returns {number} Quality percentage
 */
export const getOptimalQuality = () => {
  if (typeof window === 'undefined') return 80;
  
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (connection) {
    const effectiveType = connection.effectiveType;
    
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 50;
      case '3g':
        return 65;
      case '4g':
      default:
        return 80;
    }
  }
  
  return 80;
};

/**
 * Check if WebP is supported
 * @returns {Promise<boolean>}
 */
export const supportsWebP = () => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  
  return new Promise(resolve => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Check if AVIF is supported
 * @returns {Promise<boolean>}
 */
export const supportsAVIF = () => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  
  return new Promise(resolve => {
    const avif = new Image();
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2);
    };
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
};

/**
 * Get optimal image format
 * @returns {Promise<string>}
 */
export const getOptimalFormat = async () => {
  const [webp, avif] = await Promise.all([
    supportsWebP(),
    supportsAVIF()
  ]);
  
  if (avif) return IMAGE_FORMAT.AVIF;
  if (webp) return IMAGE_FORMAT.WEBP;
  return IMAGE_FORMAT.JPEG;
};

/**
 * Create blur placeholder
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} Data URL
 */
export const createBlurPlaceholder = (width = 10, height = 10) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
};

/**
 * Optimize image URL with parameters
 * @param {string} url - Image URL
 * @param {object} options - Optimization options
 * @returns {string} Optimized URL
 */
export const optimizeImageUrl = (url, options = {}) => {
  if (!url) return '';
  
  const {
    width,
    height,
    quality = getOptimalQuality(),
    format = 'auto',
    fit = 'cover'
  } = options;
  
  const params = new URLSearchParams();
  
  if (width) params.append('w', width);
  if (height) params.append('h', height);
  if (quality) params.append('q', quality);
  if (format) params.append('fm', format);
  if (fit) params.append('fit', fit);
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
};

/**
 * Batch preload images
 * @param {array} urls - Array of image URLs
 * @param {function} onProgress - Progress callback
 * @returns {Promise<array>}
 */
export const batchPreloadImages = (urls, onProgress) => {
  let loaded = 0;
  const total = urls.length;
  
  const promises = urls.map(url => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        loaded++;
        if (onProgress) onProgress(loaded, total);
        resolve(url);
      };
      
      img.onerror = () => {
        loaded++;
        if (onProgress) onProgress(loaded, total);
        reject(new Error(`Failed to load: ${url}`));
      };
      
      img.src = url;
    });
  });
  
  return Promise.allSettled(promises);
};

/**
 * Get image dimensions
 * @param {string} url - Image URL
 * @returns {Promise<object>}
 */
export const getImageDimensions = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight
      });
    };
    
    img.onerror = reject;
    img.src = url;
  });
};

export default {
  generateSrcSet,
  generateSizes,
  preloadImages,
  lazyLoadImage,
  getOptimalQuality,
  supportsWebP,
  supportsAVIF,
  getOptimalFormat,
  createBlurPlaceholder,
  optimizeImageUrl,
  batchPreloadImages,
  getImageDimensions
};
