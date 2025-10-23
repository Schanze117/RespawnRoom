// filepath: c:\Bootcamp\Project2\RespawnRoom\client\src\components\card\YouTube.jsx\youtube.jsx
import React, { useRef, useState } from "react";
import YouTube from "react-youtube";

export default function MovieClip({ videoId }) {
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const opts = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      rel: 0,
      origin: window.location.origin,
      playsinline: 1,
      enablejsapi: 1,
    },
  };

  const onReady = (event) => {
    playerRef.current = event.target;
  };

  const onPlay = () => {
    setIsPlaying(true);
  };

  const onPause = () => {
    setIsPlaying(false);
  };

  const handleOverlayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  return (
    <div className="absolute inset-0">
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={onReady}
        onPlay={onPlay}
        onPause={onPause}
        className="w-full h-full"
        iframeClassName="w-full h-full rounded-lg"
      />

      {/* Invisible overlay for mobile play/pause */}
      <div
        onClick={handleOverlayClick}
        onTouchEnd={handleOverlayClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'transparent',
          cursor: 'pointer',
          zIndex: 10
        }}
      />
    </div>
  );
}
