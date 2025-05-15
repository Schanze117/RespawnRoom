import { lazy, Suspense } from 'react';
import { PageSkeleton } from '../utils/LoadingSkeletons';

// Lazy load the SearchForm component
const SearchForm = lazy(() => import('../components/searchForm'));

export default function Search() {
    return (
        <div className="page-container flex-1 pt-20 md:pl-64">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-surface-900 border-2 rounded-lg border-tonal-800 shadow-lg overflow-hidden mb-6">
                    <h1 className="text-3xl font-bold text-light px-5 py-3 border-b border-tonal-800 z-10 relative">Search Game</h1>
                    <Suspense fallback={<PageSkeleton />}>
                        <SearchForm />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}