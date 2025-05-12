import { useState, useEffect, lazy, Suspense } from 'react';
import { LuSearch } from "react-icons/lu";
import { searchGames } from '../utils/api'; 
import GameCard from './card/gameCard';
import Pagination from './discoverComponents/subComponents/pagination';

// Loading component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center w-full py-12">
        <div className="flex flex-col items-center">
            <svg aria-hidden="true" className="w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-primary-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
            </svg>
            <span className="mt-3 text-light">Searching games...</span>
        </div>
    </div>
);

export default function SearchForm() {
    // State to hold the search form data
    const [searchForm, setSearchForm] = useState({
        search: ''
    });
    
    // State to hold the search results
    const [display, setDisplay] = useState(false);
    
    // State to manage loading status
    const [loading, setLoading] = useState(false);
    
    // State to hold the current search results with pagination
    const [searchResults, setSearchResults] = useState({
        games: [],
        pagination: {
            totalItems: 0,
            totalPages: 1,
            currentPage: 1,
            itemsPerPage: 25
        }
    });
    
    // Store active search query to allow pagination with same search
    const [activeSearch, setActiveSearch] = useState('');

    function displayError(error){
        return <div className="text-red-500 py-1 px-5 text-center">{error}</div>
    }

    // Handle form input changes and update the searchForm state
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSearchForm((prev) => ({ ...prev, [name]: value }));
    }

    // Handle page change
    const handlePageChange = async (newPage) => {
        if (newPage === searchResults.pagination.currentPage) return;
        
        setLoading(true);
        
        try {
            // Perform the search with pagination
            const results = await searchGames(activeSearch, newPage, searchResults.pagination.itemsPerPage);
            
            setSearchResults(results);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error("Error changing page:", error);
            setDisplay(displayError("Error loading page. Please try again."));
        } finally {
            setLoading(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Set loading to true when form is submitted
        
        // Reset display first to show loading state immediately
        setDisplay(<LoadingSpinner />);
        
        try {
            // Check if the search field is empty
            if(searchForm.search === '') {
                setDisplay(displayError("Please enter a valid name"));
                setLoading(false); // Set loading to false if the search field is empty
                return;
            }
            
            // Store active search for pagination
            setActiveSearch(searchForm.search);
            
            // Search for games by name with pagination (page 1, 25 items per page)
            const results = await searchGames(searchForm.search, 1, 25);
            
            if(results.games.length === 0) {
                setDisplay(displayError("No results found"));
                setSearchResults({
                    games: [],
                    pagination: {
                        totalItems: 0,
                        totalPages: 1,
                        currentPage: 1,
                        itemsPerPage: 25
                    }
                });
                setLoading(false); // Set loading to false if no results are found
                return;
            }
            
            // Store the search results
            setSearchResults(results);
            
            // Display the search results
            setDisplay(<GameCard games={results.games} />);
            
            // Scroll to top when showing new results
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error("Error searching games:", error);
            setDisplay(displayError("Error searching games. Please try again."));
        }
        setLoading(false); // Set loading to false after results are received
    }

    useEffect(() => {
        // Update display when searchResults change (for pagination)
        if (searchResults.games.length > 0) {
            setDisplay(<GameCard games={searchResults.games} />);
        }
    }, [searchResults]);

    return (
        <div className="flex flex-col w-full">
            <form className="flex px-4 py-4" onSubmit={handleSubmit}>
                <label className="mb-2 text-sm font-medium sr-only">Search</label>
                <div className='relative text-light w-full'>
                    <div className='absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none'>
                        <LuSearch />
                    </div>
                    <input
                        type="text"
                        name="search"
                        value={searchForm.search}
                        onChange={handleChange}
                        placeholder="Search by name" 
                        className="block w-full ps-10 px-3 py-3 rounded-lg bg-surface-800 border border-surface-700 text-light placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
                    />
                    <button 
                        type="submit" 
                        className="absolute end-1.5 bottom-1.5 text-light font-medium px-3 py-1.5 bg-primary-600 hover:bg-primary-700 focus:ring-3 focus:outline-none focus:ring-primary-800 rounded-lg transition-colors duration-200"
                    >
                        Search
                    </button>
                </div>
            </form>
            
            <div className="w-full p-4 min-h-[200px]">
                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <>
                        <div className="w-full">
                            {display}
                        </div>
                        
                        {/* Results count */}
                        {searchResults.games.length > 0 && (
                            <div className="text-center text-tonal-400 italic font-light mt-8 mb-2">
                                Showing <span className="text-light font-normal">{(searchResults.pagination.currentPage - 1) * searchResults.pagination.itemsPerPage + 1}</span>
                                {' '}-{' '}
                                <span className="text-light font-normal">{Math.min(searchResults.pagination.currentPage * searchResults.pagination.itemsPerPage, searchResults.pagination.totalItems)}</span>
                                {' '}of{' '}
                                <span className="text-light font-normal">{searchResults.pagination.totalItems}</span> results
                            </div>
                        )}
                        
                        {/* Pagination */}
                        {searchResults.games.length > 0 && searchResults.pagination.totalPages > 1 && (
                            <Pagination 
                                currentPage={searchResults.pagination.currentPage} 
                                totalPages={searchResults.pagination.totalPages} 
                                onPageChange={handlePageChange} 
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}