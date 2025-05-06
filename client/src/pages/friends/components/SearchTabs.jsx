import React from 'react';

const SearchTabs = ({ 
  searchMode, 
  toggleSearchMode, 
  searchQuery, 
  setSearchQuery, 
  handleSearch 
}) => {
  return (
    <div className="mb-6">
      {/* Tabs */}
      <div className="flex bg-surface-800 rounded-lg overflow-hidden border border-surface-700 mb-4">
        <button 
          className={`flex-1 py-3 text-sm font-medium transition-colors ${searchMode === 'friends' ? 'bg-primary-600 text-white' : 'bg-transparent text-gray-400 hover:bg-surface-700 hover:text-white'}`}
          onClick={() => toggleSearchMode('friends')}
        >
          My Friends
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-medium transition-colors ${searchMode === 'findPlayers' ? 'bg-primary-600 text-white' : 'bg-transparent text-gray-400 hover:bg-surface-700 hover:text-white'}`}
          onClick={() => toggleSearchMode('findPlayers')}
        >
          Find Players
        </button>
      </div>
      
      {/* Search Box */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <input 
          type="text" 
          placeholder={searchMode === 'friends' ? "Search friends..." : "Find players by username..."}
          className="flex-1 px-4 py-3 rounded-lg bg-surface-800 border border-surface-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchMode === 'findPlayers' && (
          <button 
            type="submit" 
            className="px-5 py-3 bg-primary-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Search
          </button>
        )}
      </form>
    </div>
  );
};

export default SearchTabs; 