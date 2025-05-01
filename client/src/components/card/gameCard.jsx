import NoImage from '../../assets/noImage.jpg';
import { LuSave, LuCheck } from 'react-icons/lu';
import { useMutation, useQuery } from '@apollo/client';
import { SAVE_GAME } from '../../utils/mutations';
import { GET_ME } from '../../utils/queries';
import Auth from '../../utils/auth';
import GameModal from './gameModal';
import { useState, useEffect } from 'react';

export default function GameCard({ games }) {
    const [showModal, setShowModal] = useState(false);
    const [selectedGame, setSelectedGame] = useState(null);
    const [savedGames, setSavedGames] = useState({});
    const [alreadySavedGames, setAlreadySavedGames] = useState([]);
    const [saveGameMutation] = useMutation(SAVE_GAME);
    
    // Fetch user's saved games
    const { loading, data } = useQuery(GET_ME, {
        skip: !Auth.loggedIn(), // Skip query if not logged in
    });
    
    // Extract saved games from the query result
    useEffect(() => {
        if (data?.me?.savedGames) {
            // Create a list of names of already saved games
            const savedGameNames = data.me.savedGames.map(game => game.name.toLowerCase().trim());
            setAlreadySavedGames(savedGameNames);
        }
    }, [data]);

    // Check if a game is already saved
    const isGameAlreadySaved = (game) => {
        return alreadySavedGames.includes(game.name.toLowerCase().trim());
    };

    const handleGameClick = (game) => {
        setSelectedGame(game);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedGame(null);
    };

    const saveGame = async (event, game) => {
        event.stopPropagation(); // Prevent the card click from triggering
        try {
            if (!Auth.loggedIn()) {
                console.log('User not logged in, cannot save game');
                return;
            }
            
            // Check if game is already saved
            if (isGameAlreadySaved(game)) {
                console.log('Game already saved:', game.name);
                setSavedGames(prev => ({
                    ...prev,
                    [game.id]: 'already-saved'
                }));
                
                // Reset status after 2 seconds
                setTimeout(() => {
                    setSavedGames(prev => {
                        const newState = {...prev};
                        delete newState[game.id];
                        return newState;
                    });
                }, 2000);
                return;
            }

            const gameInput = {
                cover: game.cover ? game.cover.url : '',
                name: game.name ? game.name : '',
                genres: game.genres ? game.genres.map((genre) => genre.name) : [],
                playerPerspectives: game.player_perspectives
                    ? game.player_perspectives.map((perspective) => perspective.name)
                    : [],
                summary: game.summary ? game.summary : 'No summary available.',
            };

            // Set the game as being saved (for UI feedback)
            setSavedGames(prev => ({
                ...prev,
                [game.id]: 'saving'
            }));

            const { data } = await saveGameMutation({
                variables: { game: gameInput },
            });

            console.log('Game saved to server:', data);
            
            // Add to already saved games list
            setAlreadySavedGames(prev => [...prev, game.name.toLowerCase().trim()]);
            
            // Visual feedback - mark as saved
            setSavedGames(prev => ({
                ...prev,
                [game.id]: 'saved'
            }));
            
            // Reset status after 2 seconds
            setTimeout(() => {
                setSavedGames(prev => {
                    const newState = {...prev};
                    delete newState[game.id];
                    return newState;
                });
            }, 2000);
        } catch (error) {
            console.error('Error saving game:', error);
            // Set the game as having an error when saving
            setSavedGames(prev => ({
                ...prev,
                [game.id]: 'error'
            }));
            
            // Reset error status after 2 seconds
            setTimeout(() => {
                setSavedGames(prev => {
                    const newState = {...prev};
                    delete newState[game.id];
                    return newState;
                });
            }, 2000);
        }
    };

    // Get the save button state for a game
    const getSaveButtonState = (gameId, game) => {
        // First check if the game has an active save state
        if (savedGames[gameId]) {
            return savedGames[gameId];
        }
        
        // Then check if it's already in the user's saved collection
        if (isGameAlreadySaved(game)) {
            return 'already-saved';
        }
        
        // Default state
        return 'default';
    };

    return (
        <div className="flex flex-wrap gap-4 justify-center py-5">
            {games.map((game) => {
                const saveState = getSaveButtonState(game.id, game);
                
                return (
                    <div
                        key={game.id}
                        className="pb-4 px-4 mx-1 space-y-2 bg-surface-800 rounded-lg hover:outline-3 hover:outline-primary-600 w-100 h-105 flex flex-col items-center justify-center shadow-md hover:shadow-2xl transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-102"
                    >
                        <div className="flex flex-row w-full justify-end">
                            <button
                                type="button"
                                onClick={(e) => saveGame(e, game)}
                                disabled={saveState === 'saving' || saveState === 'saved' || saveState === 'already-saved'}
                                className={`block p-0.5 text-lg rounded-lg cursor-pointer ${
                                    saveState === 'default' ? 'text-tonal-600 hover:text-tonal-800 focus:text-tonal-800 bg-primary-500 hover:bg-primary-600 focus:outline-2 focus:outline-offset-1 focus:outline-light' :
                                    saveState === 'saving' ? 'bg-amber-500 text-white cursor-wait' : 
                                    saveState === 'saved' ? 'bg-green-600 text-white' :
                                    saveState === 'already-saved' ? 'bg-green-600 opacity-75 text-white' :
                                    'bg-red-600 text-white'
                                }`}
                                title={
                                    saveState === 'default' ? 'Save Game' :
                                    saveState === 'saving' ? 'Saving...' : 
                                    saveState === 'saved' ? 'Saved!' :
                                    saveState === 'already-saved' ? 'Already Saved' :
                                    'Error saving'
                                }
                            >
                                {saveState === 'saved' || saveState === 'already-saved' ? <LuCheck /> : <LuSave />}
                            </button>
                        </div>
                        <div className="flex flex-row w-full justify-between space-x-4">
                            <img
                                src={game.cover ? game.cover.url : NoImage}
                                alt={game.name}
                                className="w-32 h-32 object-cover rounded-lg"
                            />
                            <div className="flex flex-col w-full items-center justify-center bg-surface-700 rounded-lg">
                                <h2
                                    className={`text-primary-500 ${
                                        game.name.length > 15 ? 'text-lg' : 'text-3xl'
                                    } font-medium text-pretty text-center pointer-events-none`}
                                >
                                    {game.name}
                                </h2>
                                <div className="flex flex-col items-center justify-center text-center text-pretty text-tonal-400 text-sm pt-2">
                                    <p className="pointer-events-none">
                                        <span className="text-primary-400 font-medium pointer-events-none">
                                            Genres:{' '}
                                        </span>
                                        {game.genres
                                            ? game.genres.map((genre) => genre.name).join(', ')
                                            : 'N/A'}
                                    </p>
                                    <p className="pointer-events-none">
                                        <span className="text-primary-400 font-medium pointer-events-none">
                                            POV:{' '}
                                        </span>
                                        {game.player_perspectives
                                            ? game.player_perspectives
                                                .map((perspective) => perspective.name)
                                                .join(', ')
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <p className="text-light bg-surface-700 rounded-lg h-56 w-93 text-base p-2 line-clamp-9 truncate text-pretty pointer-events-none">
                            {game.summary || 'No summary available.'}
                        </p>
                        <button 
                            onClick={() => handleGameClick(game)} 
                            className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg w-full"
                        >
                            View Details
                        </button>
                    </div>
                );
            })}
            {showModal && <GameModal game={selectedGame} onClose={handleCloseModal} />}
        </div>
    );
}