 (function setupYoutubeLoader() {
            const linkInput = document.getElementById('youtubeLink');
            const loadButton = document.getElementById('loadYoutube');
            const errorMessage = document.getElementById('youtubeError');
            const embedContainer = document.getElementById('youtubeEmbed');
            const player = document.getElementById('musicPlayer');
 
            function extractVideoId(url) {
                const match = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
                return match ? match[1] : null;
            }
 
            loadButton.addEventListener('click', () => {
                const videoId = extractVideoId(linkInput.value.trim());
 
                if (!videoId) {
                    errorMessage.textContent = "That doesn't look like a YouTube link — try pasting the full video URL.";
                    errorMessage.hidden = false;
                    return;
                }
 
                errorMessage.hidden = true;
                player.hidden = true;
                embedContainer.hidden = false;
                embedContainer.innerHTML = `<iframe
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1"
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen></iframe>`;
            });
        })();