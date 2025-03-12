import GameCard from "../components/card/gameCard";
import { useState, useEffect } from "react";

export default function Saved() {
    // State to hold saved games
    const [savedGames, setSavedGames] = useState([]);

    // Fetch saved games from the server
    const fetchSavedGames = async () => {
        try {
            const response = await fetch('/api/videogames', {
                method: 'GET',
                headers: {
                    'content-type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to retrieve saved games');
            }

            const games = await response.json();
            setSavedGames(games);
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
            <h1 className="text-4xl font-bold text-center">Saved Games</h1>
            <div className="flex flex-wrap justify-center">
                {savedGames.length > 0 ? <GameCard games={savedGames} /> : <p className="text-pretty text-center">No saved games found</p>}
            </div>
        </div>
    )
}