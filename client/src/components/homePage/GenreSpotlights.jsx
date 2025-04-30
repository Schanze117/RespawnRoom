import React from 'react';
import HomePageCard from './HomePageCard';

export default function GenreSpotlights() {
  // Mock data for editor's picks
  const editorsPicks = [
    { 
      id: 1, 
      name: "Cyberpunk 2077", 
      genres: [{ name: "RPG" }, { name: "Open World" }],
      player_perspectives: [{ name: "First Person" }],
      summary: "Cyberpunk 2077 is an open-world, action-adventure story set in Night City, a megalopolis obsessed with power, glamour and body modification. As V, a mercenary outlaw, you can explore a vast city where your choices shape the story and the world around you."
    },
    { 
      id: 2, 
      name: "Alan Wake 2", 
      genres: [{ name: "Horror" }, { name: "Action Adventure" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "Alan Wake 2 is a survival horror sequel where players control both FBI agent Saga Anderson investigating murders in Bright Falls, and Alan Wake himself, trapped in a nightmarish dimension. The game features deep psychological horror and a dual-reality narrative."
    },
    { 
      id: 3, 
      name: "Hades", 
      genres: [{ name: "Roguelike" }, { name: "Action" }],
      player_perspectives: [{ name: "Isometric" }],
      summary: "Hades is a god-like rogue-like dungeon crawler that combines the best aspects of Supergiant's critically acclaimed titles, including satisfying fast-paced combat, gameplay variety, and their signature story elements with memorable characters and narrative."
    },
    { 
      id: 4, 
      name: "Ghost of Tsushima", 
      genres: [{ name: "Action Adventure" }, { name: "Open World" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "In this open-world action adventure, you play as Jin Sakai, a samurai warrior facing overwhelming odds during the Mongol invasion of Japan in 1274. You'll master the way of the Ghost to forge a new path and wage an unconventional war for the freedom of Tsushima."
    },
    { 
      id: 5, 
      name: "Disco Elysium", 
      genres: [{ name: "RPG" }, { name: "Adventure" }],
      player_perspectives: [{ name: "Isometric" }],
      summary: "Disco Elysium is a groundbreaking open world role playing game. You're a detective with a unique skill system at your disposal and a whole city block to carve your path across. Interrogate unforgettable characters, crack murders or take bribes. Be a hero or an absolute disaster of a human being."
    }
  ];

  return (
    <section className="w-full mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary-500">Editor's Picks</h2>
        <button className="text-primary-400 hover:text-primary-300 text-sm font-medium">
          View More Recommended Games
        </button>
      </div>
      
      <HomePageCard games={editorsPicks} type="editors-pick" />
    </section>
  );
} 