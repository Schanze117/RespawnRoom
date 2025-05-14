import React from 'react';

const FilterToggle = ({ enabled, setEnabled, label }) => {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-surface-800 rounded-lg">
      <span className="text-light text-sm font-medium">{label}</span>
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${enabled ? 'bg-primary-600' : 'bg-surface-700'}`}
        onClick={() => setEnabled(!enabled)}
        role="switch"
        aria-checked={enabled}
      >
        <span className="sr-only">Toggle {label}</span>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default FilterToggle; 