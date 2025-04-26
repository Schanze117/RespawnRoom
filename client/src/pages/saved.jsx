import SavedGameCard from "../components/card/savedGameCard";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Auth from '../utils/auth';

export default function Saved() {
    // State to hold saved games
    const [savedGames, setSavedGames] = useState([]);

    // Fetch saved games from the server
    const fetchSavedGames = async () => {
        const token = Auth.getToken();
        try {
            const response = await fetch('/api2/videogames', {
                method: 'GET',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to retrieve saved games');
            }

            const games = await response.json();
            setSavedGames(games);
            console.log('games', games);
        }
        catch (error) {
            console.error('Error fetching saved games:', error);
        }
    }

    // Load saved games when the component mounts
    useEffect(() => {
        fetchSavedGames();
    }
    , []);

    return(
        <div className="mt-20 sm:ml-55 mr-4 bg-surface-700 border-2 rounded-lg border-tonal-800 height-full">
            <h1 className="text-3xl font-bold text-light px-5 pt-3 text-center">Saved Games</h1>
            <div className="flex flex-wrap justify-center">
                {savedGames.length > 0 ? <SavedGameCard games={savedGames} /> : <div className="text-sm font-medium text-gray-300">
                No Saved Games Found <Link to="/search" className="text-primary-800 hover:underline">Search New Games</Link>
                </div>}
            </div>
        </div>
    )
}