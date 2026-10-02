const curtain = document.getElementById('curtain');
let triggered = false;
let transitioning = false;
let completed = false; 

// function lockScroll() {
//     document.body.style.overflow = 'hidden';
// }
// function unlockScroll() {
//     document.body.style.overflow = '';
// }

function updateCurtain() {
    if (transitioning || completed) return;

    const scrolled = window.scrollY;
    const scrollable = document.body.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;

    const progress = scrolled / scrollable;
    const opacity = Math.min(progress * 2, 1);
    curtain.style.opacity = opacity;

    if (progress >= 0.5 && !triggered) {
        triggered = true;
        revealScene();
    }
}

async function revealScene() {
    transitioning = true;
    lockScroll();

   
    curtain.style.opacity = 1;

   
    await wait(800);

    try {
        await loadSettingsScene();
    } catch (err) {
        console.error('Failed to load settings scene:', err);
    }


    await nextFrame();
    await nextFrame();

  
    await wait(1000);
 window.scrollTo(0, 0);
   await nextFrame(); 
   
    curtain.style.transition = 'opacity 1.1s ease';
    curtain.style.opacity = 0;

    await wait(1150); //1.15 secs

    
    unlockScroll();
    window.removeEventListener('scroll', updateCurtain);

    transitioning = false;
    completed = true; 

   
}

async function loadSettingsScene() {
    const res = await fetch('../Pages/settings.html');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const newMain = doc.querySelector('main.scene');
    const oldMain = document.querySelector('main');
    if (!newMain || !oldMain) throw new Error('Missing <main> in settings.html');
    oldMain.replaceWith(newMain);

    const newHeader = doc.querySelector('header');
    const oldHeader = document.querySelector('header');
    if (newHeader && oldHeader) oldHeader.replaceWith(newHeader);

    doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        if (document.querySelector(`link[href="${href}"]`)) return;
        const clone = document.createElement('link');
        clone.rel = 'stylesheet';
        clone.href = href;
        document.head.appendChild(clone);
    });

    const scripts = [...doc.querySelectorAll('script[src]')];
    for (const s of scripts) {
        const src = s.getAttribute('src');
        if (!src) continue;
        if (document.querySelector(`script[src="${src}"]`)) continue;
        await loadScript(src);
    }

    document.dispatchEvent(
        new CustomEvent('scene:loaded', { detail: { name: 'settings' } })
    );
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.defer = true;
        s.onload = resolve;
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
    });
}

function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
}
function nextFrame() {
    return new Promise(r => requestAnimationFrame(() => r()));
}

window.removeEventListener('scroll', updateCurtain);
window.addEventListener('scroll', updateCurtain, { passive: true });