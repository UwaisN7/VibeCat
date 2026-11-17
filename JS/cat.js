//Cat cycles through 3 different moods at random
//Is async from the music itself


(function () {
    let activeCleanup = null;

    function initCat() {
        const sill = document.querySelector('.window-sill');
        const cat = document.querySelector('.cat-body');
        if (!sill || !cat || cat.dataset.catInit === '1') return;

        if (activeCleanup) activeCleanup();
        cat.dataset.catInit = '1';

        const leftPupil = document.getElementById('left-pupil');
        const rightPupil = document.getElementById('right-pupil');

        const MOODS = {
            happy: {
                minJump: 75,
                maxJump: 120,
                maxStep: 180,
                minPause: 0.45,
                maxPause: 1.1
            },
            sad: {
                minJump: 22,
                maxJump: 42,
                maxStep: 85,
                minPause: 1.4,
                maxPause: 2.8
            },
            tired: {
                minJump: 8,
                maxJump: 18,
                maxStep: 40,
                minPause: 2.6,
                maxPause: 4.5
            }
        };

        const MOOD_KEYS = Object.keys(MOODS);
        const GRAVITY = 950; 

        let currentMood = MOOD_KEYS[Math.floor(Math.random() * MOOD_KEYS.length)];
        let x = 0;
        let y = 0;
        let vx = 0;
        let vy = 0;
        let isGrounded = true;
        let idleTimer = 0.8;
        let moodTimer = randomRange(10, 18);
        let squashTimer = 0;
        let positioned = false;
        let rafId = null;

        function randomRange(min, max) {
            return min + Math.random() * (max - min);
        }

        function getMaxX() {
            return Math.max(0, sill.clientWidth - cat.offsetWidth);
        }

        function setLookDirection(dir) {
            if (!leftPupil || !rightPupil) return;
            const offset = dir * 2.5;
            leftPupil.style.transform = `translateX(${offset}px)`;
            rightPupil.style.transform = `translateX(${offset}px)`;
        }

        function setMood(mood) {
            currentMood = mood;
            cat.classList.remove('mood-happy', 'mood-sad', 'mood-tired');
            cat.classList.add(`mood-${mood}`);
        }

        function cycleMood() {
            const otherMoods = MOOD_KEYS.filter((m) => m !== currentMood);
            const nextMood = otherMoods[Math.floor(Math.random() * otherMoods.length)];
            setMood(nextMood);
            moodTimer = randomRange(10, 18);
        }

        function startJump() {
            const cfg = MOODS[currentMood];
            const maxX = getMaxX();
            if (maxX <= 0) return;

            const jumpHeight = randomRange(cfg.minJump, cfg.maxJump);
            const direction = Math.random() < 0.5 ? -1 : 1;
            const step = randomRange(cfg.maxStep * 0.35, cfg.maxStep) * direction;


            let targetX = x + step;
            if (targetX < 0) {
                targetX = Math.min(maxX, Math.abs(targetX));
            } else if (targetX > maxX) {
                targetX = Math.max(0, maxX - (targetX - maxX));
            }

            vy = Math.sqrt(2 * GRAVITY * jumpHeight);
            const airTime = (2 * vy) / GRAVITY;
            vx = (targetX - x) / airTime;
            isGrounded = false;

            setLookDirection(Math.sign(vx));
        }

        function clampToSill() {
            const maxX = getMaxX();
            if (x < 0) {
                x = 0;
                vx = Math.abs(vx);
                setLookDirection(1);
            } else if (x > maxX) {
                x = maxX;
                vx = -Math.abs(vx);
                setLookDirection(-1);
            }
        }

        function placeInitialPosition() {
            const maxX = getMaxX();
            if (maxX > 0) {
                x = Math.min(maxX, sill.clientWidth * 0.68);
                cat.style.left = `${x}px`;
                positioned = true;
            }
        }

        function onResize() {
            clampToSill();
            cat.style.left = `${x}px`;
        }

        function cleanup() {
            if (rafId !== null) cancelAnimationFrame(rafId);
            window.removeEventListener('resize', onResize);
            activeCleanup = null;
        }

        activeCleanup = cleanup;
        setMood(currentMood);
        placeInitialPosition();
        window.addEventListener('resize', onResize);

        let lastTime = performance.now();

        function loop(now) {

            if (!cat.isConnected) {
                cleanup();
                return;
            }

            if (!positioned) {
                placeInitialPosition();
            }

            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;

            moodTimer -= dt;
            if (moodTimer <= 0) {
                cycleMood();
            }

            if (isGrounded) {
                idleTimer -= dt;
                if (idleTimer <= 0) {
                    startJump();
                }
            } else {
                x += vx * dt;
                vy -= GRAVITY * dt;
                y += vy * dt;

                clampToSill();

                if (y <= 0 && vy < 0) {
                    y = 0;
                    vy = 0;
                    vx = 0;
                    isGrounded = true;
                    squashTimer = 0.12;
                    setLookDirection(0);

                    const cfg = MOODS[currentMood];
                    idleTimer = randomRange(cfg.minPause, cfg.maxPause);
                }
            }

            let scaleX = 1;
            let scaleY = 1;
            if (!isGrounded) {
                scaleX = 0.94;
                scaleY = 1.06;
            } else if (squashTimer > 0) {
                squashTimer -= dt;
                scaleX = 1.08;
                scaleY = 0.92;
            }

            cat.style.left = `${x}px`;
            cat.style.transform = `translateY(${-y}px) scale(${scaleX}, ${scaleY})`;

            rafId = requestAnimationFrame(loop);
        }

        rafId = requestAnimationFrame(loop);
    }

    if (document.querySelector('.cat-body')) initCat();
    document.addEventListener('scene:loaded', initCat);
})();