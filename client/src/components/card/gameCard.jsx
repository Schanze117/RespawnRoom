import React, { useState, useEffect } from 'react';
import NoImage from '../../assets/noImage.jpg';
import { LuSave, LuCheck } from 'react-icons/lu';
import { useMutation, useQuery } from '@apollo/client';
import { SAVE_GAME } from '../../utils/mutations';
import { GET_ME } from '../../utils/queries';
import Auth from '../../utils/auth';
import GameModal from './gameModal';

// CSS styles for the component
const cssStyles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-none {
    -webkit-line-clamp: unset;
  }
`;

export default function GameCard({ games }) {
    const [showModal, setShowModal] = useState(false);
    const [selectedGame, setSelectedGame] = useState(null);
    const [savedGames, setSavedGames] = useState({});
    const [alreadySavedGames, setAlreadySavedGames] = useState([]);
    const [expandedTitles, setExpandedTitles] = useState({});
    const [saveGameMutation] = useMutation(SAVE_GAME);
    
    // Fetch user's saved games
    const { loading, data } = useQuery(GET_ME, {
        skip: !Auth.loggedIn(),
    });
    
    // Extract saved games from the query result
    useEffect(() => {
        if (data?.me?.savedGames) {
            const savedGameNames = data.me.savedGames.map(game => game.name.toLowerCase().trim());
            setAlreadySavedGames(savedGameNames);
        }
    }, [data]);

    // Add CSS styles to the document
    useEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.innerHTML = cssStyles;
        document.head.appendChild(styleElement);
        
        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

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

    // Toggle title expansion
    const toggleTitleExpansion = (gameId) => {
        setExpandedTitles(prev => ({
            ...prev,
            [gameId]: !prev[gameId]
        }));
    };

    // Process image URL to get the best quality version
    const getOptimizedImageUrl = (url) => {
        if (!url) return NoImage;
        return url.replace('t_thumb', 't_cover_big')
                  .replace('t_cover_small', 't_cover_big');
    };

    const saveGame = async (event, game) => {
        event.stopPropagation();
        try {
            if (!Auth.loggedIn()) {
                return;
            }
            
            if (isGameAlreadySaved(game)) {
                setSavedGames(prev => ({
                    ...prev,
                    [game.id]: 'already-saved'
                }));
                
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

            setSavedGames(prev => ({
                ...prev,
                [game.id]: 'saving'
            }));

            const { data } = await saveGameMutation({
                variables: { game: gameInput },
            });

            setAlreadySavedGames(prev => [...prev, game.name.toLowerCase().trim()]);
            
            setSavedGames(prev => ({
                ...prev,
                [game.id]: 'saved'
            }));
            
            setTimeout(() => {
                setSavedGames(prev => {
                    const newState = {...prev};
                    delete newState[game.id];
                    return newState;
                });
            }, 2000);
        } catch (error) {
            console.error('Error saving game:', error);
            setSavedGames(prev => ({
                ...prev,
                [game.id]: 'error'
            }));
            
            setTimeout(() => {
                setSavedGames(prev => {
                    const newState = {...prev};
                    delete newState[game.id];
                    return newState;
                });
            }, 2000);
        }
    };

    const getSaveButtonState = (gameId, game) => {
        if (savedGames[gameId]) {
            return savedGames[gameId];
        }
        
        if (isGameAlreadySaved(game)) {
            return 'already-saved';
        }
        
        return 'default';
    };

    if (loading) {
        return <div className="text-center text-light mt-20">Loading games...</div>;
    }

    return (
        <div className="flex flex-wrap gap-4 justify-center py-5">
            {games.map((game) => {
                const saveState = getSaveButtonState(game.id, game);
                const isExpanded = expandedTitles[game.id] || false;
                
                return (
                    <div
                        key={game.id}
                        className="w-[280px] h-[350px] flex-shrink-0 flex-grow-0 bg-surface-800 rounded-lg overflow-hidden border border-surface-700 hover:border-primary-600 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 flex flex-col relative"
                    >
                        {/* Save Button */}
                            <button
                                type="button"
                                onClick={(e) => saveGame(e, game)}
                                disabled={saveState === 'saving' || saveState === 'saved' || saveState === 'already-saved'}
                            className={`absolute top-2 right-2 p-1.5 z-10 text-white rounded-full shadow-md transition-all duration-300 ${
                                saveState === 'default' ? 'bg-primary-600 hover:bg-primary-700' :
                                saveState === 'saving' ? 'bg-amber-500 cursor-wait' : 
                                saveState === 'saved' ? 'bg-green-600' :
                                saveState === 'already-saved' ? 'bg-green-600 opacity-75' :
                                'bg-red-600'
                                }`}
                                title={
                                    saveState === 'default' ? 'Save Game' :
                                    saveState === 'saving' ? 'Saving...' : 
                                    saveState === 'saved' ? 'Saved!' :
                                    saveState === 'already-saved' ? 'Already Saved' :
                                    'Error saving'
                                }
                            >
                            {saveState === 'saved' || saveState === 'already-saved' ? <LuCheck className="text-sm" /> : <LuSave className="text-sm" />}
                            </button>

                        {/* Game Cover Image */}
                        <div className="h-[160px] bg-surface-900 flex items-center justify-center relative overflow-hidden">
                            {game.cover ? (
                                <div className="w-full h-full relative flex items-center justify-center">
                                    {/* Blurred background */}
                                    <div 
                                        className="absolute inset-0 w-full h-full"
                                        style={{
                                            backgroundImage: `url(${getOptimizedImageUrl(game.cover.url)})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            filter: 'blur(12px)',
                                            transform: 'scale(1.1)',
                                            opacity: '0.7'
                                        }}
                                    />
                                    {/* Clear main image */}
                                    <img 
                                        src={getOptimizedImageUrl(game.cover.url)}
                                        alt={game.name} 
                                        className="h-full object-contain relative z-10"
                                        loading="lazy"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full w-full">
                                    <div className="text-2xl text-primary-400 opacity-30">Game Cover</div>
                                </div>
                            )}
                        </div>
                        
                        {/* Game Info */}
                        <div className="p-5 flex flex-col flex-grow">
                            {/* Title */}
                            <div className="relative">
                                <h3 
                                    onClick={() => toggleTitleExpansion(game.id)}
                                    className={`text-xl font-semibold text-light mb-2 cursor-pointer hover:text-primary-400 transition-all duration-200 ${isExpanded ? 'line-clamp-none' : 'line-clamp-2'}`}
                                    title={game.name}
                                >
                                    {game.name}
                                </h3>
                                
                                {game.name && game.name.length > 40 && (
                                    <button 
                                        onClick={() => toggleTitleExpansion(game.id)}
                                        className="absolute right-0 top-0 text-xs text-primary-400 hover:text-primary-300"
                                    >
                                        {isExpanded ? 'Less' : 'More'}
                                    </button>
                                )}
                            </div>

                            {/* Game genres */}
                            <div className="flex flex-wrap gap-1 mb-3">
                                {game.genres?.slice(0, 4).map((genre, gIndex) => (
                                    <span key={`${game.id}-genre-${gIndex}`} className="text-xs bg-primary-600/40 text-primary-100 px-1.5 py-0.5 rounded-md border border-primary-600/20">
                                        {genre.name}
                                    </span>
                                ))}
                            </div>

                            {/* View Details button */}
                            <div className="mt-auto pt-2 flex justify-end">
                                <button 
                                    onClick={() => handleGameClick(game)}
                                    className="bg-primary-600 hover:bg-primary-700 text-white text-sm py-1 px-3 rounded transition duration-300"
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
            {showModal && <GameModal game={selectedGame} onClose={handleCloseModal} location="other" />}
        </div>
    );
}