import { useState } from 'react';
import { LuSearch } from "react-icons/lu";
import { searchGames } from '../utils/api'; 
import GameCard from './card/gameCard';

export default function SearchForm() {
    const [searchForm, setSearchForm] = useState({
        search: ''
    });
    
    const [display, setDisplay] = useState(false);

	function displayError(error){
		return <div className="text-red-500 py-1 px-5">{error}</div>
	}

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSearchForm((prev) => ({ ...prev, [name]: value }));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if(searchForm.search === '') {
                setDisplay(displayError("Please enter a valid name"));
                return;
            }
            const results = await searchGames(searchForm.search);
            if(results.length === 0) {
                setDisplay(displayError("No results found"));
                return;
            }
            setDisplay(<GameCard games={results} />);
            console.log("Form submitted:", searchForm);
            console.log("Search results:", results);
        } catch (error) {
            console.error("Error searching games:", error);
        }

        setSearchForm({ search: '' });
    }

    return (
        <div>
            <form className="flex mx-auto space-y-4 p-4" onSubmit={handleSubmit}>
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
                        className="block w-full ps-10 px-3 py-1.5 rounded-lg bg-surface-500 text-light outline-1 outline-tonal-600 focus:outline-primary-400 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2"
                    />
                    <button type="submit" className="absolute end-1.5 bottom-0.5 text-light text-sm font-medium px-3 py-1.5 bg-primary-500 hover:bg-primary-700 focus:ring-3 focus:outline-none focus:ring-primary-800 rounded-lg">Search</button>
                </div>
            </form>
            <div>
                {display}
            </div>
        </div>
    )
}