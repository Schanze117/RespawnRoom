import { lazy, Suspense, useState, useEffect } from 'react';
import { ConsistentPageLoader } from '../utils/LoadingSkeletons';

// Lazy load the DiscoverForm component
const DiscoverForm = lazy(() => import('../components/discoverForm'));

// Loading component that maintains the app's appearance
const LoadingFallback = () => {
  const [showContent, setShowContent] = useState(false);
  
  // Add 2-second delay for testing
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  
  if (!showContent) {
    return <ConsistentPageLoader title="Discover" />;
  }
  
  return (
    <div className="w-full p-4 min-h-[200px]">
      <div className="text-center py-8 animate-pulse">
        <div className="h-6 bg-surface-700 rounded w-48 mx-auto"></div>
      </div>
    </div>
  );
};

export default function Discover() {
    return (
        <div className="page-container w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-surface-900 border-2 rounded-lg border-tonal-800 shadow-lg overflow-hidden mb-6">
                    <h1 className="text-3xl font-bold text-light px-5 py-3 border-b border-tonal-800 z-10 relative">Discover</h1>
                    <Suspense fallback={<LoadingFallback />}>
                        <DiscoverForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}


// Seperate search form into a new component
// Seperate discover form into a new component