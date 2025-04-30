import React, { useState, useEffect } from 'react';
import ScrollableGameCards from './ScrollableGameCards';
import { getFeaturedGames } from '../../utils/gameFetcher';

export default function TrendingGames() {
  const [trendingGames, setTrendingGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for trending games as fallback
  const mockTrendingGames = [
    { 
      id: 1, 
      name: "Baldur's Gate 3", 
      genres: [{ name: "RPG" }],
      player_perspectives: [{ name: "Isometric" }],
      summary: "Gather your party and return to the Forgotten Realms in a tale of fellowship and betrayal, sacrifice and survival, and the lure of absolute power. Baldur's Gate 3 is a next-generation RPG set in the D&D universe."
    },
    { 
      id: 2, 
      name: "Starfield", 
      genres: [{ name: "RPG" }, { name: "Open World" }],
      player_perspectives: [{ name: "First Person" }, { name: "Third Person" }],
      summary: "In this next generation role-playing game set amongst the stars, create any character you want and explore with unparalleled freedom as you embark on an epic journey to answer humanity's greatest mystery."
    },
    { 
      id: 3, 
      name: "Palworld", 
      genres: [{ name: "Survival" }, { name: "MMO" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "Palworld is a multiplayer creature-collection survival game where you can build bases, battle other trainers, and work alongside your captured creatures in a vast open world."
    },
    { 
      id: 4, 
      name: "Helldivers 2", 
      genres: [{ name: "Co-op Shooter" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "Helldivers 2 is a cooperative third-person shooter where you fight for a procedurally generated galaxy against enemy alien threats. Alone or with up to four friends, take on missions and help liberate galaxy sectors from three different enemy species."
    },
    { 
      id: 5, 
      name: "Final Fantasy VII Rebirth", 
      genres: [{ name: "RPG" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "The story of Final Fantasy VII Rebirth continues Cloud's journey through a vast and vibrant world. Experience this second chapter of the critically acclaimed remake."
    },
    { 
      id: 6, 
      name: "Elden Ring", 
      genres: [{ name: "Action RPG" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "THE NEW FANTASY ACTION RPG. Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between."
    },
    { 
      id: 7, 
      name: "The Legend of Zelda: Tears of the Kingdom", 
      genres: [{ name: "Action Adventure" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "The Legend of Zelda: Tears of the Kingdom is the sequel to The Legend of Zelda: Breath of the Wild. The adventure is set in the skies above Hyrule as well as the land below."
    },
    { 
      id: 8, 
      name: "Hogwarts Legacy", 
      genres: [{ name: "Action RPG" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "Hogwarts Legacy is an immersive, open-world action RPG set in the world first introduced in the Harry Potter books."
    }
  ];

  useEffect(() => {
    const fetchTrendingGames = async () => {
      try {
        setIsLoading(true);
        
        const { primary, secondary } = await getFeaturedGames();
        
        // If the API returned no results, use mock data
        if ((!primary && !secondary) || (primary.length === 0 && secondary.length === 0)) {
          console.warn('No games returned from API. Using mock data instead.');
          setTrendingGames(mockTrendingGames);
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
          genres: game.genres || [{ name: "Popular" }],
          player_perspectives: game.player_perspectives || [{ name: "Unknown" }],
          summary: game.summary || `Trending game: ${game.name}`,
          rating: game.rating || null
        }));
        
        setTrendingGames(formattedGames);
        setError(null);
      } catch (err) {
        console.error('Error fetching trending games:', err);
        console.warn('Using mock data due to API error');
        setTrendingGames(mockTrendingGames);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingGames();
  }, []);

  if (isLoading) {
    return (
      <section className="w-full mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary-500">Trending Now</h2>
        </div>
        <div className="text-center py-8">Loading trending games...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary-500">Trending Now</h2>
        </div>
        <div className="text-center py-8 text-red-500">{error}</div>
      </section>
    );
  }

  return (
    <section className="w-full mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary-500">Trending Now</h2>
        <button className="text-primary-400 hover:text-primary-300 text-sm font-medium">
          See All Trending
        </button>
      </div>
      
      <ScrollableGameCards games={trendingGames} type="trending" />
    </section>
  );
} 