import React from 'react';
import NoImage from '../../assets/noImage.jpg';
import { LuX } from 'react-icons/lu';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ME } from '../../utils/queries';
import { REMOVE_GAME } from '../../utils/mutations';
import { useState } from 'react';
import GameModal from './gameModal';

export default function SavedGameCard() {
    const [showModal, setShowModal] = useState(false);
    const [selectedGame, setSelectedGame] = useState(null);
    // Use Apollo's useQuery hook to fetch saved games
    const { loading, error, data, refetch } = useQuery(GET_ME);

    // Use Apollo's useMutation hook for removing a game
    const [removeGame] = useMutation(REMOVE_GAME);

    // Handle loading and error states
    if (loading) {
        return <div className="text-center text-light mt-20">Loading saved games...</div>;
    }

    if (error) {
        console.error('Error fetching saved games:', error);
        return <div className="text-center text-red-500 mt-20">Failed to load saved games. Please try again later.</div>;
    }

    // Extract saved games from the query result
    const savedGames = data?.me?.savedGames || [];

    const handleSummary = (summary) => {
       
        const formatSummary = summary.slice(0, 180) + '...';

        return <p className={`text-light bg-surface-700 rounded-lg h-41 w-full text-sm md:text-base p-2 ml-3 pointer-events-none`}>
            {formatSummary}
        </p>;

    };

    const handleGameClick = (game) => {
        setSelectedGame(game);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedGame(null);
    };

    // Function to handle game deletion
    const handleDeleteGame = async (gameId) => {
        try {
            await removeGame({
                variables: { gameId },
            });
            console.log('Game removed:', gameId);
            refetch(); // Refetch the GET_ME query to update the saved games list
        } catch (err) {
            console.error('Error removing game:', err);
        }
    };

    return (
        <div className="flex-col flex-wrap gap-4 justify-center py-5">
            {savedGames.map((game) => (
                <div
                    key={game._id}
                    className="flex-col pt-2 pb-4 px-4 my-5 mx-3 bg-surface-800 rounded-lg border border-tonal-400 rounded-lg hover:outline-2 hover:outline-light max-w-[440px] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl h-[300px] md:h-auto shadow-2xl flex-row items-center justify-center shadow-md hover:shadow-2xl transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-101"
                >
                    <div className='flex-col w-full justify-end items-center mb-4'>
                        <div className='flex flex-row relative text-center items-center justify-center w-full border-b border-tonal-400 pb-1'>
                           <h2 className={`text-primary-500 ${game.name.length > 15 ? 'text-xl' : 'text-3xl'} font-medium text-pretty text-center pointer-events-none`}>
                            {game.name}
                            </h2> 
                            <button
                            type="button"
                            onClick={() => handleDeleteGame(game._id)}
                            className="absolute left-0 justify-end rounded-sm p-0.5 text-tonal-500 hover:text-tonal-800 focus:text-tonal-800 text-md bg-error hover:bg-dark-error focus:outline-2 focus:outline-offset-1 focus:outline-light rounded-lg cursor-pointer"
                        >
                            <LuX />
                            </button>
                            <button
                            type="button"
                            onClick={() => handleGameClick(game)}
                            className="absolute right-0 justify-end rounded-sm p-1 text-tonal-500 hover:text-tonal-800 focus:text-tonal-800 text-md bg-primary-500 hover:bg-primary-700 focus:outline-2 focus:outline-offset-1 focus:outline-light rounded-lg cursor-pointer"
                            >
                            <p className='text-light text-sm font-medium'>View</p>
                            </button>
                        </div>
                        <div className="flex flex-row items-center justify-center text-center text-pretty text-tonal-400 text-sm ">
                            <p className="pointer-events-none mr-4">
                                <span className="text-primary-400 font-medium pointer-events-none">
                                    Genres:{' '}
                                </span>
                                {Array.isArray(game.genres) ? game.genres.join(', ') : 'N/A'}
                            </p>
                            <p className="pointer-events-none">
                                <span className="text-primary-400 font-medium pointer-events-none">
                                    POV:{' '}
                                </span>
                                {Array.isArray(game.playerPerspectives)
                                    ? game.playerPerspectives.join(', ')
                                    : 'N/A'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-row w-full items-center justify-center justify-between">
                        <img
                            src={game.cover ? game.cover.replace('t_thumb', 't_720p') : NoImage}
                            alt={game.name}
                            className="w-32 h-41 object-cover rounded-lg"
                        />
                        {game.summary? handleSummary(game.summary) :
                        <p className='text-light bg-surface-700 rounded-lg h-41 w-full text-sm md:text-base p-2 ml-3 text-pretty pointer-events-none'>
                            No summary available.
                        </p>}
                    </div>
                </div>
            ))}
            {showModal && <GameModal game={selectedGame} onClose={handleCloseModal} location={'saved'} />}
        </div>
    );
}