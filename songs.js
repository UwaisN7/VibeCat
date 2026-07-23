// List your local songs (put them in a /Songs folder in your repo)
const localSongs = [
    { title: "Paparazzi", file: "Songs/Nightcore - Paparazzi (Lyrics).mp4" },
     {  title:"Outside",file:"Songs/Nightcore - Outside (Lyrics).mp4"},
     {title:"NeverGoingHomeTonighttttt", file:"Songs/Nightcore - Never Going Home Tonight (Lyrics).mp4" },
     {title:"WhereHaveYouBeeen", file:"Songs/Nightcore - Where Have You Been (Lyrics).mp4" }

    
];

function displayLocalSongs() {
    const container = document.getElementById('localSongList');
    localSongs.forEach(song => {
        const btn = document.createElement('button');
        btn.textContent = song.title;
        btn.onclick = () => playLocalSong(song.file);
        container.appendChild(btn);
    });
}

function playLocalSong(file) {
    const player = document.querySelector('.music-player');

    // Swap the source and reload the element
    player.src = file;
    player.load();
    player.play();
    player.muted = false;

    // Make cat go CRAZY
    makeCatGoCrazy();

    // Calm the cat back down once the track ends
    player.onended = calmCatDown;
}

let catAnimation = null;

function makeCatGoCrazy() {
    if (typeof gsap === 'undefined') {
        console.warn('GSAP not loaded — add the GSAP <script> tag before script.js');
        return;
    }

    // Kill any previous animation so they don't stack up
    if (catAnimation) catAnimation.kill();

    // Make sure everything scales/moves from its center, not a corner
    gsap.set(['.cat', '.ear', '.eye'], { transformOrigin: '50% 50%' });

    catAnimation = gsap.timeline({ repeat: -1 })
        .to('.cat', {
            y: -20,
            duration: 0.35,
            ease: "power1.out",
            yoyo: true,
            repeat: 1
        }, 0)
        .to('.ear', {
            y: -6,
            rotation: 0 ,
            duration: 0.35,
            ease: "power1.out",
            yoyo: true,
            repeat: 1
        }, 0)
        .to('.eye', {
            scaleY: 0.2,
            duration: 0.12,
            ease: "power1.inOut",
            yoyo: true,
            repeat: 1
        }, 0.3);
}

function calmCatDown() {
    if (catAnimation) {
        catAnimation.kill();
        catAnimation = null;
    }
    if (typeof gsap !== 'undefined') {
        gsap.to(['.cat', '.ear', '.eye'], {
            y: 0,
            rotation: 0,
            scaleY: 1,
            duration: 0.4,
            ease: "power2.out"
        });
    }
}

// Run once the page has loaded
document.addEventListener('DOMContentLoaded', displayLocalSongs);
