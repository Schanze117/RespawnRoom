import React, { useState } from 'react';
import { FaMedal as Medal } from 'react-icons/fa';

// Badge shape: image source and display name
interface Badge {
  src: string;
  name: string;
}

// Props for BadgeMenu: list of badges
interface BadgeMenuProps {
  badges: Badge[];
}

// BadgeMenu component: button toggles visibility of a badge popover
const BadgeMenu: React.FC<BadgeMenuProps> = ({ badges }) => {
  const [open, setOpen] = useState(false);
  const toggleOpen = () => setOpen(prev => !prev);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Button with a medal icon and label */}
      <button
        onClick={toggleOpen}
        className="w-full flex items-center px-4 py-2 text-light hover:bg-surface-700 rounded transition-colors"
      >
        <Medal className="w-5 h-5 mr-2 text-yellow-400" />
        <span>Badges</span>
      </button>

      {/* Popover: appears when open=true */}
      {open && (
        <div className="absolute right-0 mt-2 w-64 p-3 bg-white shadow-lg rounded max-h-64 overflow-y-auto z-50">
          {/* Grid layout for badge icons */}
          <div className="grid grid-cols-5 gap-2">
            {badges.map(badge => (
              <img
                key={badge.name}
                src={badge.src}
                alt={badge.name}
                title={badge.name}
                className="w-10 h-10 object-contain"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeMenu; 