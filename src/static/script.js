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
let video = document.getElementById("video-player");

window.onload = async function() {
    const loader = document.querySelector('.loader');
    const videoPlayer = document.querySelector('.video-player');
    video.volume = 0.5;
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
            const durationInput = document.getElementById('track-duration');
            durationInput.max = state.duration;
            durationInput.value = state.position;
        });
        let deviceId = null;
        player.addListener('ready', ({ device_id }) => {
            deviceId = device_id;
        });

        document.getElementById('play-pause-button').addEventListener('click', async function() {
            player.togglePlay();
            if(isPaused===false && playlistStarted===true){
                document.getElementById('play-img').src ='./static/play.svg';
                isPaused = true;
            }else if(isPaused===true && playlistStarted===true){
                document.getElementById('play-img').src ='./static/pause.svg';
                isPaused = false;
            }
            if (!playlistStarted) {
                await playPlaylist(deviceId, token, '3Cj6zGxEKM65y2Dgl7Cztb');
                player.nextTrack();
                playlistStarted = true;
                isPaused = false;
                document.getElementById('play-img').src ='./static/pause.svg';
            }
        });
        document.getElementById('prev-button').addEventListener('click', function() {
            player.previousTrack();
        });
        document.getElementById('next-button').addEventListener('click', function() {
            player.nextTrack();
        });
        document.querySelector('.volume-input').addEventListener('input', function(event) {
            const volume = parseFloat(event.target.value);
            previousVolume = volume;
            player.setVolume(volume);
            video.volume = volume *0.4;
            if(volume === 0){
                video.volume = 0.5;
                audioOn = false;
                document.getElementById("audio-btn").src = "./static/audio_off.svg";
            }else if(volume > 0){
                audioOn = true;
                document.getElementById("audio-btn").src = "./static/audio.svg";
                document.querySelector('.volume-input').value = volume;
            }
        });
        document.getElementById("audio-btn").addEventListener('click', function(){
            if(previousVolume===0 ){
                previousVolume = 0.5;
            }
            if(audioOn){
                player.setVolume(0);
                document.querySelector('.volume-input').value = 0;
                audioOn = false;
                document.getElementById("audio-btn").src = "./static/audio_off.svg";
            }else{
                if(previousVolume===null || previousVolume === 0){
                    previousVolume = 0.5;
                }
                player.setVolume(previousVolume);
                document.querySelector('.volume-input').value = previousVolume;
                audioOn = true;
                document.getElementById("audio-btn").src = "./static/audio.svg";
            }
        });
        const durationInput = document.getElementById('track-duration');
        let isSeeking = false;

        durationInput.addEventListener('input', function (e) {
            isSeeking = true;
        });

        durationInput.addEventListener('change', function (e) {
            const seekPosition = parseInt(e.target.value, 10);
            player.seek(seekPosition);
            isSeeking = false;
        });
        setInterval(() => {
            if (!isSeeking && player && typeof player.getCurrentState === 'function') {
                player.getCurrentState().then(state => {
                    if (state) {
                        durationInput.value = state.position;
                    }
                    if(state && state.position === state.duration){
                        durationInput.value = 0;
                        player.nextTrack();
                    }
                });
            }}, 1000); 
    } else {
        document.getElementById('spotify-auth-overlay').style.visibility = 'visible';
    }
};

document.getElementById('rostok_btn').addEventListener('click', function() {
    const videoPlayer = document.querySelector('.video-player');
    if (videoPlayer) {
        if(videoPlayer.src.endsWith('rostok.mp4')){
            return;
        }else{
           videoPlayer.src = './static/videos/rostok.mp4';
            videoPlayer.play(); 
        }
    }
});
document.getElementById('slag_heap_btn').addEventListener('click', function() {
    const videoPlayer = document.querySelector('.video-player');
    if (videoPlayer) {
        if(videoPlayer.src.endsWith('slag_heap.mp4')){
            return;
        }else{
           videoPlayer.src = './static/videos/slag_heap.mp4';
            videoPlayer.play() 
        };
    }
});
document.getElementById('yaniv_btn').addEventListener('click', function() {
    const videoPlayer = document.querySelector('.video-player');
    if (videoPlayer) {
        if(videoPlayer.src.endsWith('yaniv.mp4')){
            return;
        }else{
           videoPlayer.src = './static/videos/yaniv.mp4';
            videoPlayer.play(); 
        };
    }
});
document.getElementById('stc_malachite_btn').addEventListener('click', function() {
    const videoPlayer = document.querySelector('.video-player');
    if (videoPlayer) {
        if(videoPlayer.src.endsWith('stc_malachite.mp4')){
            return;
        }else{
           videoPlayer.src = './static/videos/stc_malachite.mp4';
            videoPlayer.play(); 
        };
    }
});
document.getElementById('kazkoviy_camp_btn').addEventListener('click', function() {
    const videoPlayer = document.querySelector('.video-player');
    if (videoPlayer) {
        if(videoPlayer.src.endsWith('kazkoviy_camp.mp4')){
            return;
        }else{
           videoPlayer.src = './static/videos/kazkoviy_camp.mp4';
            videoPlayer.play(); 
        };
    }
});
document.getElementById('sultansk_btn').addEventListener('click', function() {
    const videoPlayer = document.querySelector('.video-player');
    if (videoPlayer) {
        if(videoPlayer.src.endsWith('sultansk.mp4')){
            return;
        }else{
            videoPlayer.src = './static/videos/sultansk.mp4';
            videoPlayer.play();
        };
    }
});
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

