import React from 'react';
import HomePageCard from './HomePageCard';

export default function TopRated() {
  // Mock data for top rated games
  const topRatedGames = [
    { 
      id: 1, 
      name: "The Legend of Zelda: Tears of the Kingdom", 
      genres: [{ name: "Action Adventure" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "The Legend of Zelda: Tears of the Kingdom is the sequel to Breath of the Wild. Link's adventure is set on the ground and in the skies of Hyrule, offering a vastly expanded world with new abilities, challenges, and mysteries to uncover."
    },
    { 
      id: 2, 
      name: "Baldur's Gate 3", 
      genres: [{ name: "RPG" }],
      player_perspectives: [{ name: "Isometric" }],
      summary: "Gather your party and return to the Forgotten Realms in a tale of fellowship and betrayal, sacrifice and survival, and the lure of absolute power. Baldur's Gate 3 is a next-generation RPG set in the D&D universe from the creators of Divinity: Original Sin 2."
    },
    { 
      id: 3, 
      name: "Red Dead Redemption 2", 
      genres: [{ name: "Action Adventure" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "America, 1899. The end of the Wild West era has begun. After a robbery goes badly wrong in the western town of Blackwater, Arthur Morgan and the Van der Linde gang are forced to flee. With federal agents and the best bounty hunters in the nation massing on their heels."
    },
    { 
      id: 4, 
      name: "Elden Ring", 
      genres: [{ name: "Action RPG" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "Elden Ring is a fantasy action-RPG adventure set within a world created by Hidetaka Miyazaki—creator of the influential DARK SOULS video game series—and George R.R. Martin—author of The New York Times best-selling fantasy series, A Song of Ice and Fire."
    }
  ];

  return (
    <section className="w-full mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary-500">Top Rated</h2>
        <button className="text-primary-400 hover:text-primary-300 text-sm font-medium">
          See All Top Games
        </button>
      </div>
      
      <HomePageCard games={topRatedGames} type="top-rated" />
    </section>
  );
} 