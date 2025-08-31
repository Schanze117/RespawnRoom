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
          className={`flex-1 py-3 text-sm font-medium transition-all duration-200 ${
            searchMode === 'friends' 
              ? 'bg-primary-600 text-white shadow-lg' 
              : 'bg-transparent text-gray-400 hover:bg-surface-700 hover:text-white'
          }`}
          onClick={() => toggleSearchMode('friends')}
        >
          My Friends
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-medium transition-all duration-200 ${
            searchMode === 'findPlayers' 
              ? 'bg-primary-600 text-white shadow-lg' 
              : 'bg-transparent text-gray-400 hover:bg-surface-700 hover:text-white'
          }`}
          onClick={() => toggleSearchMode('findPlayers')}
        >
          Find Players
        </button>
      </div>
      
      {/* Search Box */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder={searchMode === 'friends' ? "Search friends..." : "Find players by username..."}
            className="w-full px-4 py-3 pl-10 rounded-lg bg-surface-800 border border-surface-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all duration-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        {searchMode === 'findPlayers' && (
          <button 
            type="submit" 
            className="px-5 py-3 bg-primary-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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