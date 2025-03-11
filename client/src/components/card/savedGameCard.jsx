import NoImage from '../../assets/noImage.jpg';
import { LuX } from 'react-icons/lu';

// Component to display saved games
export default function GameCard({ games }) {

    // Function to handle game deletion
    const deleteGame = async (game) => {
        // Implementation for deleting the game will go here
    };

    return (
        <div className='flex-row flex-wrap gap-4 justify-center py-5'>
            {
            // Map through the games array and render each game
            games.map((game) => (
                <div key={game.id} className="block pb-4 px-4 my-5 mx-3 space-y-1 bg-surface-800 rounded-lg hover:outline-3 hover:outline-primary-600 w-stretch h-55 flex-row items-center justify-center shadow-md hover:shadow-2xl transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-101">
                    <div className="flex w-full justify-end items-center">
                        {/* Button to delete the game */}
                        <button type="button" onClick={() => deleteGame(game)} className='block rounded-sm p-0.5 mt-2 text-tonal-500 hover:text-tonal-800 focus:text-tonal-800 text-lg bg-error hover:bg-dark-error focus:outline-2 focus:outline-offset-1 focus:outline-light rounded-lg cursor-pointer'><LuX /></button>
                    </div>
                    <div className="flex w-full justify-between space-x-4">
                        {/* Display game cover image or a placeholder if not available */}
                        <img src={game.cover ? game.cover.url : NoImage} alt={game.name} className="w-32 h-41 object-cover rounded-lg" />
                        <div className='flex flex-col w-full items-center justify-center '>
                            <div className="flex flex-row w-full h-fit items-center justify-between mb-2">
                                {/* Display game name */}
                                <h2 className={`text-primary-500 ${game.name.length > 15 ? 'text-lg' : 'text-3xl'} font-medium text-pretty text-center pointer-events-none bg-surface-700 rounded-lg px-1`}>{game.name}</h2>
                                <div className="flex flex-row items-center justify-center text-center text-pretty text-tonal-400 text-sm bg-surface-700 rounded-lg p-1">
                                    {/* Display game genres */}
                                    <p className='pointer-events-none mr-4'><span className="text-primary-400 font-medium pointer-events-none">Genres: </span>{game.genres ? game.genres.map((genre) => genre.name).join(", ") : 'N/A'}</p>
                                    {/* Display game player perspectives */}
                                    <p className='pointer-events-none'><span className="text-primary-400 font-medium pointer-events-none">POV: </span>{game.player_perspectives ? game.player_perspectives.map((perspective) => perspective.name).join(", ") : 'N/A'}</p>
                                </div>
                            </div>
                            {/* Display game summary */}
                            <p className="text-light bg-surface-700 rounded-lg h-30 w-full text-base p-2 line-clamp-5 truncate text-pretty pointer-events-none">{game.summary || 'No summary available.'}</p>
                        </div>
                    </div>  
                </div>
            ))}
        </div>
    );
}