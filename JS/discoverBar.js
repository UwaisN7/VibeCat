//On load the website loads 3 ongs into the disvovery bar
//Eveeyr 5 seconds the bar rotates by kicking the card on the left out and adding a new one on the right
//It will always load 3 songs at a time 
//It will show the thumbnail and the title thats it 
//When the user clicks a card it then runs through YoutubedataApi script 
//And then initiates the website into youtube mode.





let musicRec = [];
let currentRecIndex = 0;


async function  loadDiscoveryVideos() {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&q=NightcoreSyrex&maxResults=15&key=${API_KEY}`;

    try{
        const res = await fetch (url);
        const data = await res.json();
        musicRec = data.items;

        for (let i = 0; i<3; i++){
            addCard (musicRec[i]);
            currentRecIndex++;
        }
        setInterval(rotateCards,7000)
    }catch(err){
        console.error("Failed to load discovery", err)
    }
}

function addCard (videoData){
    const container = document.querySelector('.youtube-discovery');

    if (!container) {
        console.error("Could not find the .youtube-discovery section in the HTML!");
        return;
    }

    const card = document.createElement('article')
    card.className = 'discovery-card'

    card.style.backgroundImage = `url(${videoData.snippet.thumbnails.default.url})`;
    card.style.backgroundSize = `cover`;
    card.style.backgroundPosition = `center`;

    card.onclick = () => playFromDiscovery(videoData.id.videoId);

    container.appendChild(card);

}

function rotateCards(){
    if (musicRec.length === 0 )return;

    const nextVideo = musicRec [currentRecIndex % musicRec.length];
    currentRecIndex++;

    addCard(nextVideo);

    const allCards = document.querySelectorAll('.discovery-card')
    const firstCard = allCards[0];

    gsap.to(firstCard, {
        marginLeft: -65, 
        opacity: 0,
        duration: 1,
        ease: "power2.inOut",
        onComplete: () => {
            firstCard.remove(); // Delete it from HTML once off-screen
        }
    });
}

async function playFromDiscovery(videoId) {
     showMessage ('Loading discovery track...' , 'loading');

     const info = await verifyWithDataApi(videoId); 
    if (!info.ok) {
        showMessage(info.reason, 'error');
        return;
    }

    const playerResult = await verifyWithPlayer (videoId)
    if (!playerResult.ok){
        showMessage(playerResult.reason, 'error');
        return;
    }
  songStore.set({ 
        type: 'youtube', 
        videoId: info.videoId, 
        title: info.title, 
        player: ytPlayer 
    });
showMessage(`Now playing: ${info.title}`, 'ok');
}
document.addEventListener('DOMContentLoaded', () => {
    
    const discoveryContainer = document.querySelector('.youtube-discovery'); 
    loadDiscoveryVideos();
});