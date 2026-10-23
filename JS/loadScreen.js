const curtain = document.getElementById('curtain');
let PAGE = 'unknown';
let triggered = false;
let transitioning = false;

function wait(ms)    { return new Promise(r => setTimeout(r, ms)); }
function nextFrame() { return new Promise(r => requestAnimationFrame(() => r())); }

// own names so songStore.js's lockScroll/unlockScroll can't override these
function freezeScroll() { document.body.style.overflow = 'hidden'; }
function thawScroll() {
    document.body.classList.remove('scroll-locked');
    document.body.style.overflow = '';
}

function detectPage() {
    const main = document.querySelector('main');
    if (!main) return 'unknown';
    if (main.classList.contains('scene')) return 'settings';
    if (document.body.classList.contains('page-visualiser')) return 'visualiser';
    if (main.querySelector('.player-section')) return 'index';
    return 'unknown';
}

function getScrollProgress() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return Math.max(0, Math.min(1, window.scrollY / scrollable));
}

async function fadeToBlack(ms = 600) {
    curtain.style.transition = `opacity ${ms}ms ease`;
    curtain.style.opacity = '1';
    await wait(ms + 50);
    curtain.style.transition = '';
}

async function fadeFromBlack(ms = 1100) {
    curtain.style.transition = `opacity ${ms}ms ease`;
    curtain.style.opacity = '0';
    await wait(ms + 50);
    curtain.style.transition = '';
}

function loadScript(url) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = url;
        s.async = false;
        s.onload = resolve;
        s.onerror = () => reject(new Error(`Failed to load ${url}`));
        document.head.appendChild(s);
    });
}

function loadStyle(url) {
    return new Promise(resolve => {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = url;
        l.onload = l.onerror = resolve;
        document.head.appendChild(l);
    });
}

// Pages/x.html uses "../style.css"; resolve against the fetched page so paths match index.html's
async function swapSceneInto(pagePath) {
    const pageUrl = new URL(pagePath, location.href);
    const res = await fetch(pageUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${pagePath}`);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');

    for (const link of doc.querySelectorAll('link[rel="stylesheet"]')) {
        const url = new URL(link.getAttribute('href'), pageUrl).href;
        if ([...document.querySelectorAll('link[rel="stylesheet"]')].some(l => l.href === url)) continue;
        await loadStyle(url);
    }

    const newMain = doc.querySelector('main');
    const oldMain = document.querySelector('main');
    if (!newMain || !oldMain) throw new Error(`Missing <main> in ${pagePath}`);
    oldMain.replaceWith(newMain);

    const newHeader = doc.querySelector('header');
    const oldHeader = document.querySelector('header');
    if (newHeader && oldHeader) oldHeader.replaceWith(newHeader);

    document.body.classList.add(...doc.body.classList);

    for (const s of doc.querySelectorAll('script[src]')) {
        const url = new URL(s.getAttribute('src'), pageUrl).href;
        if ([...document.scripts].some(x => x.src === url)) continue;
        await loadScript(url);
    }
}

const IndexScene = {
    onScroll() {
        if (transitioning) return;
        const progress = getScrollProgress();
        if (progress === 0) return;

        curtain.style.transition = '';
        curtain.style.opacity = Math.min(progress * 2, 1);

        if (progress >= 0.5 && !triggered) {
            triggered = true;
            this.reveal();
        }
    },

    async reveal() {
        transitioning = true;
        freezeScroll();
        curtain.style.opacity = 1;
        await wait(800);

        try {
            await swapSceneInto('Pages/settings.html');
        } catch (err) {
            console.error('Failed to load settings scene:', err);
        }

        await nextFrame();
        await nextFrame();
        await wait(1000);
        window.scrollTo(0, 0);
        await nextFrame();

        await fadeFromBlack(1100);
        thawScroll();
        enterScene(detectPage());
    },
};

const SettingsScene = {
    house: null,
    proxy: { t: 0 },
    doorHit: false,

    init() {
        this.house = document.querySelector('.house');
        this.proxy.t = 0;
        this.doorHit = false;
        if (!this.house) {
            console.warn('[loadScreen] settings: no .house found');
            return;
        }
        this.house.style.transformOrigin = '50% 85%';
        document.documentElement.style.scrollBehavior = 'auto';
    },

    applyZoom() {
        const t = this.proxy.t;
        gsap.set(this.house, { scale: 1 + t * 8, y: -t * 40 });
        const door = document.querySelector('.house-door');
        if (door) {
            door.style.boxShadow =
                `0 0 ${t * 40}px ${t * 14}px rgba(198,143,232,${t * 0.9})`;
        }
    },

    onScroll() {
        if (transitioning || this.doorHit || !this.house || !window.gsap) return;

        const progress = getScrollProgress();
        gsap.to(this.proxy, {
            t: Math.min(progress / 0.85, 1),
            duration: 0.6,
            ease: 'power2.out',
            overwrite: true,
            onUpdate: () => this.applyZoom(),
        });

        if (progress >= 0.85) {
            this.doorHit = true;
            this.openDoorAndReveal();
        }
    },

    async openDoorAndReveal() {
        transitioning = true;
        freezeScroll();

        const door = document.querySelector('.house-door');
        const house = this.house;

        if (window.gsap && door && house) {
            gsap.killTweensOf(this.proxy);
            await new Promise(resolve => {
                const tl = gsap.timeline({ onComplete: resolve });
                tl.to(house, { scale: 14, duration: 1.1, ease: 'power3.in' }, 0);
                tl.to(door, {
                    transformOrigin: '50% 100%',
                    scaleY: 1.15,
                    y: '-=8',
                    duration: 0.7,
                    ease: 'power2.out',
                }, 0.05);
            });
        } else {
            await wait(900);
        }

        await fadeToBlack(600);

        try {
            await swapSceneInto('Pages/visualiser.html');
        } catch (err) {
            console.error('Failed to load visualiser scene:', err);
        }

        window.scrollTo(0, 0);
        await nextFrame();
        await nextFrame();

        await fadeFromBlack(1100);
        thawScroll();
        enterScene(detectPage());
    },
};

const VisualiserScene = {};

const SCENES = {
    index: IndexScene,
    settings: SettingsScene,
    visualiser: VisualiserScene,
};

function scrollHandler() {
    SCENES[PAGE]?.onScroll?.();
}

function enterScene(name) {
    window.removeEventListener('scroll', scrollHandler);
    PAGE = name;
    triggered = false;
    transitioning = false;

    const scene = SCENES[name];
    if (!scene) {
        console.warn('[loadScreen] unknown page:', name);
        return;
    }
    scene.init?.();
    window.addEventListener('scroll', scrollHandler, { passive: true });
}

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => enterScene(detectPage()), { once: true });
} else {
    enterScene(detectPage());
}