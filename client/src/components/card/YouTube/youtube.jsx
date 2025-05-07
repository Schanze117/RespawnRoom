// filepath: c:\Bootcamp\Project2\RespawnRoom\client\src\components\card\YouTube.jsx\youtube.jsx
import React from "react";
import YouTube from "react-youtube";

export default function MovieClip({ videoId }) {
  const opts = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      rel: 0,
      origin: window.location.origin,
    },
  };

  return (
    <div className="absolute inset-0">
      <YouTube
        videoId={videoId}
        opts={opts}
        className="w-full h-full"
        iframeClassName="w-full h-full rounded-lg"
        onError={(e) => console.error('YouTube Player Error:', e)}
      />
    </div>
  );
}
