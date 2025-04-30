import React from 'react';
import HomePageCard from './HomePageCard';

export default function LatestReleases() {
  // Mock data for latest releases
  const latestReleases = [
    { 
      id: 1, 
      name: "Final Fantasy VII Rebirth", 
      genres: [{ name: "RPG" }, { name: "Action" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "Final Fantasy VII Rebirth is the second entry in the Final Fantasy VII remake project, which reimagines the iconic 1997 RPG. Continue Cloud's journey as he and his friends pursue Sephiroth across the planet in this expansive adventure."
    },
    { 
      id: 2, 
      name: "Tekken 8", 
      genres: [{ name: "Fighting" }],
      player_perspectives: [{ name: "Side View" }],
      summary: "Tekken 8 continues the tragic saga of the Mishima bloodline and their world-shaking father-and-son grudge matches. This entry to the franchise features stunning next-gen graphics and new battle systems for a more aggressive approach to fighting game combat."
    },
    { 
      id: 3, 
      name: "Like a Dragon: Infinite Wealth", 
      genres: [{ name: "Action RPG" }, { name: "Adventure" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "Ichiban Kasuga, a low-ranking yakuza member, returns from prison to discover that no one is waiting for him on the outside. Seeking the truth about his family's betrayal, he takes on a personal journey to become a hero and rise like a dragon."
    },
    { 
      id: 4, 
      name: "Prince of Persia: The Lost Crown", 
      genres: [{ name: "Metroidvania" }, { name: "Action" }],
      player_perspectives: [{ name: "Side View" }],
      summary: "Prince of Persia: The Lost Crown is a 2.5D action-adventure platformer set in a cursed, mythological Persian world. Play as Sargon, a gifted warrior, and use time powers, combat skills, and acrobatic abilities to save the prince and explore the mysterious Mount Qaf."
    }
  ];

  return (
    <section className="w-full mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary-500">Latest Releases</h2>
        <button className="text-primary-400 hover:text-primary-300 text-sm font-medium">
          View All New Releases
        </button>
      </div>
      
      <HomePageCard games={latestReleases} type="latest" />
    </section>
  );
} 