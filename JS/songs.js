
const fileInput = document.getElementById("fileInput");

fileInput.addEventListener("change", function(event){

    const file = event.target.files[0];

    if(!file) return;

    playLocalSong(URL.createObjectURL(file));

    console.log("Playing:", file.name);

});


async function playLocalSong(file) {
  const player = document.querySelector('.music-player');
    player.src = file;
    player.load();
    try {
        await player.play();
        unlockScroll();      
    } catch (err) {
        console.error("Couldn't play that file:", err);
       
    }
  
}




