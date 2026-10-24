
function bindFileInput() {
    const fi = document.getElementById('fileInput');
    if (!fi || fi.dataset.bound) return;
    fi.dataset.bound = '1';
    fi.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (!file) return;
        playLocalSong(URL.createObjectURL(file), file.name);
    });
}
async function playLocalSong(url, name) {
    const player = songStore.audio;
    try {
        player.src = url;
        player.load();
        const playPromise = player.play();
        songStore.set({ type: 'local', url, name });
        await playPromise;
    } catch (err) {
        console.error("Couldn't play that file:", err);
        unlockScroll();
    }
}
if (document.getElementById('fileInput')) bindFileInput();
document.addEventListener('scene:loaded', bindFileInput);

