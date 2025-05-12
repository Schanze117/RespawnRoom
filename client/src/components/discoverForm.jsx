import { useState, useEffect } from 'react';
import { filterGames } from '../utils/api';
import GameCard from './card/gameCard';
import DiscoverWrapper from './discoverComponents/discoverWrapper';
import Pagination from './discoverComponents/subComponents/pagination';

export default function DiscoverForm() {
    // State to hold the discover form data
    const [discoverForm, setDiscoverForm] = useState({
        genre: [],
        playerPerspective: [],
        themes: [],
        modes: []
    });
    
    // State to hold the search results
    const [display, setDisplay] = useState(false);
    // State to manage loading status
    const [loading, setLoading] = useState(false);
    // State to hold the current filtered games 
    const [filteredGames, setFilteredGames] = useState({
        games: [],
        pagination: {
            totalItems: 0,
            totalPages: 1,
            currentPage: 1,
            itemsPerPage: 25
        }
    });
    // Store active filters to allow pagination with same filters
    const [activeFilters, setActiveFilters] = useState(null);

    function displayError(error){
        return <div className="text-red-500 py-1 px-5 text-center">{error}</div>
    }

    // Handle form input changes and update the discoverForm state
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        // Update the discoverForm state based on the input type
        if (type === 'checkbox') {
            setDiscoverForm((prev) => {
                if (checked) {
                    return { ...prev, [name]: [...prev[name], value] };
                } else {
                    return { ...prev, [name]: prev[name].filter((item) => item !== value) };
                }
            });
        } else {
            setDiscoverForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    // Handle page change
    const handlePageChange = async (newPage) => {
        if (!activeFilters) return;
        
        setLoading(true);
        setDisplay(
            <div className="flex items-center justify-center w-full py-12">
                <div className="flex flex-col items-center">
                    <svg aria-hidden="true" className="w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-primary-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
                    </svg>
                    <span className="mt-3 text-light">Loading page {newPage}...</span>
                </div>
            </div>
        );
        
        try {
            const { genre, playerPerspective, themes, modes } = activeFilters;
            const results = await filterGames(
                genre, 
                playerPerspective, 
                themes, 
                modes, 
                newPage, 
                filteredGames.pagination.itemsPerPage
            );
            
            setFilteredGames(results);
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
        setDisplay(
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
        
        try {
            // Check if no filters are selected
            if (discoverForm.genre.length === 0 && discoverForm.playerPerspective.length === 0 && 
                discoverForm.themes.length === 0 && discoverForm.modes.length === 0){
                setDisplay(displayError("Please select at least one filter"));
                setLoading(false); // Set loading to false if no filters are selected
                return;
            }   
            
            // Store active filters for pagination
            setActiveFilters({...discoverForm});
            
            // Filter games based on the selected filters
            const results = await filterGames(
                discoverForm.genre, 
                discoverForm.playerPerspective, 
                discoverForm.themes, 
                discoverForm.modes,
                1, // Start at page 1 for new searches
                25 // 25 items per page
            );
            
            if (results.games.length === 0){
                setDisplay(displayError("No results found"));
                setFilteredGames({
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
            
            // Store the filtered games
            setFilteredGames(results);
            
            // Display the search results
            setDisplay(<GameCard games={results.games} />);
            
            // Reset the form after submission but keep the active filters stored for pagination
            setDiscoverForm({ genre: [], playerPerspective: [], themes: [], modes: [] });
            
            // Scroll to top when showing new results
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error("Error filtering games:", error);
            setDisplay(displayError("Error searching games. Please try again."));
        }
        setLoading(false); // Set loading to false after results are received
    };

    useEffect(() => {
        // Update display when filteredGames change (for pagination)
        if (filteredGames.games.length > 0) {
            setDisplay(<GameCard games={filteredGames.games} />);
        }
    }, [filteredGames]);

    return (
        <div className="flex flex-col w-full">
            <form className="flex flex-col space-y-4 px-4 py-4" onSubmit={handleSubmit}>
                <DiscoverWrapper discoverForm={discoverForm} handleChange={handleChange} />
                
                {/* Filtering info */}
                {(discoverForm.genre.length > 1 || discoverForm.playerPerspective.length > 1 || 
                  discoverForm.themes.length > 1 || discoverForm.modes.length > 1) && (
                    <div className="text-sm text-tonal-400 bg-surface-800 rounded-md p-3 mt-2">
                        <span className="text-primary-500">Note:</span> Games will only be shown if they match <span className="text-light font-medium">all</span> your selected categories within each filter type.
                    </div>
                )}
                
                <button 
                    type="submit" 
                    className="py-3 px-4 mt-4 bg-primary-600 hover:bg-primary-700 text-light rounded-lg font-medium transition-colors duration-200 shadow-md"
                >
                    Search Games
                </button>
            </form>
            
            <div className="w-full p-4 min-h-[200px]">
                {loading ? (
                    <div className="flex items-center justify-center w-full py-12">
                        <div className="flex flex-col items-center">
                            <svg aria-hidden="true" className="w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-primary-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
                            </svg>
                            <span className="mt-3 text-light">Searching games...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="w-full">
                            {display}
                        </div>
                        
                        {/* Results count */}
                        {filteredGames.games.length > 0 && (
                            <div className="text-center text-tonal-400 italic font-light mt-8 mb-2">
                                Showing <span className="text-light font-normal">{(filteredGames.pagination.currentPage - 1) * filteredGames.pagination.itemsPerPage + 1}</span>
                                {' '}-{' '}
                                <span className="text-light font-normal">{Math.min(filteredGames.pagination.currentPage * filteredGames.pagination.itemsPerPage, filteredGames.pagination.totalItems)}</span>
                                {' '}of{' '}
                                <span className="text-light font-normal">{filteredGames.pagination.totalItems}</span> results
                            </div>
                        )}
                        
                        {/* Pagination */}
                        {filteredGames.games.length > 0 && filteredGames.pagination.totalPages > 1 && (
                            <Pagination 
                                currentPage={filteredGames.pagination.currentPage} 
                                totalPages={filteredGames.pagination.totalPages} 
                                onPageChange={handlePageChange} 
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}