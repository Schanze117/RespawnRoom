import React from 'react';
import HomePageCard from './HomePageCard';

export default function UpcomingReleases() {
  // Mock data for upcoming releases
  const upcomingGames = [
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

  return (
    <section className="w-full mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary-500">Coming Soon</h2>
        <button className="text-primary-400 hover:text-primary-300 text-sm font-medium">
          View All Upcoming
        </button>
      </div>
      
      <HomePageCard games={upcomingGames} type="upcoming" />
    </section>
  );
} 