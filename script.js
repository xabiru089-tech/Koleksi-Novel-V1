// DOM Elements
const audio = document.getElementById('audio-element');
const playBtn = document.getElementById('btn-play');
const prevBtn = document.getElementById('btn-prev');
const nextBtn = document.getElementById('btn-next');
const progressBg = document.getElementById('progress-bg');
const progressFill = document.getElementById('progress-fill');
const currTimeEl = document.getElementById('curr-time');
const durTimeEl = document.getElementById('dur-time');
const fileInput = document.getElementById('file-input');
const playlistEl = document.getElementById('playlist');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const artWrapper = document.getElementById('art-wrapper');
const volSlider = document.getElementById('vol-slider');

// State Variables
let playlist = [];
let currentTrackIndex = 0;
let isPlaying = false;
let audioContext, analyser, srcNode;

// 1. Digital Clock & Date
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    document.getElementById('clock-time').textContent = `${hours}:${minutes}:${seconds}`;

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('clock-date').textContent = now.toLocaleDateString('id-ID', options).toUpperCase();
}
setInterval(updateClock, 1000);
updateClock();

// 2. Local File Upload Handling
fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        if (file.type.startsWith('audio/')) {
            const songObj = {
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: "File Lokal",
                url: URL.createObjectURL(file)
            };
            playlist.push(songObj);
        }
    });
    renderPlaylist();
    if (playlist.length > 0 && !isPlaying) {
        loadTrack(playlist.length - files.length);
    }
});

// 3. Render Playlist
function renderPlaylist() {
    playlistEl.innerHTML = '';
    playlist.forEach((track, index) => {
        const item = document.createElement('div');
        item.className = `playlist-item ${index === currentTrackIndex ? 'active' : ''}`;
        item.innerHTML = `
            <span><i class="fa-solid fa-music"></i> ${track.title}</span>
            <small>${track.artist}</small>
        `;
        item.addEventListener('click', () => {
            loadTrack(index);
            playAudio();
        });
        playlistEl.appendChild(item);
    });
}

// 4. Load Track
function loadTrack(index) {
    if (playlist.length === 0) return;
    currentTrackIndex = index;
    const track = playlist[currentTrackIndex];
    audio.src = track.url;
    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    renderPlaylist();
}

// 5. Audio Controls
function playAudio() {
    if (playlist.length === 0) return;
    initAudioContext();
    audio.play();
    isPlaying = true;
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    artWrapper.classList.add('playing');
}

function pauseAudio() {
    audio.pause();
    isPlaying = false;
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    artWrapper.classList.remove('playing');
}

playBtn.addEventListener('click', () => {
    if (isPlaying) pauseAudio();
    else playAudio();
});

prevBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
    playAudio();
});

nextBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
    playAudio();
});

// 6. Progress & Duration Updates
audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        const progressPct = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = `${progressPct}%`;
        
        currTimeEl.textContent = formatTime(audio.currentTime);
        durTimeEl.textContent = formatTime(audio.duration);
    }
});

progressBg.addEventListener('click', (e) => {
    const width = progressBg.clientWidth;
    const clickX = e.offsetX;
    if (audio.duration) {
        audio.currentTime = (clickX / width) * audio.duration;
    }
});

audio.addEventListener('ended', () => {
    nextBtn.click();
});

volSlider.addEventListener('input', (e) => {
    audio.volume = e.target.value;
});

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

// 7. Canvas Web Audio Spectrum Visualizer
function initAudioContext() {
    if (audioContext) return;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    srcNode = audioContext.createMediaElementSource(audio);
    srcNode.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 128;
    drawVisualizer();
}

function drawVisualizer() {
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.35;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function renderFrame() {
        requestAnimationFrame(renderFrame);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * canvas.height;

            const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
            gradient.addColorStop(0, 'rgba(230, 57, 70, 0.2)');
            gradient.addColorStop(1, 'rgba(168, 218, 220, 0.8)');

            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

            x += barWidth;
        }
    }
    renderFrame();
}
