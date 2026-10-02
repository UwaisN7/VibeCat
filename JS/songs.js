fileInput.addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) return;
  playLocalSong(URL.createObjectURL(file), file.name);
});

async function playLocalSong(url, name) {
  const player = songStore.audio;
  try {
    player.src = url;
    player.load();
    await player.play();
    songStore.set({ type: 'local', url, name });   
  } catch (err) {
    console.error("Couldn't play that file:", err);
    unlockScroll();
  }
}


