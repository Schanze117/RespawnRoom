import { useState, useEffect } from 'react';
import { filterGames } from '../utils/api';
import GameCard from './card/gameCard';

import DiscoverWrapper from './discoverComponents/discoverWrapper';


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

	function displayError(error){
		return <div className="text-red-500 py-1 px-5">{error}</div>
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
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Check if no filters are selected
			if (discoverForm.genre.length === 0 && discoverForm.playerPerspective.length === 0 && discoverForm.themes.length === 0 && discoverForm.modes.length === 0){
				setDisplay(displayError("Please select at least one filter"));
				return
			}	
            // Filter games based on the selected filters
            const results = await filterGames(discoverForm.genre, discoverForm.playerPerspective, discoverForm.themes, discoverForm.modes);
			if (results.length === 0){
				setDisplay(displayError("No results found"));
				return
				}
            // Display the search results
			setDisplay(<GameCard games={results} />);
			console.log("Form submitted:", discoverForm);
            console.log("Search results:", results);
        } catch (error) {
            console.error("Error filtering games:", error);
        }
        setDiscoverForm({ genre: [], playerPerspective: [], themes: [], modes: [] });
    };

    return (
    <div>
        <form className="flex flex-col space-y-4 px-2 pt-2 mb-3" onSubmit={handleSubmit}>
            <DiscoverWrapper discoverForm={discoverForm} handleChange={handleChange} />
            <button type="submit" className="py-2 mx-2.5 bg-primary-500 text-light rounded-lg">Search</button>
        </form>
        <div>
           {display}
        </div>
    </div>
    );
}
