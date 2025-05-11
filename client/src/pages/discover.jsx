import DiscoverForm from '../components/discoverForm';

export default function Discover() {
    return (
        <div className="page-container flex-1 pt-20 md:pl-64 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-surface-900 border-2 rounded-lg border-tonal-800 shadow-lg overflow-hidden mb-6">
                    <h1 className="text-3xl font-bold text-light px-5 py-3 border-b border-tonal-800 z-10 relative">Discover</h1>
                    <DiscoverForm />
                </div>
            </div>
        </div>
    );
}


// Seperate search form into a new component
// Seperate discover form into a new component