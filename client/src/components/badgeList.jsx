import React from 'react';
import BadgeMenu from './BadgeMenu';

const badgeList = () => {
  // Define the list of badges
  const badges = [
    { src: './assets/save1Game.png', name: 'First Saved Game' },
    { src: './assets/save10Games.png', name: 'Save Enthusiast' },
    { src: './assets/save100Games.png', name: 'Save Master' }, 
    { src: './assets/firstGameSearch.png', name: 'First Searched Game' },
    { src: './assets/tenGameSearch.png', name: 'Search Enthusiast' },
    { src: './assets/hundredGameSearch.png', name: 'Search Master' },
  ];

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">User Badges</h1>
      {/* Pass the badges array to the BadgeMenu component */}
      <BadgeMenu badges={badges} />
    </div>
  );
};

export default badgeList;