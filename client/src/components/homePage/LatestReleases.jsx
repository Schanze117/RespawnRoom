import React, { useState, useEffect } from 'react';
import ScrollableGameCards from './ScrollableGameCards';
import { getLatestGames } from '../../utils/gameFetcher';

export default function LatestReleases() {
  const [latestGames, setLatestGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for latest releases as fallback
  const mockLatestGames = [
    { 
      id: 101, 
      name: "Elden Ring: Shadow of the Erdtree", 
      genres: [{ name: "Action RPG" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "Journey into the realm of shadow in this major expansion for ELDEN RING. New weapons, equipment, and abilities await to aid you in your exploration of Shadow of the Erdtree."
    },
    { 
      id: 102, 
      name: "Dragon's Dogma 2", 
      genres: [{ name: "Action RPG" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "Set forth on an adventure with your loyal Pawns in this immersive, high-fantasy action RPG. New adventures await in this much-anticipated sequel to Dragon's Dogma."
    },
    { 
      id: 103, 
      name: "Final Fantasy VII Rebirth", 
      genres: [{ name: "RPG" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "The journey of Cloud and his companions continues in this second entry of the Final Fantasy VII remake project, exploring an open world beyond Midgar for the first time."
    },
    { 
      id: 104, 
      name: "Stellar Blade", 
      genres: [{ name: "Action" }, { name: "Adventure" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "Take on the role of Eve, a warrior from the previously destroyed Colony, who decides to fight against the NA:tives and save the last bastion of humanity, Xion."
    },
    { 
      id: 105, 
      name: "Helldivers 2", 
      genres: [{ name: "Shooter" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "Helldivers 2 is a cooperative third-person shooter where you fight for a procedurally generated galaxy against enemy alien threats."
    },
    { 
      id: 106, 
      name: "Like a Dragon: Infinite Wealth", 
      genres: [{ name: "RPG" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "Two larger-than-life heroes, Ichiban Kasuga and Kazuma Kiryu, unite in this action-packed RPG that spans a multitude of combat styles, minigames, and emotional story sequences."
    }
  ];

  // Format release date to readable string
  const formatReleaseDate = (timestamp) => {
    if (!timestamp) return 'Unknown release date';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const fetchLatestGames = async () => {
    try {
      setIsLoading(true);
      
      const { primary, secondary } = await getLatestGames();
      
      // If the API returned no results, use mock data
      if ((!primary && !secondary) || (primary.length === 0 && secondary.length === 0)) {
        console.warn('No latest games returned from API. Using mock data instead.');
        setLatestGames(mockLatestGames);
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
        genres: game.genres || [{ name: "New Release" }],
        player_perspectives: game.player_perspectives || [{ name: "Unknown" }],
        summary: game.summary || `New release: ${game.name}`,
        rating: game.rating || null,
        releaseDate: formatReleaseDate(game.first_release_date),
        ratingCount: game.rating_count || 0
      }));
      
      setLatestGames(formattedGames);
      setError(null);
    } catch (err) {
      console.error('Error fetching latest games:', err);
      console.warn('Using mock data due to API error');
      setLatestGames(mockLatestGames);
      setError("Failed to load latest games. Using sample data instead.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestGames();
  }, []);

  if (isLoading) {
    return (
      <section className="w-full mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary-500">Latest Releases</h2>
        </div>
        <div className="text-center py-8">Loading latest releases...</div>
      </section>
    );
  }

  return (
    <section className="w-full mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary-500">Latest Releases</h2>
        <button className="text-primary-400 hover:text-primary-300 text-sm font-medium">
          See All Releases
        </button>
      </div>
      
      {error && (
        <div className="text-amber-500 text-sm mb-4 p-2 bg-amber-900/30 rounded-md">
          {error}
        </div>
      )}
      
      <ScrollableGameCards games={latestGames} type="latest" />
    </section>
  );
} 