import { lazy, Suspense } from 'react';

// Lazy load the SearchForm component
const SearchForm = lazy(() => import('../components/searchForm'));

// Loading component that maintains the app's appearance
const LoadingFallback = () => (
  <div className="p-4 min-h-[200px]">
    <div className="animate-pulse flex flex-col space-y-4">
      <div className="h-4 bg-surface-800 rounded w-3/4"></div>
      <div className="h-4 bg-surface-800 rounded"></div>
      <div className="h-4 bg-surface-800 rounded w-5/6"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-32 bg-surface-800 rounded"></div>
        ))}
      </div>
    </div>
  </div>
);

export default function Search() {
    return (
        <div className="page-container flex-1 pt-20 md:pl-64 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-surface-900 border-2 rounded-lg border-tonal-800 shadow-lg overflow-hidden mb-6">
                    <h1 className="text-3xl font-bold text-light px-5 py-3 border-b border-tonal-800 z-10 relative">Search Game</h1>
                    <Suspense fallback={<LoadingFallback />}>
                        <SearchForm />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}