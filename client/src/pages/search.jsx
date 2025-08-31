import { lazy, Suspense } from 'react';

// Lazy load the SearchForm component
const SearchForm = lazy(() => import('../components/searchForm'));

// Custom search skeleton that matches the exact layout
const SearchSkeleton = () => (
    <div className="flex flex-col w-full">
        {/* Review toggle skeleton - top right */}
        <div className="flex justify-end mb-2 px-4 pt-4">
            <div className="w-24 h-6 bg-surface-700 rounded animate-pulse"></div>
        </div>
        
        {/* Search form skeleton */}
        <div className="px-4 py-4">
            <div className="relative w-full">
                {/* Search input skeleton */}
                <div className="w-full h-12 bg-surface-700 rounded-lg animate-pulse relative">
                    {/* Magnifying glass icon skeleton */}
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-surface-600 rounded-full animate-pulse"></div>
                    {/* Placeholder text skeleton */}
                    <div className="absolute left-12 top-1/2 transform -translate-y-1/2 w-32 h-4 bg-surface-600 rounded animate-pulse"></div>
                </div>
                
                {/* Search button skeleton - positioned on right */}
                <div className="absolute right-2 bottom-2 w-20 h-8 bg-surface-600 rounded-lg animate-pulse"></div>
            </div>
        </div>
        
        {/* Empty content area - same size but no skeleton */}
        <div className="w-full p-4 min-h-[200px]">
        </div>

    </div>
);

export default function Search() {
    return (
        <div className="page-container flex-1 pt- md:pl-">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-surface-900 border-2 rounded-lg border-tonal-800 shadow-lg overflow-hidden mb-6">
                    <h1 className="text-3xl font-bold text-light px-5 py-3 border-b border-tonal-800 z-10 relative">Search</h1>
                    <Suspense fallback={<SearchSkeleton />}>
                        <SearchForm />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}