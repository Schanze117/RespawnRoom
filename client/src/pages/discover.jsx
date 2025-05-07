import DiscoverForm from '../components/discoverForm';

export default function Discover() {


    return (
        <div className="mt-20 md:ml-55 sm:mr-4 bg-surface-900 border-2 rounded-lg border-tonal-800 height-full max-[375px]:w-fit max-sm:w-full md:w-dwv">
            <h1 className="text-3xl font-bold text-light px-5 py-3">Discover</h1>
            <DiscoverForm />
            
        </div>
    )
}


// Seperate search form into a new component
// Seperate discover form into a new component