(function () {
    function initGrass() {
    const ground = document.querySelector('.ground');
    if (!ground || ground.querySelector('.grass')) return;

    const BLADES = 650;                
    const START_COLOUR = '#C68FE8';     
 
    
    if (getComputedStyle(ground).position === 'static') ground.style.position = 'relative';
 
   
    const grass = document.createElement('div');
    grass.className = 'grass';
    grass.setAttribute('aria-hidden', 'true');
    grass.style.setProperty('--grass', START_COLOUR);
    
    ground.appendChild(grass);
 
  
    const spots = [];
    for (let i = 0; i < BLADES; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.sqrt(Math.random()) * 0.92;      
        spots.push({
            x: 50 + Math.cos(angle) * dist * 50,           
            y: 50 + Math.sin(angle) * dist * 50,          
        });
    }
    spots.sort((a, b) => a.y - b.y);
 
    spots.forEach(({ x, y }) => {
        const depth = y / 100;                             
        const h = 10 + depth * 10 + Math.random() * 6;      
        const blade = document.createElement('span');
        Object.assign(blade.style, {
            position: 'absolute',
            left: x + '%',
            top: y + '%',
            width: '5px',
            height: h + 'px',
            marginLeft: '-2.5px',
            marginTop: -h + 'px',                          
            transformOrigin: '50% 100%',                  
            background: 'color-mix(in srgb, var(--grass) ' + (55 + depth * 35) + '%, #1A1420)',
            clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
        });
        grass.appendChild(blade);
 
     
        gsap.set(blade, { rotation: gsap.utils.random(-6, 6) });
        gsap.to(blade, {
            rotation: gsap.utils.random(10, 27) * (Math.random() < 0.5 ? -1 : 1),
            duration: gsap.utils.random(1, 8),
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: Math.random() * 2,
        });
    });
 
    
    function setGrassColour(colour) {
        gsap.to(grass, { '--grass': colour, duration: 1, ease: 'power1.out' });
    }
 
    document.querySelectorAll('.swatch').forEach((btn) => {
        btn.addEventListener('click', () => setGrassColour(btn.dataset.c));
    });
 
    window.setGrassColour = setGrassColour;
    }

   
    if (document.querySelector('.ground')) initGrass();
    document.addEventListener('scene:loaded', initGrass);

})();