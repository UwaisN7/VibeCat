function bindFileInput() {
    const fi = document.getElementById('fileInput');
    if (!fi || fi.dataset.bound) return;
    fi.dataset.bound = '1';

    fi.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (!file) return;
        event.target.value = '';
        playLocalSong(URL.createObjectURL(file), file.name);
    });
}

async function playLocalSong(url, name) {
    const player = songStore.audio;

    try {
        player.src = url;
        songStore.set({ type: 'local', url, name });
        let spacer = document.getElementById('local-song-spacer');
        if (!spacer) {
            spacer = document.createElement('div');
            spacer.id = 'local-song-spacer';
            spacer.style.height = '60vh'; 
            spacer.style.width = '1px';
            spacer.style.visibility = 'hidden'; 
            spacer.style.pointerEvents = 'none'; 
            document.body.appendChild(spacer);
        }
        unlockScroll();
        await player.play();
        showMessage(`NICE! "${name}" is valid. You can scroll now.`, 'ok');
        console.log("Successfully playing:", name);
    } catch (err) {
        if (err.name !== 'AbortError') {

            console.error("Error playing file:", err);
            showMessage(`Could not play "${name}". Try another audio file,this one may be corrupted.`, 'error');
        }
        unlockScroll();
    }
}

if (document.getElementById('fileInput')) bindFileInput();
document.addEventListener('scene:loaded', bindFileInput);

