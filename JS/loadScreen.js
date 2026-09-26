
const curtain = document.getElementById('curtain');
let triggered = false;

function updateCurtain() {
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

function revealScene() {
    lockScroll();                    


    setTimeout(() => {
        curtain.style.opacity = 0;

        
        setTimeout(() => {
            unlockScroll();
            triggered = false;      
        }, 800);
    }, 600);                        
}

window.addEventListener('scroll', updateCurtain);