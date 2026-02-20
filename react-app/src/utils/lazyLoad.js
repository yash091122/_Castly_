import { lazy, Suspense } from 'react';
import Loader from '../components/Loader';

/**
 * Lazy load component with retry logic
 * @param {function} importFn - Dynamic import function
 * @param {number} retries - Number of retries
 * @returns {React.Component}
 */
export const lazyWithRetry = (importFn, retries = 3) => {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const attemptImport = (retriesLeft) => {
        importFn()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft === 0) {
              reject(error);
              return;
            }
            
            console.warn(`Failed to load component, retrying... (${retriesLeft} attempts left)`);
            
            // Retry after delay
            setTimeout(() => {
              attemptImport(retriesLeft - 1);
            }, 1000);
          });
      };
      
      attemptImport(retries);
    });
  });
};

/**
 * Lazy load component with preload
 * @param {function} importFn - Dynamic import function
 * @returns {object} Component with preload function
 */
export const lazyWithPreload = (importFn) => {
  let component = null;
  let promise = null;
  
  const load = () => {
    if (!promise) {
      promise = importFn().then(module => {
        component = module.default;
        return module;
      });
    }
    return promise;
  };
  
  const LazyComponent = lazy(load);
  
  LazyComponent.preload = load;
  
  return LazyComponent;
};

/**
 * Create lazy component with custom fallback
 * @param {function} importFn - Dynamic import function
 * @param {React.Component} fallback - Fallback component
 * @returns {React.Component}
 */
export const createLazyComponent = (importFn, fallback = <Loader />) => {
  const LazyComponent = lazyWithRetry(importFn);
  
  return (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Preload multiple components
 * @param {array} components - Array of lazy components
 */
export const preloadComponents = (components) => {
  components.forEach(component => {
    if (component.preload) {
      component.preload();
    }
  });
};

/**
 * Lazy load on interaction
 * @param {function} importFn - Dynamic import function
 * @param {string} event - Event name (hover, click, focus)
 * @returns {object}
 */
export const lazyOnInteraction = (importFn, event = 'hover') => {
  let component = null;
  let promise = null;
  
  const load = () => {
    if (!promise) {
      promise = importFn().then(module => {
        component = module.default;
        return module;
      });
    }
    return promise;
  };
  
  const LazyComponent = lazy(load);
  
  const InteractiveWrapper = (props) => {
    const handleInteraction = () => {
      load();
    };
    
    const eventHandlers = {
      onMouseEnter: event === 'hover' ? handleInteraction : undefined,
      onClick: event === 'click' ? handleInteraction : undefined,
      onFocus: event === 'focus' ? handleInteraction : undefined
    };
    
    return (
      <div {...eventHandlers}>
        <Suspense fallback={<Loader />}>
          <LazyComponent {...props} />
        </Suspense>
      </div>
    );
  };
  
  return InteractiveWrapper;
};

/**
 * Lazy load on viewport
 * @param {function} importFn - Dynamic import function
 * @param {object} options - IntersectionObserver options
 * @returns {React.Component}
 */
export const lazyOnViewport = (importFn, options = {}) => {
  const LazyComponent = lazy(importFn);
  
  return (props) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);
    
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        {
          rootMargin: '50px',
          ...options
        }
      );
      
      if (ref.current) {
        observer.observe(ref.current);
      }
      
      return () => observer.disconnect();
    }, []);
    
    return (
      <div ref={ref}>
        {isVisible ? (
          <Suspense fallback={<Loader />}>
            <LazyComponent {...props} />
          </Suspense>
        ) : (
          <Loader />
        )}
      </div>
    );
  };
};

/**
 * Batch lazy load components
 * @param {object} components - Object of component imports
 * @returns {object} Object of lazy components
 */
export const batchLazyLoad = (components) => {
  const lazyComponents = {};
  
  Object.keys(components).forEach(key => {
    lazyComponents[key] = lazyWithRetry(components[key]);
  });
  
  return lazyComponents;
};

export default {
  lazyWithRetry,
  lazyWithPreload,
  createLazyComponent,
  preloadComponents,
  lazyOnInteraction,
  lazyOnViewport,
  batchLazyLoad
};
