async function fetchSpotifyToken() {
    let token = null;
    const response = await fetch("http://127.0.0.1:5000/auth/token");
    const json = await response.json();
    token = json.token;
    return token;
}
async function playPlaylist(deviceId, token, playlistId) {
    const playlistUri = `spotify:playlist:${playlistId}`;
    await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=true&device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ context_uri: playlistUri }),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
}

let isPaused = true;
let currentTrackId = null;
let playlistStarted = false;
let audioOn =true;
let previousVolume = null;

window.onload = async function() {
    const loader = document.querySelector('.loader');
    const videoPlayer = document.querySelector('.video-player');
    videoPlayer.pause();
    if (loader) {
        setTimeout(function() {
            loader.style.display = 'none';
            document.getElementById('loader-overlay').style.visibility = 'hidden';
            document.getElementById('play-button-overlay').style.visibility = 'visible';
            document.getElementById('play-button').style.display = 'block';
        }, 500);
    }
    let token = await fetchSpotifyToken();
    if(token!==null && token!==undefined) {
        const player = new window.Spotify.Player({
            name: 'Web Playback SDK',
            getOAuthToken: cb => { cb(token); },
            volume: 0.5
        });
        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
        });
        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
        });
        player.connect();
        player.getCurrentState().then(state => {
            if (!state) {
                console.error('User is not playing music through the Web Playback SDK');
                return;
            }
            console.log(state);
            player.state.shuffle = true;
        }); 
        player.addListener('player_state_changed', state => {
            if (!state) {
                return;
            }
            currentTrackId = state.track_window.current_track.id;
            document.getElementById('track-image').src = state.track_window.current_track.album.images[0].url;
            document.getElementById('track-name').textContent = state.track_window.current_track.name;
            document.getElementById('artist-name').textContent = state.track_window.current_track.artists.map(artist => artist.name).join(', ');
            isPaused = state.paused;
        });
        let deviceId = null;
        player.addListener('ready', ({ device_id }) => {
            deviceId = device_id;
        });

        document.getElementById('play-pause-button').addEventListener('click', async function() {
            await playPlaylist(deviceId, token, '3Cj6zGxEKM65y2Dgl7Cztb');
            player.togglePlay();
                if(isPaused===false){
                    document.getElementById('play-pause-button').textContent ='▶';
                    isPaused = true;
                }else{
                    document.getElementById('play-pause-button').textContent ='⏸';
                    isPaused = false;
                }});
        document.getElementById('prev-button').addEventListener('click', function() {
            player.previousTrack();
        });
        document.getElementById('next-button').addEventListener('click', function() {
            player.nextTrack();
        });
        document.getElementById('volume-slider').addEventListener('input', function() {
            const volume = parseFloat(this.value);
            previousVolume = volume;
            player.setVolume(volume);
            if(volume === 0){
                audioOn = false;
                document.getElementById("audio-btn").src = "./static/audio_off.svg";
            }
        });
        document.getElementById("audio-btn").addEventListener('click', function(){
            if(previousVolume===0){
                previousVolume = 0.5;
            }
            if(audioOn){
                player.setVolume(0);
                document.getElementById("volume-slider").value = 0;
                audioOn = false;
                document.getElementById("audio-btn").src = "./static/audio_off.svg";
            }else{
                if(previousVolume===null){
                    previousVolume = 0.5;
                }
                player.setVolume(previousVolume);
                document.getElementById("volume-slider").value = previousVolume;
                audioOn = true;
                document.getElementById("audio-btn").src = "./static/audio.svg";
            }
        });
    } else {
        document.getElementById('spotify-auth-overlay').style.visibility = 'visible';
    }
};

const locations = ['rostok', 'terikon'];
document.getElementById('play-button').addEventListener('click', function() {
    document.getElementById('play-button').style.display = 'none';
    document.getElementById('play-button-overlay').style.visibility = 'hidden';
    const videoPlayer = document.querySelector('.video-player');
    if (videoPlayer) {
        videoPlayer.play();
    }
});

document.getElementById('spotify-auth-button').addEventListener('click',  function() {
    document.getElementById('spotify-auth-overlay').style.visibility = 'hidden';
    document.getElementById('play-button').style.display = 'block';
});