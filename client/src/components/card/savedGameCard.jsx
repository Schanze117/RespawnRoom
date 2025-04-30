import React from 'react';
import NoImage from '../../assets/noImage.jpg';
import { LuX } from 'react-icons/lu';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ME } from '../../utils/queries';
import { REMOVE_GAME } from '../../utils/mutations';

export default function SavedGameCard() {
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
        <div className="flex-row flex-wrap gap-4 justify-center py-5">
            {savedGames.map((game) => (
                <div
                    key={game._id}
                    className="block pb-4 px-4 my-5 mx-3 space-y-1 bg-surface-800 rounded-lg hover:outline-3 hover:outline-primary-600 w-stretch h-55 flex-row items-center justify-center shadow-md hover:shadow-2xl transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-101"
                >
                    <div className="flex w-full justify-end items-center">
                        <button
                            type="button"
                            onClick={() => handleDeleteGame(game._id)}
                            className="block rounded-sm p-0.5 mt-2 text-tonal-500 hover:text-tonal-800 focus:text-tonal-800 text-lg bg-error hover:bg-dark-error focus:outline-2 focus:outline-offset-1 focus:outline-light rounded-lg cursor-pointer"
                        >
                            <LuX />
                        </button>
                    </div>
                    <div className="flex w-full justify-between space-x-4">
                        <img
                            src={game.cover ? game.cover : NoImage}
                            alt={game.name}
                            className="w-32 h-41 object-cover rounded-lg"
                        />
                        <div className="flex flex-col w-full items-center justify-center">
                            <div className="flex flex-row w-full h-fit items-center justify-between mb-2">
                                <h2
                                    className={`text-primary-500 ${
                                        game.name.length > 15 ? 'text-lg' : 'text-3xl'
                                    } font-medium text-pretty text-center pointer-events-none bg-surface-700 rounded-lg px-1`}
                                >
                                    {game.name}
                                </h2>
                                <div className="flex flex-row items-center justify-center text-center text-pretty text-tonal-400 text-sm bg-surface-700 rounded-lg p-1">
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
                            <p className="text-light bg-surface-700 rounded-lg h-30 w-full text-base p-2 line-clamp-5 truncate text-pretty pointer-events-none">
                                {game.summary || 'No summary available.'}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}