const curtain = document.getElementById('curtain');
let PAGE = 'unknown';
let triggered = false;
let transitioning = false;

function wait(ms)    { return new Promise(r => setTimeout(r, ms)); }
function nextFrame() { return new Promise(r => requestAnimationFrame(() => r())); }


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

window.scrollTo(0, 0);
await nextFrame();

enterScene(detectPage());
gsap.ticker.tick();
await nextFrame();
await nextFrame();
await fadeFromBlack(1100);
thawScroll();
    },
};

const SettingsScene = {
    house: null,
    proxy: { t: 0 },
    doorHit: false,
    doorOpen: 0,
    vScroll: 0,
    maxScroll: 1400,
init() {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = 'auto';

    this.house = document.querySelector('.house');
    this.world = document.querySelector('.world');
    this.proxy.t = 0;
    this.doorHit = false;
    this.doorOpen = 0;
    this.vScroll = 0;

    if (!this.house || !this.world) {
        console.warn('[loadScreen] settings: missing .house or .world');
        return;
    }

    gsap.set(this.world, { clearProps: 'transform' });

    const door = document.querySelector('.house-door');
    if (!door) {
        console.warn('[loadScreen] settings: no .house-door');
        return;
    }

    if (!document.querySelector('.house-doorway')) {
        const dw = document.createElement('div');
        dw.className = 'house-doorway';
        door.before(dw);
    }
    this.doorway = document.querySelector('.house-doorway');

    const pr = door.offsetParent.getBoundingClientRect();
    const d0 = door.getBoundingClientRect();
    Object.assign(this.doorway.style, {
        left:   (d0.left - pr.left) + 'px',
        top:    (d0.top  - pr.top)  + 'px',
        width:  d0.width  + 'px',
        height: d0.height + 'px',
    });

    const wr = this.world.getBoundingClientRect();
    const dr = door.getBoundingClientRect();
    const doorX = dr.left + dr.width / 2;
    const doorY = dr.top  + dr.height / 2;

    this.world.style.transformOrigin = `${doorX - wr.left}px ${doorY - wr.top}px`;
    this.camDX = window.innerWidth  / 2 - doorX;
    this.camDY = window.innerHeight / 2 - doorY;
    this.zoomEnd = Math.max(window.innerWidth / dr.width, window.innerHeight / dr.height) * 1.1;

    this._onWheel = (e) => this.onWheel(e);
    this._onTouchStart = (e) => this.onTouchStart(e);
    this._onTouchMove = (e) => this.onTouchMove(e);
    window.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('touchstart', this._onTouchStart, { passive: true });
    window.addEventListener('touchmove', this._onTouchMove, { passive: false });
},


onWheel(e) {
    if (transitioning || this.doorHit) return;
    e.preventDefault();
    this.vScroll = Math.max(0, Math.min(this.maxScroll, this.vScroll + e.deltaY));
    this.applyFromVScroll();
},

onTouchStart(e) {
    if (transitioning || this.doorHit) return;
    this._touchY = e.touches[0].clientY;
},

onTouchMove(e) {
    if (transitioning || this.doorHit) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    const dy = this._touchY - y;
    this._touchY = y;
    this.vScroll = Math.max(0, Math.min(this.maxScroll, this.vScroll + dy * 1.5));
    this.applyFromVScroll();
},

teardown() {
    window.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('touchstart', this._onTouchStart);
    window.removeEventListener('touchmove', this._onTouchMove);
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
},
    applyFromVScroll() {
        const progress = this.vScroll / this.maxScroll;
        const zoomT = Math.min(progress / 0.85, 1);
        gsap.to(this.proxy, {
            t: zoomT,
            duration: 0.4,
            ease: 'power2.out',
            overwrite: true,
            onUpdate: () => this.applyZoom(),
        });
        const doorT = Math.max(0, Math.min(1, (progress - 0.35) / 0.5));
        if (Math.abs(doorT - this.doorOpen) > 0.001) {
            this.doorOpen = doorT;
            this.applyDoor(doorT);
        }
        if (progress >= 0.85 && !this.doorHit) {
            this.doorHit = true;
            this.openDoorAndReveal();
        }
    },
applyDoor(t) {
    const door = document.querySelector('.house-door');
    if (!door || !window.gsap) return;
    gsap.set(door, {
        transformPerspective: 800,
        transformOrigin: '0% 50%',
        rotateY: -100 * t,
    });
    if (this.doorway) {
        this.doorway.style.boxShadow =
            `inset 0 0 10px rgba(0,0,0,.45), 0 0 ${t * 40}px ${t * 14}px rgba(198,143,232,${t * 0.9})`;
    }

},
applyZoom() {
    const t = this.proxy.t;
    gsap.set(this.world, {
        scale: Math.pow(this.zoomEnd, t),
        x: this.camDX * t,
        y: this.camDY * t,
    });

},


    
    async openDoorAndReveal() {
        this.teardown();
        transitioning = true;
        freezeScroll();

        const door = document.querySelector('.house-door');
        const house = this.house;

       
        await fadeToBlack(600);

        try {
            await swapSceneInto('Pages/visualiser.html');
        } catch (err) {
            console.error('Failed to load visualiser scene:', err);
        }

    
enterScene(detectPage());
gsap.ticker.tick();
await nextFrame();
await nextFrame();
await fadeFromBlack(1100);
thawScroll();
    }
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
      SCENES[PAGE]?.teardown?.();
    PAGE = name;
    triggered = false;
    transitioning = false;

    const scene = SCENES[name];
    if (!scene) {
        console.warn('[loadScreen] unknown page:', name);
        return;
    }
    scene.init?.();
    document.dispatchEvent(new CustomEvent('scene:loaded', { detail: { page: name } }));   //Grass loader
    window.addEventListener('scroll', scrollHandler, { passive: true }); 
}

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => enterScene(detectPage()), { once: true });
} else {
    enterScene(detectPage());
}