import { useState } from 'react';
import { LuSearch } from "react-icons/lu";
import { searchGames } from '../utils/api'; // Import the searchGames function
import { LuSearch } from "react-icons/lu";

export default function SearchForm() {
    const [searchForm, setSearchForm] = useState({
        search: ''
    });
    const [searchResults, setSearchResults] = useState([]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSearchForm((prev) => ({ ...prev, [name]: value }));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form submitted:", searchForm);

        try {
            const results = await searchGames(searchForm.search);
            console.log("Search results:", results);
            setSearchResults(results);
        } catch (error) {
            console.error("Error searching games:", error);
        }

        setSearchForm({ search: '' });
    }

    return (
        <form className="flex  mx-auto space-y-4 px-4 pt-4" onSubmit={handleSubmit}>
            <label className="mb-2 text-sm font-medium sr-only">Search</label>
        <div>
            <form className="flex mx-auto space-y-4 p-4" onSubmit={handleSubmit}>
                <label className="mb-2 text-sm font-medium sr-only"></label>
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
                        className="block w-full ps-10 px-3 py-1.5 rounded-lg bg-surface-500 text-light outline-1 outline-tonal-600 focus:outline-primary-400 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2"
                    />
                    <button type="submit" className="absolute end-1.5 bottom-0.5 text-light text-sm font-medium px-3 py-1.5 bg-primary-500 hover:bg-primary-700 focus:ring-3 focus:outline-none focus:ring-primary-800 rounded-lg">Search</button>
                </div>
            </form>
            <div>
                {searchResults.length > 0 ? (
                    searchResults.map((game) => (
                        <div key={game.id} className="flex flex-col p-4 space-y-2 bg-surface-500 rounded-lg">
                            <h2 className="text-light text-lg font-medium">{game.name}</h2>
                            {game.cover && game.cover.url && (
                                <img src={game.cover.url} alt={game.name} className="w-32 h-32 object-cover rounded-lg" />
                            )}
                            <p className="text-light">{game.summary || 'No summary available'}</p>
                            <p className="text-light">Genres: {game.genres ? game.genres.map((genre) => genre.name).join(", ") : 'N/A'}</p>
                            <p className="text-light">Perspectives: {game.player_perspectives ? game.player_perspectives.map((perspective) => perspective.name).join(", ") : 'N/A'}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-light">No results found</p>
                )}
            </div>
        </div>
    )
}