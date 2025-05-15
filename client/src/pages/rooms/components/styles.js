// Extracted CSS styles for room components
export const audioContainerStyles = `
  .audio-container {
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    background-color: rgba(var(--color-surface-800), 0.9);
    border: 1px solid rgba(var(--color-surface-700), 0.6);
  }

  .audio-container:hover {
    border-color: rgba(var(--color-primary-500), 0.4);
    background-color: rgba(var(--color-surface-700), 0.9);
  }

  .participant-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 500;
    margin-right: 0.75rem;
  }

  .local-participant-avatar {
    background-color: rgba(var(--color-green-500), 0.2);
    border: 1px solid rgba(var(--color-green-500), 0.3);
  }

  .remote-participant-avatar {
    background-color: rgba(var(--color-blue-500), 0.2);
    border: 1px solid rgba(var(--color-blue-500), 0.3);
  }

  .mic-status {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mic-on {
    background-color: rgba(var(--color-green-500), 0.2);
  }

  .mic-off {
    background-color: rgba(var(--color-red-500), 0.2);
  }

  /* Control panel styling */
  .control-panel {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(30, 30, 40, 0.7);
    backdrop-filter: blur(10px);
    border-radius: 1rem;
    margin: 0 auto;
    width: fit-content;
  }

  .control-button {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .control-button:hover {
    transform: scale(1.05);
  }

  .control-button.danger {
    background: #e74c3c;
  }

  .control-button.danger:hover {
    background: #c0392b;
  }

  .control-button.success {
    background: #2ecc71;
  }

  .control-button.success:hover {
    background: #27ae60;
  }
  
  /* Glassmorphism for modals */
  .glass-modal {
    background: rgba(30, 30, 40, 0.85);
    backdrop-filter: blur(12px);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  /* Animation for joining/connecting */
  @keyframes pulse {
    0% { opacity: 0.6; transform: scale(0.98); }
    50% { opacity: 1; transform: scale(1.02); }
    100% { opacity: 0.6; transform: scale(0.98); }
  }
  
  .pulse-animation {
    animation: pulse 1.5s infinite ease-in-out;
  }

  .participants-header {
    display: flex;
    align-items: center;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(var(--color-surface-700), 0.6);
    margin-bottom: 0.75rem;
  }

  .participant-count {
    margin-left: auto;
    display: flex;
    align-items: center;
  }

  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 0.5rem;
  }

  .status-live {
    background-color: rgba(var(--color-green-500), 1);
  }

  @media (max-width: 640px) {
    .control-button {
      width: 45px;
      height: 45px;
    }
    
    .participant-avatar {
      width: 36px;
      height: 36px;
      font-size: 0.875rem;
    }
    
    .mic-status {
      width: 28px;
      height: 28px;
    }
  }
`;

// Helper function to determine grid layout based on participant count
export const getGridLayout = (count) => {
  // Discord-style layouts for different participant counts
  switch (count) {
    case 1:
      return { 
        columns: '1fr', 
        rows: '1fr',
        areas: '"a"' 
      };
    case 2:
      return { 
        columns: '1fr 1fr', 
        rows: '1fr',
        areas: '"a b"' 
      };
    case 3:
      return { 
        columns: '1fr 1fr', 
        rows: '1fr 1fr',
        areas: '"a a" "b c"' 
      };
    case 4:
      return { 
        columns: 'repeat(2, 1fr)', 
        rows: 'repeat(2, 1fr)',
        areas: '"a b" "c d"' 
      };
    case 5:
      return { 
        columns: 'repeat(2, 1fr) 1fr', 
        rows: 'repeat(2, 1fr)',
        areas: '"a b c" "d e c"' 
      };
    default:
      // For more than 5 participants (shouldn't happen), use a responsive grid
      return { 
        columns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        rows: 'auto',
        areas: null
      };
  }
};

// Maximum participants allowed in a room
export const MAX_PARTICIPANTS = 5; 