 
 (function generateStars() {
            const field = document.getElementById('starfield');
            const STAR_COUNT = 500;
            const fragment = document.createDocumentFragment();
 
            for (let i = 0; i < STAR_COUNT; i++) {
                const star = document.createElement('span');
                star.className = 'star';
                star.style.top = `${Math.random() * 100}%`;
                star.style.left = `${Math.random() * 100}%`;
 
                const size = (Math.random() * 2 + 1).toFixed(2); 
                star.style.width = `${size}px`;
                star.style.height = `${size}px`;
 
                star.style.animationDelay = `${(Math.random() * 4).toFixed(2)}s`;
                star.style.animationDuration = `${(Math.random() * 3 + 2).toFixed(2)}s`;
 
                fragment.appendChild(star);
            }
            field.appendChild(fragment);
        })();
 