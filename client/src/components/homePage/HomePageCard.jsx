import React, { useState, useEffect } from 'react';
import NoImage from '../../assets/noImage.jpg';
import GameModal from '../card/gameModal';
import { LuSave, LuCheck } from 'react-icons/lu';
import { useMutation, useQuery } from '@apollo/client';
import { SAVE_GAME } from '../../utils/mutations';
import { GET_ME } from '../../utils/queries';
import Auth from '../../utils/auth';

export default function HomePageCard({ games, type }) {
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

  // Handle game click to show modal
  const handleGameClick = (game) => {
    setSelectedGame(game);
    setShowModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedGame(null);
  };

  // Handle save game functionality
  const saveGame = async (event, game) => {
    event.stopPropagation(); // Prevent the card click from triggering
    try {
      if (!Auth.loggedIn()) {
        // Instead of alert, redirect to login or show a more subtle notification
        // Optional: redirect to login page
        // window.location.href = '/login';
        return;
      }
      
      // Check if game is already saved
      if (isGameAlreadySaved(game)) {
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

  // Determine the appropriate grid classes based on the type
  const getGridClasses = () => {
    if (type === 'editors-pick') {
      return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4";
    }
    return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4";
  };

  return (
    <>
      <div className={getGridClasses()}>
        {games.map((game) => {
          const saveState = getSaveButtonState(game.id, game);
          
          return (
            <div key={game.id} className="bg-surface-800 rounded-lg overflow-hidden border border-surface-700 hover:border-primary-600 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 flex flex-col relative">
              {/* Save Button - with different states */}
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
              
              <div className="h-40 bg-surface-700 flex items-center justify-center relative overflow-hidden">
                {game.cover ? (
                  <div 
                    className="absolute inset-0 w-full h-full bg-center bg-no-repeat bg-cover"
                    style={{
                      backgroundImage: `url(${game.cover.url || NoImage})`,
                      filter: 'blur(12px)',
                      transform: 'scale(1.1)',
                    }}
                  />
                ) : (
                  <div className="text-2xl text-primary-400 opacity-30">Game Cover</div>
                )}
                
                {/* Display type-specific badges */}
                {type === 'trending' && (
                  <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded">
                    {game.rating ? `${Math.round(game.rating)}/100` : 'Trending'}
                  </div>
                )}
                {type === 'latest' && (
                  <div className="absolute top-2 left-2 bg-primary-900 text-primary-300 text-xs font-bold px-2 py-1 rounded-full">
                    New
                  </div>
                )}
                {type === 'upcoming' && (
                  <div className="absolute top-2 left-2 bg-surface-900 text-primary-300 text-xs font-bold px-2 py-1 rounded-full">
                    Coming Soon
                  </div>
                )}
                {type === 'top-rated' && (
                  <div className="absolute top-2 left-2 bg-surface-900 text-light font-bold w-10 h-10 rounded-full flex items-center justify-center">
                    {game.rating ? Math.round(game.rating) / 10 : 9.5}
                  </div>
                )}
                {type === 'editors-pick' && (
                  <div className="absolute top-2 left-2 bg-primary-700 text-white text-xs px-2 py-1 rounded">
                    Editor's Pick
                  </div>
                )}
              </div>
              
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-light mb-1">{game.name}</h3>
                <p className="text-sm text-tonal-400 mb-3">
                  {game.genres ? game.genres.map(g => g.name).join(', ') : 'N/A'}
                </p>
                
                {/* Display type-specific content */}
                <div className="flex justify-between items-center mt-auto">
                  {type === 'recommended' && (
                    <>
                      <span className="text-xs px-2 py-1 bg-surface-700 rounded-full text-tonal-300">
                        {game.rating ? `${Math.round(game.rating)}/100 (${game.ratingCount || game.rating_count || 0} reviews)` : '95% Match'}
                      </span>
                      <button className="text-primary-500 hover:text-primary-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </button>
                    </>
                  )}
                  
                  {type === 'trending' && (
                    <>
                      <div className="flex items-center space-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                          <polyline points="17 6 23 6 23 12"></polyline>
                        </svg>
                        <span className="text-xs text-primary-500">{game.ratingCount || game.rating_count ? `${game.ratingCount || game.rating_count} reviews` : 'Trending Up'}</span>
                      </div>
                      <button 
                        onClick={() => handleGameClick(game)} 
                        className="bg-primary-600 hover:bg-primary-700 text-white text-xs py-1 px-2 rounded transition duration-300"
                      >
                        View Details
                      </button>
                    </>
                  )}
                  
                  {type === 'latest' && (
                    <>
                      <span className="text-xs text-tonal-300">Released: {
                        game.first_release_date 
                          ? new Date(game.first_release_date * 1000).toLocaleDateString('en-US', {month: 'short', year: 'numeric'})
                          : game.releaseDate || 'Feb 2024'
                      }</span>
                      <button 
                        onClick={() => handleGameClick(game)} 
                        className="bg-primary-600 hover:bg-primary-700 text-white text-xs py-1 px-2 rounded transition duration-300"
                      >
                        View Details
                      </button>
                    </>
                  )}
                  
                  {type === 'upcoming' && (
                    <>
                      <span className="text-xs text-tonal-300">Coming: {
                        game.first_release_date 
                          ? new Date(game.first_release_date * 1000).toLocaleDateString('en-US', {month: 'short', year: 'numeric'})
                          : game.releaseDate || 'Q2 2024'
                      }</span>
                      <button 
                        onClick={() => handleGameClick(game)} 
                        className="bg-primary-600 hover:bg-primary-700 text-white text-xs py-1 px-2 rounded transition duration-300"
                      >
                        View Details
                      </button>
                    </>
                  )}
                  
                  {type === 'top-rated' && (
                    <>
                      <div className="flex items-center">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${i < Math.floor((game.rating || 95) / 20) ? 'text-yellow-400' : 'text-surface-600'}`} viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-tonal-300 ml-2">{(game.rating ? Math.round(game.rating) / 10 : 9.5).toFixed(1)}/10</span>
                      </div>
                      <button 
                        onClick={() => handleGameClick(game)} 
                        className="bg-primary-600 hover:bg-primary-700 text-white text-xs py-1 px-2 rounded transition duration-300"
                      >
                        View Details
                      </button>
                    </>
                  )}
                  
                  {type === 'editors-pick' && (
                    <>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                        </svg>
                        <span className="text-xs text-primary-400">Must-Play</span>
                      </div>
                      <button 
                        onClick={() => handleGameClick(game)} 
                        className="bg-primary-600 hover:bg-primary-700 text-white text-xs py-1 px-2 rounded transition duration-300"
                      >
                        View Details
                      </button>
                    </>
                  )}
                  
                  {/* For any other type that might not have a specific layout */}
                  {!['recommended', 'trending', 'latest', 'upcoming', 'top-rated', 'editors-pick'].includes(type) && (
                    <button 
                      onClick={() => handleGameClick(game)} 
                      className="bg-primary-600 hover:bg-primary-700 text-white text-xs py-1 px-2 rounded transition duration-300 ml-auto"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Game Modal */}
      {showModal && <GameModal game={selectedGame} onClose={handleCloseModal} />}
    </>
  );
} 