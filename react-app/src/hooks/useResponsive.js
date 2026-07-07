import { useState, useEffect } from 'react';

/**
 * Custom hook to detect device type and screen size
 * @returns {Object} Device information and screen size
 */
export const useResponsive = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isLaptop: false,
    isDesktop: false,
    isTV: false,
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = width > height ? 'landscape' : 'portrait';

      setDeviceInfo({
        isMobile: width <= 767,
        isTablet: width >= 768 && width <= 1024,
        isLaptop: width >= 1025 && width <= 1920,
        isDesktop: width >= 1025 && width <= 1920,
        isTV: width >= 1921,
        width,
        height,
        orientation,
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      });
    };

    // Initial check
    handleResize();

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceInfo;
};

/**
 * Hook to get responsive breakpoint
 * @returns {string} Current breakpoint name
 */
export const useBreakpoint = () => {
  const { isMobile, isTablet, isLaptop, isTV } = useResponsive();

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  if (isLaptop) return 'laptop';
  if (isTV) return 'tv';
  return 'desktop';
};

/**
 * Hook to check if device is mobile
 * @returns {boolean} True if mobile device
 */
export const useIsMobile = () => {
  const { isMobile } = useResponsive();
  return isMobile;
};

/**
 * Hook to check if device is touch-enabled
 * @returns {boolean} True if touch device
 */
export const useIsTouchDevice = () => {
  const { isTouchDevice } = useResponsive();
  return isTouchDevice;
};

/**
 * Hook to get screen orientation
 * @returns {string} 'portrait' or 'landscape'
 */
export const useOrientation = () => {
  const { orientation } = useResponsive();
  return orientation;
};

export default useResponsive;
