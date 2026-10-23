const visualiserSettings = {
    sensitivity: 60,
    particles: 50,
    frequency: 50,
    colour : '#C68FE8'
}
const vibeAudio = { level: 0 };
const canvas = document.getElementById('visualiserCanvas')
const ctx = canvas.getContext ('2d')
console.log('canvas found?', document.getElementById('visualiserCanvas'));
function resize(){
  const dpr = window.devicePixelRatio || 1;
  W = canvas.clientWidth;
  H = canvas.clientHeight;
  canvas.width = W* dpr;
  canvas.height = H* dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
}

window.addEventListener('resize',resize)
resize();

function frame() {
  vibeAudio.level = readLevel();
console.log(vibeAudio.level.toFixed(2));
  ctx.fillStyle = 'red';
ctx.fillRect(0, 0, W, H);
    const t = performance.now() / 1000;

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

    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

let audioCtx, analyser, dataArray;

function setupAudio() {
    if (audioCtx) { audioCtx.resume(); return; }  

    audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(songStore.audio);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);  

    source.connect(analyser);
    analyser.connect(audioCtx.destination);
}


songStore.onChange(song => {
    if (song.type === 'local') setupAudio();
});

function readLevel() {
    if (!analyser) return 0;                
    analyser.getByteFrequencyData(dataArray); 
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
    return sum / dataArray.length / 255; }