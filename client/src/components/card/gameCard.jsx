import React, { useState, useEffect, lazy, Suspense } from 'react';
import NoImage from '../../assets/noImage.jpg';
import { LuSave, LuCheck, LuChevronDown, LuChevronUp } from 'react-icons/lu';
import { useMutation, useQuery } from '@apollo/client';
import { SAVE_GAME } from '../../utils/mutations';
import { GET_ME } from '../../utils/queries';
import Auth from '../../utils/auth';
import { getGameById } from '../../utils/api';

// Lazy load the GameModal component since it's only needed when a user clicks on a game
const GameModal = lazy(() => import('./gameModal'));

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
  
  .game-card {
    display: flex;
    flex-direction: column;
    height: 360px;
    width: 280px;
    transition: all 0.3s ease;
  }
  
  .game-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
  
  .game-image {
    height: 160px;
    overflow: hidden;
    position: relative;
  }
  
  .game-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 10px;
  }
  
  .view-details-btn {
    background-color: #4CAF50;
    color: white;
    padding: 8px 0;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.3s ease;
    width: 100%;
    text-align: center;
    margin-top: auto;
  }
  
  .view-details-btn:hover {
    background-color: #3e8e41;
  }
  
  .rating-container {
    margin-top: 4px;
    margin-bottom: 8px;
  }
`;

export default function GameCard({ games, showRating = true }) {
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

    const handleGameClick = async (game) => {
        console.log('Game clicked:', game);
        
        try {
            // Show a loading state
            setSelectedGame({...game, isLoading: true});
            setShowModal(true);
            
            // Fetch detailed game data including ratings
            const detailedGame = await getGameById(game.id);
            console.log('Detailed game data:', detailedGame);
            
            // Create an enhanced game object with all data
            const enhancedGame = {
                ...game,
                ...detailedGame,
                isLoading: false
            };
            
            // Set the enhanced game object for the modal
            setSelectedGame(enhancedGame);
            
        } catch (error) {
            console.error('Error fetching detailed game data:', error);
            
            // Calculate the rating from all possible sources as fallback
            const calculatedRating = game.total_rating ? parseFloat(game.total_rating) : 
                                  (game.rating ? parseFloat(game.rating) : 
                                  (game.aggregated_rating ? parseFloat(game.aggregated_rating) : null));
            
            // Create a new game object with all original properties
            const gameWithRating = { 
                ...game,
                isLoading: false
            };
            
            // Only add the rating if we actually have one
            if (calculatedRating !== null) {
                console.log('Setting rating on gameWithRating:', Math.round(calculatedRating));
                // Ensure the rating is on both properties for consistency
                gameWithRating.total_rating = calculatedRating;
                gameWithRating.rating = calculatedRating;
            } else {
                console.log('No rating found for this game');
                // Set a "no rating available" indicator
                gameWithRating.no_rating_available = true;
            }
            
            // Set the enhanced game object for the modal
            setSelectedGame(gameWithRating);
        }
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
        
        // Handle both direct URLs and URLs with size parameters
        if (url.includes('t_thumb') || url.includes('t_cover_small')) {
            return url.replace('t_thumb', 't_720p')
                    .replace('t_cover_small', 't_720p');
        }
        
        return url;
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
        <>
            <div className="flex flex-wrap gap-4 justify-center py-5">
                {games.map((game) => {
                    const saveState = getSaveButtonState(game.id, game);
                    const isExpanded = expandedTitles[game.id] || false;
                    
                    // Calculate rating here for display in the card
                    const rating = game.total_rating ? Math.round(game.total_rating) : 
                                 (game.rating ? Math.round(game.rating) : null);
                    
                    console.log(`Game ${game.name} has rating:`, rating);
                    
                    return (
                        <div
                            key={game.id}
                            className="game-card flex-shrink-0 bg-surface-800 rounded-lg overflow-hidden border border-surface-700 hover:border-primary-600 transition-colors duration-300 relative"
                        >
                            {/* Save Button */}
                            {Auth.loggedIn() && (
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
                            )}
                            
                            {/* Game image with blurred background */}
                            <div className="game-image bg-surface-900 relative">
                                <div className="w-full h-full relative">
                                    {/* Blurred background for better image presentation */}
                                    <div 
                                        className="absolute inset-0"
                                        style={{
                                            backgroundImage: `url(${game.cover ? getOptimizedImageUrl(game.cover.url) : NoImage})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            filter: 'blur(10px) brightness(0.7)',
                                            transform: 'scale(1.1)',
                                        }}
                                    />
                                    
                                    {/* Actual image centered */}
                                    <div className="absolute inset-0 flex items-center justify-center p-2">
                                        {game.cover ? (
                                            <img 
                                                src={getOptimizedImageUrl(game.cover.url)} 
                                                alt={game.name}
                                                className="h-full max-w-full object-contain z-10 drop-shadow-md"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full w-full z-10">
                                                <img 
                                                    src={NoImage} 
                                                    alt="No image available"
                                                    className="w-3/4 h-3/4 object-contain opacity-80"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Game content */}
                            <div className="game-content bg-surface-800 p-3 flex flex-col">
                                {/* Game Title with expand/collapse option */}
                                <div className="mb-1">
                                    <div className="flex items-start justify-between gap-1">
                                        <h3 
                                            className={`text-primary-400 font-medium text-base ${isExpanded ? '' : 'line-clamp-2'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleTitleExpansion(game.id);
                                            }}
                                        >
                                            {game.name}
                                        </h3>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleTitleExpansion(game.id);
                                            }}
                                            className="flex-shrink-0 text-tonal-400 hover:text-primary-400 transition-colors duration-200 p-1"
                                            title={isExpanded ? "Collapse title" : "Expand title"}
                                        >
                                            {isExpanded ? <LuChevronUp size={14} /> : <LuChevronDown size={14} />}
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Rating - Only show if showRating prop is true */}
                                {showRating && rating ? (
                                    <div className="mb-0.5 text-xs">
                                        <div className={`font-medium ${
                                            rating >= 70 ? "text-emerald-400" : 
                                            rating >= 50 ? "text-amber-400" : 
                                            "text-red-400"
                                        }`}>
                                            Rating: {rating}/100
                                        </div>
                                    </div>
                                ) : showRating && (
                                    <div className="mb-0.5 text-xs">
                                        <div className="text-gray-400 font-medium">
                                            Not Rated
                                        </div>
                                    </div>
                                )}
                                
                                {/* Game genres */}
                                <div className="flex flex-wrap gap-1 mb-1">
                                    {game.genres && game.genres.slice(0, 3).map((genre, index) => (
                                        <span key={index} className="text-xs bg-primary-600/20 text-primary-100 px-1.5 py-0.5 rounded-md">
                                            {genre.name}
                                        </span>
                                    ))}
                                </div>
                                
                                {/* View Details button */}
                                <div className="mt-auto pt-1">
                                    <button 
                                        onClick={() => handleGameClick(game)}
                                        className="view-details-btn"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Lazy load the modal component only when needed */}
            {showModal && (
                <Suspense fallback={
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="animate-pulse flex space-x-2">
                            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                        </div>
                    </div>
                }>
                    <GameModal 
                        key={`game-modal-${selectedGame.id}-${selectedGame.total_rating || 'no-rating'}`}
                        game={selectedGame} 
                        onClose={handleCloseModal}
                        location="api" 
                    />
                </Suspense>
            )}
        </>
    );
} 