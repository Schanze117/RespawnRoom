import React, { useEffect, useState } from 'react';
import ScrollableGameCards from './ScrollableGameCards';
import { useGameContext } from '../../utils/GameContext';

export default function TrendingGames() {
  const { featuredGames, isLoading, respawnCount } = useGameContext();
  const [displayGames, setDisplayGames] = useState([]);

  // Mock data for trending games as fallback
  const mockTrendingGames = [
    { 
      id: 1, 
      name: "Baldur's Gate 3", 
      genres: [{ name: "RPG" }],
      player_perspectives: [{ name: "Isometric" }],
      summary: "Gather your party and return to the Forgotten Realms in a tale of fellowship and betrayal, sacrifice and survival, and the lure of absolute power. Baldur's Gate 3 is a next-generation RPG set in the D&D universe.",
      rating: 96.2,
      rating_count: 14762,
      first_release_date: 1691107200 // August 3, 2023
    },
    { 
      id: 2, 
      name: "Starfield", 
      genres: [{ name: "RPG" }, { name: "Open World" }],
      player_perspectives: [{ name: "First Person" }, { name: "Third Person" }],
      summary: "In this next generation role-playing game set amongst the stars, create any character you want and explore with unparalleled freedom as you embark on an epic journey to answer humanity's greatest mystery.",
      rating: 86.5,
      rating_count: 8243,
      first_release_date: 1693958400 // September 6, 2023
    },
    { 
      id: 3, 
      name: "Palworld", 
      genres: [{ name: "Survival" }, { name: "MMO" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "Palworld is a multiplayer creature-collection survival game where you can build bases, battle other trainers, and work alongside your captured creatures in a vast open world.",
      rating: 83.2,
      rating_count: 7851,
      first_release_date: 1705622400 // January 19, 2024
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

  // Force component re-render when respawnCount changes
  useEffect(() => {
    
    // Combine primary and secondary games
    const trendingGames = [...featuredGames.primary, ...featuredGames.secondary];

    // If we have trending games, use them; otherwise use mock data
    const baseGames = trendingGames.length > 0 ? trendingGames : mockTrendingGames;
    
    // Create new game objects to ensure reference changes
    const refreshedGames = baseGames.map(game => ({
      ...game,
      _respawnId: respawnCount, // Add respawn ID to force React to see the object as new
      ratingCount: game.rating_count || game.ratingCount || 0 // Map rating_count to ratingCount for UI compatibility
    }));
    
    setDisplayGames(refreshedGames);
    
    // Debug log
  }, [featuredGames, respawnCount]);

  if (isLoading && displayGames.length === 0) {
    return (
      <section className="w-full mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary-500">Trending Now</h2>
        </div>
        <div className="text-center py-8">Loading trending games...</div>
      </section>
    );
  }

  return (
    <section className="w-full mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary-500">Trending Now</h2>
      </div>
      
      {/* Force re-render with a new component instance by using a unique key */}
      <ScrollableGameCards 
        games={displayGames} 
        type="trending" 
        key={`trending-${respawnCount}`} 
      />
    </section>
  );
} 