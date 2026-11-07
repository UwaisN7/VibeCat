
const visualiserSettings = {
    sensitivity: 60,
    particles: 50,
    frequency: 50,
    colour: '#C68FE8'
};
 
const Settings_Key = 'vibecat-settings';
try {
    const saved = JSON.parse(localStorage.getItem(Settings_Key) || '{}');
    if (saved.sens !== undefined) visualiserSettings.sensitivity = saved.sens;
    if (saved.parts !== undefined) visualiserSettings.particles = saved.parts;
    if (saved.freq !== undefined) visualiserSettings.frequency = saved.freq;
    if (saved.colour !== undefined) visualiserSettings.colour = saved.colour;
} catch (e) {
    console.warn('could not load settings', e);
}
 
const keyMap = { sens: 'sensitivity', parts: 'particles', freq: 'frequency' };
const boundEls = new WeakSet();
 
function bindSettingsUI() {
    if (!document.getElementById('sens')) return;
 
    const root = document.documentElement;
 
    function applySettings() {
        root.style.setProperty('--glow', visualiserSettings.colour);
        Object.keys(keyMap).forEach(key => {
            const jsKey = keyMap[key];
            const el = document.getElementById(key);
            if (el) {
                el.value = visualiserSettings[jsKey];
                el.style.setProperty('--fill', visualiserSettings[jsKey] + '%');
                const out = document.getElementById(key + 'Out');
                if (out) out.textContent = visualiserSettings[jsKey] + '%';
            }
        });
        document.querySelectorAll('.swatch').forEach(b => {
            b.setAttribute('aria-pressed', b.dataset.c === visualiserSettings.colour);
        });
        try {
            localStorage.setItem(Settings_Key, JSON.stringify({
                sens: visualiserSettings.sensitivity,
                parts: visualiserSettings.particles,
                freq: visualiserSettings.frequency,
                colour: visualiserSettings.colour
            }));
        } catch (e) {}
    }
 
    Object.keys(keyMap).forEach(key => {
        const el = document.getElementById(key);
        if (el && !boundEls.has(el)) {
            boundEls.add(el);
            el.addEventListener('input', e => {
                visualiserSettings[keyMap[key]] = parseInt(e.target.value);
                applySettings();
            });
        }
    });
 
    document.querySelectorAll('.swatch').forEach(b => {
        if (boundEls.has(b)) return;
        boundEls.add(b);
        b.addEventListener('click', () => {
            visualiserSettings.colour = b.dataset.c;
            applySettings();
        });
    });
 
    applySettings();
}
 
const vibeAudio = { level: 0 };
 
let audioCtx = null;
let analyser = null;
let dataArray = null;
let sourceEl = null;
let songHooked = false;
 
function setupAudio() {
    if (!window.songStore || !songStore.audio) return;
    try {
        if (!audioCtx) audioCtx = new AudioContext();
 
        if (sourceEl !== songStore.audio) {
            const source = audioCtx.createMediaElementSource(songStore.audio);
            sourceEl = songStore.audio;
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
        }
 
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
    } catch (e) {
        console.warn('audio setup failed', e);
    }
}
 
function hookSongStore() {
    if (songHooked || !window.songStore) return;
    songHooked = true;
    songStore.onChange(song => {
        if (song.type === 'local') setupAudio();
    });
    if (songStore.current && songStore.current.type === 'local') setupAudio();
}
 
function fakeBeat() {
    const t = performance.now() / 1000;
    return 0.3 + 0.7 * Math.pow(Math.abs(Math.sin(t * 3.1)), 3) * 0.5;
}
 
function readLevel(preview) {
    if (preview) return fakeBeat();
 
    if (window.songStore && songStore.current && songStore.current.type === 'youtube') {
        const yt = songStore.current.player;
        if (yt && typeof yt.getPlayerState === 'function' && yt.getPlayerState() === 1) {
            const time = performance.now() / 15;
            return (Math.abs(Math.sin(time)) * 0.3) + (Math.random() * 0.4);
        }
        return 0;
    }
 
    if (analyser && audioCtx && audioCtx.state === 'running' && window.songStore && songStore.audio && !songStore.audio.paused) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        return sum / dataArray.length / 255;
    }
 
    return fakeBeat();
}
 
let active = null;
 
function stopVisualiser() {
    if (!active) return;
    cancelAnimationFrame(active.raf);
    active.ro.disconnect();
    active = null;
}
 
function initVisualiser() {
    const canvas = document.getElementById('visualiserCanvas');
 
    if (active && canvas && active.canvas === canvas && canvas.isConnected) return;
 
    stopVisualiser();
    if (!canvas) return;
 
    hookSongStore();
 
    const ctx = canvas.getContext('2d');
    const preview = !!document.getElementById('sens');
    let W = 0, H = 0;
 
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        W = canvas.clientWidth;
        H = canvas.clientHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
 
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
 
    const state = { canvas, raf: 0, ro };
    active = state;
    resize();
 
    const dots = Array.from({ length: 120 }, () => ({
        x: Math.random(),
        y: Math.random(),
        v: 0.05 + Math.random() * 0.12,
        r: 1 + Math.random() * 2.2
    }));
 
    let last = performance.now();
 
    function frame(now) {
        if (active !== state) return;
 
        if (!canvas.isConnected) {
            stopVisualiser();
            initVisualiser();
            return;
        }
 
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
 
        if (!W || !H) {
            state.raf = requestAnimationFrame(frame);
            return;
        }
 
        vibeAudio.level = readLevel(preview);
        const t = now / 1000;
 
        ctx.clearRect(0, 0, W, H);
 
        const boost = visualiserSettings.sensitivity / 100;
        const amp = (10 + vibeAudio.level * 400 * boost) * (H / 500);
        const energy = Math.min(1, vibeAudio.level * 1.8 * boost);
        const k = 0.003 + (visualiserSettings.frequency / 100) * 0.012;
 
        ctx.shadowBlur = 0;
        ctx.strokeStyle = visualiserSettings.colour;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
 
        for (let i = 0; i < 3; i++) {
            const baseY = H * (0.05 + i * 0.2);
            const kk = k + i * 0.004;
            ctx.beginPath();
            for (let x = 0; x <= W; x += 8) {
                const y = baseY + Math.sin(x * kk + t) * amp;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
 
        ctx.shadowColor = visualiserSettings.colour;
        ctx.shadowBlur = 8;
        ctx.fillStyle = visualiserSettings.colour;
        const n = Math.min(dots.length, Math.round(visualiserSettings.particles * 1.2));
 
        for (let i = 0; i < n; i++) {
            const p = dots[i];
 
            p.y -= p.v * dt * (1 + energy * 3);
 
            if (p.y < 0) {
                p.y = 1;
                p.x = Math.random();
            }
 
            ctx.globalAlpha = 0.25 + 0.55 * p.y;
            ctx.beginPath();
            ctx.arc(p.x * W + Math.sin(t + i) * 10, p.y * H, p.r * (1 + energy), 0, 6.283);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
 
        state.raf = requestAnimationFrame(frame);
    }
 
    state.raf = requestAnimationFrame(frame);
}
 
function onSceneLoaded() {
    bindSettingsUI();
    initVisualiser();
}
 
document.addEventListener('scene:loaded', onSceneLoaded);
bindSettingsUI();
initVisualiser();
window.initVisualiser = initVisualiser;