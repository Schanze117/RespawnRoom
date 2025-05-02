// filepath: c:\Bootcamp\Project2\RespawnRoom\client\src\components\card\gameModal.jsx
import { useEffect, useState } from 'react';
import NoImage from '../../assets/noImage.jpg';
import { getGameVideo } from '../../utils/api';
import MovieClip from './YouTube/youtube'; // Import the MovieClip component

export default function GameModal({ game, onClose }) {
    if (!game) return null; // If no game is provided, don't render the modal

    const [hasVideo, sethasVideo] = useState(false); // State to store the video ID
    
    const hdCover = game.cover ? game.cover.url.replace('t_thumb', 't_720p') : NoImage;

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                console.log('Escape key pressed');
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    useEffect(() => {
        const fetchGameVideo = async () => {
            try {
                const videoData = await getGameVideo(game.videos[0]); // Fetch the video data using the provided function
                if (videoData && videoData.length > 0) {
                    const video = videoData[0];
                    const videoId = video.video_id; // Extract the video ID from the response
                    game.videoId = videoId; // Store the videoId in the game object
                    sethasVideo(true); // Set hasVideo to true if a video is available
                } else {
                    game.videoId = null; // No video available
                }
            } catch (error) {
                console.error('Error fetching game video:', error);
            }
        };

        fetchGameVideo();
    }, []);

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 modalBackground" onClick={(e) => e.target.classList.contains('modalBackground') && onClose()}>
            <div className="bg-surface-800 p-6 w-full max-w-small sm:max-w-md md:max-w-xl lg:max-w-2xl xl:max-w-6xl h-auto max-h-[90vh] shadow-2xl relative overflow-y-auto border-collapse border border-tonal-400 rounded-lg">
                <button onClick={onClose} className="absolute top-2 right-2 text-tonal-600 hover:text-tonal-800 focus:outline-none">
                    X
                </button>
                <h2 className="text-green-text text-3xl font-medium text-pretty text-center w-full border-b border-tonal-400">{game.name}</h2>
                <div className="flex xl:flex-row flex-col space-x-4 mt-2 py-2 border border-tonal-400 ">
                    {/* Cover Image */}
                    <div className='w-full max-w-lg mx-auto aspect-ratio-16/9 '>
                        <img
                        src={game.cover ? hdCover : NoImage}
                        alt={game.name}
                        className="w-full h-full object-cover rounded-lg"
                        />
                    </div>
                    <div className="flex flex-col text-pretty text-sm text-center items-center max-md:pt-5 w-auto xl:w-[50%] space-y-1">
                        {/* Generes and POVs*/}
                        <h3 className="text-tonal-400 text-xl font-medium text-pretty pointer-events-none border-b border-tonal-400 mx-2 w-[95%] shadow-lg">Genres and POVs</h3>
                        <div className='w-auto max-w-[95%] items-center justify-center mx-auto text-center text-tonal-400 text-sm mt-2'>
                                <p className="pointer-events-none">
                                <span className="text-primary-400 font-medium pointer-events-none">Genres: </span>
                                {game.genres ? game.genres.map((genre) => genre.name).join(", ") : 'N/A'}
                            </p>
                            <p className="pointer-events-none">
                                <span className="text-primary-400 font-medium pointer-events-none">POV: </span>
                                {game.player_perspectives ? game.player_perspectives.map((perspective) => perspective.name).join(", ") : 'N/A'}
                            </p>
                        </div>
                        {/* Summary */}
                        <h3 className="text-tonal-400 text-xl font-medium text-pretty pointer-events-none border-b border-tonal-400 mx-2 w-[95%] shadow-lg">Summary</h3>
                        <p className="text-light bg-surface-700 rounded-lg w-full text-base p-2 mx-2 text-pretty max-w-[95%] max-h-80 overflow-y-auto mt-2">
                        {game.summary || 'No summary available.'}
                        </p>
                        {/* Video Section */}
                        <h3 className="text-tonal-400 text-xl font-medium text-pretty pointer-events-none border-b border-tonal-400 mx-2 w-[95%] shadow-lg">Trailer</h3>
                        <div className='w-full max-w-[95%]'>
                            <div className="rounded-lg relative pt-[56.25%]  h-0 mt-4">
                                {hasVideo ? (
                                    <MovieClip videoId={game.videoId} /> // Pass the videoId to MovieClip
                                ) : (
                                    <p className="text-center text-light">No video available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}