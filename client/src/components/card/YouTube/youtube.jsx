// filepath: c:\Bootcamp\Project2\RespawnRoom\client\src\components\card\YouTube.jsx\youtube.jsx
import React from "react";
import YouTube from "react-youtube";

class MovieClip extends React.Component {
    render() {
        const { videoId } = this.props; // Accept videoId as a prop
        const options = {
            height: '100%',
            width: '100%',
            playerVars: {
                autoplay: 1,
                controls: 1,
            },
        };

        return <YouTube videoId={videoId} opts={options} onReady={this._onReady} style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }} />;
    }

    _onReady(event) {
        event.target.pauseVideo();
    }
}

export default MovieClip;