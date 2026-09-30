
const fileInput = document.getElementById("fileInput");

fileInput.addEventListener("change", function(event){

    const file = event.target.files[0];

    if(!file) return;

    playLocalSong(URL.createObjectURL(file));

    console.log("Playing:", file.name);

});


async function playLocalSong(file) {
  const player = document.querySelector('.music-player') || document.getElementById('musicPlayer');
  
  if (!player) {
    console.error("No player element found");
    unlockScroll();
    return;
  }

  try {
    player.src = file;
    player.load();
    await player.play();
    console.log("Playing, unlocking scroll");
    unlockScroll();
  } catch (err) {
    console.error("Couldn't play that file:", err);
    unlockScroll();  
  }
}



