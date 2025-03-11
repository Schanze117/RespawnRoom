import NoImage from '../../assets/noImage.jpg';
import { LuSave } from 'react-icons/lu';

export default function GameCard({ games }) {

    const saveGame = async (game) => {
        try {
            const token = localStorage.getItem('jwtToken'); // Retrieve the token from local storage or another source

            const response = await fetch('/api2/videogames', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
                },
                body: JSON.stringify({
                    cover: game.cover ? game.cover.url : null,
                    name: game.name,
                    genre: game.genres.map((genre) => genre.name).join(', '),
                    playerPerspective: game.player_perspectives.map((perspective) => perspective.name).join(', '),
                    summary: game.summary,  
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save game');
            }

            const savedGame = await response.json();
            console.log('Game saved to server:', savedGame);
        } catch (error) {
            console.error('Error saving game:', error);
        }
    };

    return (
        <div className='flex flex-wrap gap-4 justify-center py-5'>
            {
            games.map((game) => (
                <div key={game.id} className="pb-4 px-4 mx-1 space-y-2 bg-surface-800 rounded-lg hover:outline-3 hover:outline-primary-600 w-100 h-105 flex flex-col items-center justify-center shadow-md hover:shadow-2xl transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-102">
                    <div className="flex flex-row w-full justify-end">
                        <button type="button" onClick={() => saveGame(game)} className='block rounded-sm p-0.5 text-tonal-600 hover:text-tonal-800 focus:text-tonal-800 text-lg bg-primary-500 hover:bg-primary-600 focus:outline-2 focus:outline-offset-1 focus:outline-light rounded-lg cursor-pointer'><LuSave /></button>
                    </div>
                    <div className="flex flex-row w-full justify-between space-x-4">
                        <img src={game.cover ? game.cover.url : NoImage} alt={game.name} className="w-32 h-32 object-cover rounded-lg" />
                        <div className="flex flex-col w-full items-center justify-center bg-surface-700 rounded-lg">
                            <h2 className={`text-primary-500 ${game.name.length > 15 ? 'text-lg' : 'text-3xl'} font-medium text-pretty text-center pointer-events-none`}>{game.name}</h2>
                            <div className="flex flex-col items-center justify-center text-center text-pretty text-tonal-400 text-sm pt-2">
                                <p className='pointer-events-none'><span className="text-primary-400 font-medium pointer-events-none">Genres: </span>{game.genres ? game.genres.map((genre) => genre.name).join(", ") : 'N/A'}</p>
                                <p className='pointer-events-none'><span className="text-primary-400 font-medium pointer-events-none">POV: </span>{game.player_perspectives ? game.player_perspectives.map((perspective) => perspective.name).join(", ") : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-light bg-surface-700 rounded-lg h-56 w-93 text-base p-2 line-clamp-9 truncate text-pretty pointer-events-none">{game.summary || 'No summary available.'}</p>
                </div>
            ))}
        </div>
    );
}