// grass.js - gently swaying GSAP grass that follows the colour swatches
// Needs GSAP loaded first:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
// <script src="grass.js"></script>   (put both just before </body>)
 
(function () {
    function initGrass() {
    const ground = document.querySelector('.ground');
    if (!ground || ground.querySelector('.grass')) return;

    const BLADES = 500;                 // more = fuller ground
    const START_COLOUR = '#C68FE8';     // lilac, matches the first swatch
 
    // make sure the blades can be positioned inside the ground
    if (getComputedStyle(ground).position === 'static') ground.style.position = 'relative';
 
    // container that holds the blades
    const grass = document.createElement('div');
    grass.className = 'grass';
    grass.setAttribute('aria-hidden', 'true');
    grass.style.setProperty('--grass', START_COLOUR);
    
    ground.appendChild(grass);
 
    // scatter blades inside the ellipse, then sort so the front ones draw last
    const spots = [];
    for (let i = 0; i < BLADES; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.sqrt(Math.random()) * 0.92;      // sqrt = even spread
        spots.push({
            x: 50 + Math.cos(angle) * dist * 50,           // % across the ellipse
            y: 50 + Math.sin(angle) * dist * 50,           // % down the ellipse
        });
    }
    spots.sort((a, b) => a.y - b.y);
 
    spots.forEach(({ x, y }) => {
        const depth = y / 100;                              // 0 = back, 1 = front
        const h = 10 + depth * 10 + Math.random() * 6;      // front blades are taller
        const blade = document.createElement('span');
        Object.assign(blade.style, {
            position: 'absolute',
            left: x + '%',
            top: y + '%',
            width: '5px',
            height: h + 'px',
            marginLeft: '-2.5px',
            marginTop: -h + 'px',                           // base sits on the spot
            transformOrigin: '50% 100%',                    // sway from the root
            background: 'color-mix(in srgb, var(--grass) ' + (55 + depth * 35) + '%, #1A1420)',
            clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',  // pointy blade
        });
        grass.appendChild(blade);
 
        // gentle, out-of-sync sway
        gsap.set(blade, { rotation: gsap.utils.random(-6, 6) });
        gsap.to(blade, {
            rotation: gsap.utils.random(8, 16) * (Math.random() < 0.5 ? -1 : 1),
            duration: gsap.utils.random(2.2, 4),
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: Math.random() * 2,
        });
    });
 
    // colour switch: tween the CSS variable so every blade fades together
    function setGrassColour(colour) {
        gsap.to(grass, { '--grass': colour, duration: 0.6, ease: 'power1.out' });
    }
 
    document.querySelectorAll('.swatch').forEach((btn) => {
        btn.addEventListener('click', () => setGrassColour(btn.dataset.c));
    });
 
    window.setGrassColour = setGrassColour;
    }

    // works standalone (settings page opened directly) AND when loaded via the curtain
    if (document.querySelector('.ground')) initGrass();
    document.addEventListener('scene:loaded', initGrass);

})();