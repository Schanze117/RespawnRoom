import React from 'react';
import { Mic, MicOff, Video, VideoOff, LogOut, Share2 } from 'lucide-react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const ControlPanel = ({ 
  isMuted, 
  setIsMuted, 
  isVideoOff, 
  setIsVideoOff, 
  localTracks, 
  setLocalTracks, 
  mode, 
  setShowShareModal, 
  cleanup, 
  clientRef 
}) => {
  return (
    <div className="flex-none py-4 px-4 bg-surface-800/60 backdrop-blur-md border-t border-surface-700">
      <div className="control-panel">
        {/* Mute/Unmute Button */}
        <button
          onClick={() => {
            if (localTracks.length > 0) {
              const audioTrack = localTracks.find(track => track.trackMediaType === 'audio');
              if (audioTrack) {
                audioTrack.setEnabled(!isMuted);
                setIsMuted(!isMuted);
              }
            }
          }}
          className={`control-button ${isMuted ? 'bg-red-600/80 hover:bg-red-700' : 'bg-surface-700/80 hover:bg-surface-600'}`}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? (
            <MicOff size={20} className="text-white" />
          ) : (
            <Mic size={20} className="text-white" />
          )}
        </button>
        
        {/* Video Toggle Button - only show in video mode */}
        {mode === 'video' && (
          <button
            onClick={() => {
              if (localTracks.length > 0) {
                const videoTrack = localTracks.find(track => track.trackMediaType === 'video');
                
                if (videoTrack) {
                  videoTrack.setEnabled(!isVideoOff);
                  setIsVideoOff(!isVideoOff);
                } else if (mode === 'video') {
                  // Create and publish a new video track
                  AgoraRTC.createCameraVideoTrack({
                    encoderConfig: {
                      width: { min: 640, ideal: 1280, max: 1920 },
                      height: { min: 360, ideal: 720, max: 1080 },
                      frameRate: 30
                    }
                  }).then(newVideoTrack => {
                    newVideoTrack.setEnabled(true);
                    setIsVideoOff(false);
                    
                    if (clientRef.current) {
                      clientRef.current.publish(newVideoTrack);
                    }
                    
                    setLocalTracks(prev => [...prev, newVideoTrack]);
                  }).catch(error => {
                    console.error('Failed to create video track:', error);
                  });
                }
              }
            }}
            className={`control-button ${isVideoOff ? 'bg-red-600/80 hover:bg-red-700' : 'bg-surface-700/80 hover:bg-surface-600'}`}
            title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
          >
            {isVideoOff ? (
              <VideoOff size={20} className="text-white" />
            ) : (
              <Video size={20} className="text-white" />
            )}
          </button>
        )}
        
        {/* Share Room Button */}
        <button
          onClick={() => setShowShareModal(true)}
          className="control-button bg-primary-600/80 hover:bg-primary-700"
          title="Share Room"
        >
          <Share2 size={20} className="text-white" />
        </button>
        
        {/* Leave Room Button */}
        <button
          onClick={cleanup}
          className="control-button danger"
          title="Leave Room"
        >
          <LogOut size={20} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default ControlPanel; 