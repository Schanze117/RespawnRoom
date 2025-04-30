import React, { useState, useEffect } from 'react';
import ScrollableGameCards from './ScrollableGameCards';
import { getUpcomingReleases } from '../../utils/gameFetcher';

export default function UpcomingReleases() {
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for upcoming releases as fallback
  const mockUpcomingGames = [
    { 
      id: 1, 
      name: "Black Myth: Wukong", 
      genres: [{ name: "Action RPG" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "Black Myth: Wukong is an action RPG based on Journey to the West, featuring intense combat and a rich, mythological setting. As the Destined One, players will confront legendary figures and monsters in a visually stunning world inspired by ancient Chinese folklore."
    },
    { 
      id: 2, 
      name: "Metaphor: ReFantazio", 
      genres: [{ name: "JRPG" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "From the creators of Persona, Metaphor: ReFantazio is a fantasy RPG set in a kingdom experiencing turmoil after the king's murder. Players can recruit unique companions and navigate a complex fantasy world with turn-based combat and social elements."
    },
    { 
      id: 3, 
      name: "S.T.A.L.K.E.R. 2", 
      genres: [{ name: "FPS" }, { name: "Survival" }],
      player_perspectives: [{ name: "First Person" }],
      summary: "S.T.A.L.K.E.R. 2: Heart of Chornobyl is a unique blend of FPS, horror, and immersive sim set in the Chornobyl Exclusion Zone. Featuring one of the biggest open-worlds to date, the game offers non-linear story, survival elements, and unprecedented freedom of choices."
    },
    { 
      id: 4, 
      name: "Frostpunk 2", 
      genres: [{ name: "City Builder" }, { name: "Survival" }],
      player_perspectives: [{ name: "Top-Down" }],
      summary: "Frostpunk 2 is the sequel to the acclaimed society survival game. As the ruler of the last city on Earth, it's your duty to manage both its citizens and the infrastructure. Your ability to impose will, make impactful decisions, and manage resources will be tested."
    }
  ];

  // Format release date to readable string
  const formatReleaseDate = (timestamp) => {
    if (!timestamp) return 'Release date TBA';
    const date = new Date(timestamp * 1000);
    const now = new Date();

    // For dates this year, show Month Day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }
    // For future dates, show Month Year
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const fetchUpcomingGames = async () => {
    try {
      setIsLoading(true);
      
      const { primary, secondary } = await getUpcomingReleases();
      
      // If the API returned no results, use mock data
      if ((!primary && !secondary) || (primary.length === 0 && secondary.length === 0)) {
        console.warn('No upcoming games returned from API. Using mock data instead.');
        setUpcomingGames(mockUpcomingGames);
        return;
      }
      
      // Combine primary and secondary arrays
      const allGames = [...(primary || []), ...(secondary || [])];
      
      // Transform data to match the expected format for ScrollableGameCards
      const formattedGames = allGames.map(game => ({
        id: game.id,
        name: game.name,
        cover: game.cover ? {
          url: game.cover.url.includes('t_thumb') 
            ? game.cover.url.replace('t_thumb', 't_cover_big')
            : game.cover.url
        } : null,
        genres: game.genres || [{ name: "Upcoming" }],
        player_perspectives: game.player_perspectives || [{ name: "Unknown" }],
        summary: game.summary || `Coming soon: ${game.name}`,
        releaseDate: formatReleaseDate(game.first_release_date),
        hypes: game.hypes || 0
      }));
      
      setUpcomingGames(formattedGames);
      setError(null);
    } catch (err) {
      console.error('Error fetching upcoming games:', err);
      console.warn('Using mock data due to API error');
      setUpcomingGames(mockUpcomingGames);
      setError("Failed to load upcoming games. Using sample data instead.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingGames();
  }, []);

  if (isLoading) {
    return (
      <section className="w-full mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary-500">Coming Soon</h2>
        </div>
        <div className="text-center py-8">Loading upcoming games...</div>
      </section>
    );
  }

  return (
    <section className="w-full mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary-500">Coming Soon</h2>
        <button className="text-primary-400 hover:text-primary-300 text-sm font-medium">
          View All Upcoming
        </button>
      </div>
      
      {error && (
        <div className="text-amber-500 text-sm mb-4 p-2 bg-amber-900/30 rounded-md">
          {error}
        </div>
      )}
      
      <ScrollableGameCards games={upcomingGames} type="upcoming" />
    </section>
  );
} 