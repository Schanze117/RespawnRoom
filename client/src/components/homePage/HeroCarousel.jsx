import React from 'react';

export default function HeroCarousel() {
  return (
    <section className="w-full mb-12">
      <h2 className="text-2xl font-bold text-primary-500 mb-4">Featured Games</h2>
      <div className="relative overflow-hidden rounded-lg h-80 bg-surface-800 border border-surface-600">
        {/* Carousel content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-5xl px-4">
            <div className="relative overflow-hidden rounded-lg">
              <div className="flex flex-col md:flex-row h-full">
                <div className="md:w-1/2 p-6 flex flex-col justify-center">
                  <h3 className="text-3xl font-bold text-light mb-2">Elden Ring</h3>
                  <p className="text-tonal-400 mb-4">
                    Explore a vast open world filled with danger and discovery in this award-winning action RPG.
                  </p>
                  <button className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 w-fit">
                    View Details
                  </button>
                </div>
                <div className="md:w-1/2 bg-surface-700 rounded-lg overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-surface-800 to-surface-700 flex items-center justify-center">
                    <div className="text-6xl text-primary-400 opacity-30">Game Image</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Carousel controls */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              <button className="w-3 h-3 rounded-full bg-primary-500"></button>
              <button className="w-3 h-3 rounded-full bg-surface-600 hover:bg-primary-400 transition-colors"></button>
              <button className="w-3 h-3 rounded-full bg-surface-600 hover:bg-primary-400 transition-colors"></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 