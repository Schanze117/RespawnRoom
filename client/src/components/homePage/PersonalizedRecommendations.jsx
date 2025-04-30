import React from 'react';
import HomePageCard from './HomePageCard';

export default function PersonalizedRecommendations() {
  // Mock data for game cards
  const recommendations = [
    { 
      id: 1, 
      name: "The Witcher 3", 
      genres: [{ name: "RPG" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "The Witcher 3: Wild Hunt is a story-driven, next-generation open world role-playing game set in a visually stunning fantasy universe full of meaningful choices and impactful consequences."
    },
    { 
      id: 2, 
      name: "God of War", 
      genres: [{ name: "Action Adventure" }],
      player_perspectives: [{ name: "Third Person" }],
      summary: "His vengeance against the Gods of Olympus years behind him, Kratos now lives as a man in the realm of Norse Gods and monsters. It is in this harsh, unforgiving world that he must fight to survive... and teach his son to do the same."
    },
    { 
      id: 3, 
      name: "Hollow Knight", 
      genres: [{ name: "Metroidvania" }, { name: "Platformer" }],
      player_perspectives: [{ name: "Side View" }],
      summary: "Forge your own path in Hollow Knight! An epic action adventure through a vast ruined kingdom of insects and heroes. Explore twisting caverns, battle tainted creatures and befriend bizarre bugs."
    },
    { 
      id: 4, 
      name: "Stardew Valley", 
      genres: [{ name: "Simulation" }, { name: "RPG" }],
      player_perspectives: [{ name: "Top-Down" }],
      summary: "You've inherited your grandfather's old farm plot in Stardew Valley. Armed with hand-me-down tools and a few coins, you set out to begin your new life. Can you learn to live off the land and turn these overgrown fields into a thriving home?"
    }
  ];

  return (
    <section className="w-full mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary-500">Recommended For You</h2>
        <button className="text-primary-400 hover:text-primary-300 text-sm font-medium">
          View All
        </button>
      </div>
      
      <HomePageCard games={recommendations} type="recommended" />
    </section>
  );
} 