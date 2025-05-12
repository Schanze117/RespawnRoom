import { useState, useEffect, useRef } from 'react';

const LazyImage = ({ src, alt, className, placeholderClassName }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);
  
  useEffect(() => {
    // Skip if already loaded or if no src is provided
    if (isLoaded || !src) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        // When image enters viewport
        if (entries[0].isIntersecting) {
          setIsInView(true);
          // Stop observing once in view
          observer.disconnect();
        }
      },
      {
        // Start loading when image is 200px away from viewport
        rootMargin: '200px',
        threshold: 0.01,
      }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [src, isLoaded]);
  
  // Handle image load completion
  const handleImageLoaded = () => {
    setIsLoaded(true);
  };
  
  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder/skeleton while loading */}
      {!isLoaded && (
        <div 
          className={`absolute inset-0 bg-surface-800 animate-pulse ${placeholderClassName || ''}`}
        />
      )}
      
      {/* Only start loading the image when it comes into view */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={handleImageLoaded}
        />
      )}
    </div>
  );
};

export default LazyImage; 