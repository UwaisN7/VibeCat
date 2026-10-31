const visualiserSettings = {
    sensitivity: 60,
    particles: 50,
    frequency: 50,
    colour : '#C68FE8'
};
const vibeAudio = { level: 0 };

let _visualiserStarted = false;
let _visualiserRaf = null;

function initVisualiser() {
    if (_visualiserStarted) return;
    const canvas = document.getElementById('visualiserCanvas');
    if (!canvas) return;                // canvas not in DOM yet — caller will retry

    _visualiserStarted = true;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        W = canvas.clientWidth;
        H = canvas.clientHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    window.addEventListener('resize', resize);
    resize();

    function frame() {
        vibeAudio.level = readLevel();
        const t = performance.now() / 1000;
console.log(audioCtx?.state, vibeAudio.level);
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = visualiserSettings.colour;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        const boost = visualiserSettings.sensitivity / 100;
        const amp = (10 + vibeAudio.level * 400 * boost) * (H / 500);

        for (let i = 0; i < 3; i++) {
            const baseY = H * (0.05 + i * 0.2);
            const k = 0.01 + i * 0.004;
            ctx.beginPath();
            for (let x = 0; x <= W; x += 8) {
                const y = baseY + Math.sin(x * k + t) * amp;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        _visualiserRaf = requestAnimationFrame(frame);
    }
    _visualiserRaf = requestAnimationFrame(frame);

    let audioCtx, analyser, dataArray;
function setupAudio() {
    if (audioCtx) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return;
    }
    if (!window.songStore || !songStore.audio) return;
    audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(songStore.audio);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
        const resume = () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            window.removeEventListener('pointerdown', resume);
            window.removeEventListener('keydown', resume);
        };
        window.addEventListener('pointerdown', resume, { once: true });
        window.addEventListener('keydown', resume, { once: true });
    }
}

if (window.songStore) {
    songStore.onChange(song => {
        if (song.type === 'local') setupAudio();
    });
}

if (window.songStore && songStore.current && songStore.current.type === 'local') {
    setupAudio();
}

   function readLevel() {

    if (window.songStore&& songStore.current && songStore.current.type === 'youtube'){
        const yt = songStore.current.player;
        if (yt && typeof yt.getPlayerState === 'function' && yt.getPlayerState() === 1) {
            const time = performance.now() / 15;
            const fakeLevel = (Math.abs(Math.sin(time)) * 0.3) + (Math.random() * 0.4);
            return fakeLevel; 
        }
        return 0;
    }
    if (!analyser || !audioCtx || audioCtx.state !== 'running') return 0;
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
    return sum / dataArray.length / 255;
}
   
} 
if (document.getElementById('visualiserCanvas')) initVisualiser();
document.addEventListener('scene:loaded', initVisualiser);
window.initVisualiser = initVisualiser;

