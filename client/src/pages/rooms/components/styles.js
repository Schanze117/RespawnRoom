// Extracted CSS styles for room components
export const videoContainerStyles = `
  .video-container {
    min-height: 180px;
    border: 2px solid transparent;
    transition: all 0.3s ease;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    border-radius: 12px;
    position: relative;
  }

  .video-container:hover {
    border-color: rgba(var(--color-primary-500), 0.7);
    transform: scale(1.01);
    z-index: 5;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  }

  .user-label {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .media-indicator {
    position: absolute;
    bottom: 10px;
    display: flex;
    gap: 8px;
    background: rgba(0, 0, 0, 0.6);
    padding: 4px 12px;
    border-radius: 20px;
    z-index: 10;
  }

  .media-indicator-left {
    left: 10px;
  }

  .media-indicator-right {
    right: 10px;
  }

  .avatar-placeholder {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2a2a3a 0%, #141420 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: bold;
    color: white;
    text-transform: uppercase;
  }

  /* Control panel styling */
  .control-panel {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(30, 30, 40, 0.7);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    margin: 0 auto;
    width: fit-content;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
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
    transform: scale(1.1);
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

  @media (max-width: 640px) {
    .video-container {
      min-height: 150px;
    }
    
    .avatar-placeholder {
      width: 60px;
      height: 60px;
      font-size: 24px;
    }
    
    .control-button {
      width: 45px;
      height: 45px;
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