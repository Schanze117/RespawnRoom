import SearchForm from '../components/searchForm';

export default function Search() {


    return (
        <div className="mt-20 md:ml-55 sm:mr-4 bg-surface-900 border-2 rounded-lg border-tonal-800 height-full max-[375px]:w-fit max-sm:w-full md:w-dwv">
            <h1 className="text-3xl font-bold text-light px-5 pt-3">Search Game</h1>
            <SearchForm />       
        </div>
    )
}