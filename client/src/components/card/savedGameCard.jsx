import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import NoImage from '../../assets/noImage.jpg';
import { LuX } from 'react-icons/lu';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ME } from '../../utils/queries';
import { REMOVE_GAME } from '../../utils/mutations';
import GameModal from './gameModal';
import { searchGames } from '../../utils/api';

export default function SavedGameCard() {
    const [showModal, setShowModal] = useState(false);
    const [selectedGame, setSelectedGame] = useState(null);
    const [imageError, setImageError] = useState({});
    const [gameDetails, setGameDetails] = useState({});

    const { loading, error, data, refetch } = useQuery(GET_ME);
    const [removeGame] = useMutation(REMOVE_GAME);

    const handleImageError = useCallback((gameId) => {
        setImageError(prev => ({ ...prev, [gameId]: true }));
    }, []);

    // Process image URL to get the best quality version
    const getOptimizedImageUrl = useCallback((url) => {
        if (!url) {
            return NoImage;
        }
        
        // Handle both direct URLs and URLs with t_thumb/t_cover_small
        if (url.includes('t_thumb') || url.includes('t_cover_small') || url.includes('t_729p')) {
            const optimizedUrl = url.replace('t_thumb', 't_1080p')
                                  .replace('t_cover_small', 't_1080p')
                                  .replace('t_729p', 't_1080p');
            return optimizedUrl;
        }
        
        // If it's a direct image ID, construct the full URL
        if (url.startsWith('co') || url.startsWith('tm')) {
            const optimizedUrl = `https://images.igdb.com/igdb/image/upload/t_1080p/${url}`;
            return optimizedUrl;
        }
        
        return url;
    }, []);

    const handleSummary = useCallback((summary) => {
        if (!summary) return null;
        const formatSummary = summary.slice(0, 180) + '...';
        return (
            <p className="text-light bg-surface-700 rounded-lg h-41 w-full text-sm md:text-base p-2 ml-3">
                {formatSummary}
            </p>
        );
    }, []);

    // Fetch game details by name
    const fetchGameDetails = useCallback(async (game) => {
        try {
            // Check if we already have details cached
            if (gameDetails[game._id]) {
                const enhancedGame = {
                    ...game,
                    id: gameDetails[game._id].id,
                    genres: gameDetails[game._id].genres,
                    player_perspectives: gameDetails[game._id].player_perspectives,
                    videos: gameDetails[game._id].videos
                };
                setSelectedGame(enhancedGame);
                setShowModal(true);
                return;
            }

            // Fetch game details from API
            const results = await searchGames(game.name, 1, 1);
            
            if (results.games.length > 0) {
                const apiGame = results.games[0];
                
                // Cache the result
                setGameDetails(prev => ({
                    ...prev,
                    [game._id]: {
                        id: apiGame.id,
                        genres: apiGame.genres || [],
                        player_perspectives: apiGame.player_perspectives || [],
                        videos: apiGame.videos || []
                    }
                }));
                
                // Create enhanced game object with both local and API data
                const enhancedGame = {
                    ...game,
                    id: apiGame.id,
                    genres: apiGame.genres || [],
                    player_perspectives: apiGame.player_perspectives || [],
                    videos: apiGame.videos || []
                };
                
                setSelectedGame(enhancedGame);
                setShowModal(true);
            } else {
                // If no details found, just use saved data
                setSelectedGame(game);
                setShowModal(true);
            }
        } catch (error) {
            console.error("Error fetching game details:", error);
            // Fallback to just showing saved data
            setSelectedGame(game);
            setShowModal(true);
        }
    }, [gameDetails]);

    const handleGameClick = useCallback((game) => {
        fetchGameDetails(game);
    }, [fetchGameDetails]);

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        setSelectedGame(null);
    }, []);

    const handleDeleteGame = useCallback(async (gameId) => {
        try {
            await removeGame({
                variables: { gameId },
            });
            await refetch();
        } catch (err) {
            // Handle error silently
        }
    }, [removeGame, refetch]);

    if (loading) {
        return <div className="text-center text-light mt-20">Loading saved games...</div>;
    }

    if (error) {
        return (
            <div className="text-center text-red-500 mt-20">
                Failed to load saved games. Please try again later.
            </div>
        );
    }

    const savedGames = data?.me?.savedGames || [];

    return (
        <div className="flex flex-col gap-4 py-5">
            {savedGames.map((game) => (
                <div
                    key={game._id}
                    className="flex flex-col p-4 my-5 mx-3 bg-surface-800 rounded-lg border border-tonal-400 hover:outline-2 hover:outline-light max-w-[440px] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl h-auto shadow-md hover:shadow-2xl transition duration-300 ease-in-out transform hover:-translate-y-1"
                >
                    <div className="flex flex-col w-full mb-4">
                        <div className="flex items-center justify-between border-b border-tonal-400 pb-2">
                            <button
                                type="button"
                                onClick={() => handleDeleteGame(game._id)}
                                className="p-1 text-tonal-500 hover:text-tonal-800 focus:text-tonal-800 bg-error hover:bg-dark-error rounded-lg focus:outline-2 focus:outline-offset-1 focus:outline-light"
                                aria-label="Delete game"
                            >
                                <LuX />
                            </button>
                            <h2 className={`text-primary-500 ${game.name.length > 15 ? 'text-xl' : 'text-3xl'} font-medium text-center`}>
                                {game.name}
                            </h2>
                            <button
                                type="button"
                                onClick={() => handleGameClick(game)}
                                className="p-1 text-tonal-500 hover:text-tonal-800 focus:text-tonal-800 bg-primary-500 hover:bg-primary-700 rounded-lg focus:outline-2 focus:outline-offset-1 focus:outline-light"
                                aria-label="View game details"
                            >
                                <span className="text-light text-sm font-medium">View Details</span>
                            </button>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 text-tonal-400 text-sm mt-2">
                            <p>
                                <span className="text-primary-400 font-medium">Genres: </span>
                                {Array.isArray(game.genres) ? game.genres.join(', ') : 'N/A'}
                            </p>
                            <p>
                                <span className="text-primary-400 font-medium">POV: </span>
                                {Array.isArray(game.playerPerspectives)
                                    ? game.playerPerspectives.join(', ')
                                    : 'N/A'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-row items-center gap-4">
                        <img
                            src={!imageError[game._id] && game.cover 
                                ? getOptimizedImageUrl(game.cover)
                                : NoImage}
                            alt={`Cover for ${game.name}`}
                            className="w-32 h-41 object-cover rounded-lg"
                            onError={() => handleImageError(game._id)}
                        />
                        {game.summary 
                            ? handleSummary(game.summary)
                            : <p className="text-light bg-surface-700 rounded-lg h-41 w-full text-sm md:text-base p-2 ml-3">
                                No summary available.
                            </p>
                        }
                    </div>
                </div>
            ))}
            {showModal && selectedGame && (
                <GameModal 
                    game={selectedGame} 
                    onClose={handleCloseModal} 
                    location="saved" 
                />
            )}
        </div>
    );
}

SavedGameCard.propTypes = {
    // Add PropTypes if this component receives any props
};