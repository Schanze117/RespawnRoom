import React, { useState, useEffect } from 'react';
import NoImage from '../../assets/noImage.jpg';
import { LuX } from 'react-icons/lu';

export default function SavedGameCard() {
    const [games, setGames] = useState([]);
    const [refresh, setRefresh] = useState(false); // State to trigger re-fetching of games

    // Function to fetch saved games
    const fetchSavedGames = async () => {
        try {
            const token = localStorage.getItem('jwtToken'); // Retrieve the token from local storage

            const response = await fetch('/api2/videogames', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch games');
            }

            const data = await response.json();
            setGames(data);
            console.log('Games fetched:', data);
        } catch (error) {
            console.error('Error fetching games:', error);
        }
    };

    // Fetch saved games when the component mounts or when refresh state changes
    useEffect(() => {
        fetchSavedGames();
    }, [refresh]);

    // Function to handle game deletion
    const deleteGame = async (game) => {
        try {
            const token = localStorage.getItem('jwtToken'); // Retrieve the token from local storage

            const response = await fetch(`/api2/videogames/${game.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete game');
            }

            console.log('Game deleted from server:', game);
            setRefresh(!refresh); // Trigger re-fetching of games
        } catch (error) {
            console.error('Error deleting game:', error);
        }
    };

    return (
        <div className='flex-row flex-wrap gap-4 justify-center py-5'>
            {games.map((game) => (
                <div key={game.id} className="block pb-4 px-4 my-5 mx-3 space-y-1 bg-surface-800 rounded-lg hover:outline-3 hover:outline-primary-600 w-stretch h-55 flex-row items-center justify-center shadow-md hover:shadow-2xl transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-101">
                    <div className="flex w-full justify-end items-center">
                        <button type="button" onClick={() => deleteGame(game)} className='block rounded-sm p-0.5 mt-2 text-tonal-500 hover:text-tonal-800 focus:text-tonal-800 text-lg bg-error hover:bg-dark-error focus:outline-2 focus:outline-offset-1 focus:outline-light rounded-lg cursor-pointer'><LuX /></button>
                    </div>
                    <div className="flex w-full justify-between space-x-4">
                        <img src={game.cover ? game.cover : NoImage} alt={game.name} className="w-32 h-41 object-cover rounded-lg" />
                        <div className='flex flex-col w-full items-center justify-center '>
                            <div className="flex flex-row w-full h-fit items-center justify-between mb-2">
                                <h2 className={`text-primary-500 ${game.name.length > 15 ? 'text-lg' : 'text-3xl'} font-medium text-pretty text-center pointer-events-none bg-surface-700 rounded-lg px-1`}>{game.name}</h2>
                                <div className="flex flex-row items-center justify-center text-center text-pretty text-tonal-400 text-sm bg-surface-700 rounded-lg p-1">
                                    <p className='pointer-events-none mr-4'><span className="text-primary-400 font-medium pointer-events-none">Genres: </span>{Array.isArray(game.genres) ? game.genres.join(", ") : 'N/A'}</p>
                                    <p className='pointer-events-none'><span className="text-primary-400 font-medium pointer-events-none">POV: </span>{Array.isArray(game.player_perspectives) ? game.player_perspectives.join(", ") : 'N/A'}</p>
                                </div>
                            </div>
                            <p className="text-light bg-surface-700 rounded-lg h-30 w-full text-base p-2 line-clamp-5 truncate text-pretty pointer-events-none">{game.summary || 'No summary available.'}</p>
                        </div>
                    </div>  
                </div>
            ))}
        </div>
    );
}