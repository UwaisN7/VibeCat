const API_KEY = 'AIzaSyA_5Cz13CvgJQ5jt2ckHTxwl5jgeiogKRk';
 

const linkInput   = document.getElementById('youtubeLink');
const loadButton  = document.getElementById('loadYoutube');
const messageBox  = document.getElementById('youtubeError');   
const embedBox    = document.getElementById('youtubeEmbed');
const localPlayer = document.getElementById('musicPlayer');
 
let ytPlayer = null; 
 
 

function extractVideoId(url) {
  const patterns = [
    /(?:youtu\.be\/)([\w-]{11})/,
    /[?&]v=([\w-]{11})/,
    /(?:embed\/)([\w-]{11})/,
    /(?:shorts\/)([\w-]{11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}
 
async function fetchVideoData(videoId) {
  const url = 'https://www.googleapis.com/youtube/v3/videos'
            + '?part=status,contentDetails,snippet'
            + `&id=${encodeURIComponent(videoId)}`
            + `&key=${API_KEY}`;
 
  const res = await fetch(url);
  return res.json();
}
 
async function verifyWithDataApi(videoId) {
  let data;
  try {
    data = await fetchVideoData(videoId);
  } catch (err) {
    return { ok: false, reason: 'Could not reach YouTube. Check your internet connection.' };
  }
 
  if (data.error) {
    return { ok: false, reason: `YouTube API error: ${data.error.message}` };
  }
  if (!data.items || data.items.length === 0) {
    return { ok: false, reason: "That video doesn't exist (or it's private/deleted)." };
  }
 
  const video          = data.items[0];
  const status         = video.status || {};
  const contentDetails = video.contentDetails || {};
 
  if (status.embeddable !== true) {
    return { ok: false, reason: "The owner doesn't allow this video to be embedded on other sites." };
  }
  if (status.uploadStatus !== 'processed') {
    return { ok: false, reason: `Video isn't ready yet (status: ${status.uploadStatus}).` };
  }
  if (status.privacyStatus === 'private') {
    return { ok: false, reason: 'This video is private.' };
  }
 
  const blocked = contentDetails.regionRestriction?.blocked;
  const allowed = contentDetails.regionRestriction?.allowed;
  const hasRegionLimits = (blocked && blocked.length > 0) || (allowed && allowed.length > 0);
 
  return {
    ok: true,
    title: video.snippet?.title || 'Unknown title',
    videoId,
    warning: hasRegionLimits ? 'Heads up: this video is region-restricted, so it may not play everywhere.' : ''
  };
}
 
 

let iframeApiPromise = null;
function loadIframeApi() {
  if (iframeApiPromise) return iframeApiPromise;
 
  iframeApiPromise = new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) return resolve();
 
    
    window.onYouTubeIframeAPIReady = () => resolve();
 
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = () => {
      iframeApiPromise = null; 
      reject(new Error('Failed to load the YouTube player script'));
    };
    document.head.appendChild(tag);
  });
 
  return iframeApiPromise;
}
 

const PLAYER_ERRORS = {
  2:   'YouTube says that video link is invalid.',
  5:   "YouTube's player hit an error loading this video.",
  100: "That video doesn't exist (or it's private/deleted).",
  101: "The owner doesn't allow this video to be played on other sites.",
  150: "The owner doesn't allow this video to be played on other sites.",
  153: "YouTube blocked the player because this page has no valid origin. Open the site through a local server (like VS Code Live Server) instead of double-clicking the file."
};
 

function verifyWithPlayer(videoId) {
  return new Promise(async (resolve) => {
    let settled = false;
    let graceTimer = null;
    let timeoutTimer = null;
 
    
    function finish(result) {
      if (settled) return;
      settled = true;
      clearTimeout(graceTimer);
      clearTimeout(timeoutTimer);
      resolve(result);
    }
 
    try {
      await loadIframeApi();
    } catch (err) {
      return finish({ ok: false, reason: "Couldn't load YouTube's player. Check your connection." });
    }
 
   
    if (ytPlayer && ytPlayer.destroy) ytPlayer.destroy();
    embedBox.innerHTML = '<div id="ytPlayer"></div>';
    embedBox.hidden = false;
 
    const playerVars = { rel: 0, playsinline: 1 };
    if (location.protocol.startsWith('http')) playerVars.origin = location.origin;
 
    ytPlayer = new YT.Player('ytPlayer', {
      videoId,
      playerVars,
      events: {
        onError(e) {
          finish({ ok: false, reason: PLAYER_ERRORS[e.data] || `YouTube player error (code ${e.data}).` });
        },
        onStateChange(e) {
    
          if ([5, 3, 1].includes(e.data)) {
            clearTimeout(graceTimer);
            graceTimer = setTimeout(() => finish({ ok: true }), 1200);
          }
        }
      }
    });
 
   
    timeoutTimer = setTimeout(() => {
      finish({ ok: false, reason: 'YouTube took too long to respond. Try again.' });
    }, 10000);
  });
}
 
 

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.hidden = false;
  messageBox.className = `youtube-error is-${type}`;
}
 
function lockScroll() {
  document.body.classList.add('scroll-locked');
  document.body.classList.remove('scroll-unlocked');
}
 
function unlockScroll() {
  document.body.classList.remove('scroll-locked');
  document.body.classList.add('scroll-unlocked');
}
 
function hideEmbed() {
  if (ytPlayer && ytPlayer.destroy) {
    ytPlayer.destroy();
    ytPlayer = null;
  }
  embedBox.innerHTML = '';
  embedBox.hidden = true;
}
 
 

async function handleLoad() {
  const rawLink = linkInput.value.trim();
 
  hideEmbed();
  lockScroll();
 
  if (!rawLink) {
    showMessage('Paste a YouTube link first.', 'error');
    return;
  }
 
  const videoId = extractVideoId(rawLink);
  if (!videoId) {
    showMessage("That doesn't look like a YouTube link.", 'error');
    return;
  }
 
  if (API_KEY === 'PASTE_YOUR_NEW_KEY_HERE') {
    showMessage('Add your YouTube API key at the top of youtubeApi.js first.', 'error');
    return;
  }
 
  loadButton.disabled = true;
 
  
  showMessage('Checking that video…', 'loading');
  const info = await verifyWithDataApi(videoId);
  if (!info.ok) {
    loadButton.disabled = false;
    showMessage(info.reason, 'error');
    return;
  }
 

  showMessage('Testing that it plays here…', 'loading');
  const playerResult = await verifyWithPlayer(videoId);
  loadButton.disabled = false;
 
  if (!playerResult.ok) {
    hideEmbed();
    showMessage(playerResult.reason, 'error');
    return;
  }
 
  localPlayer.pause();
  localPlayer.hidden = true;
  unlockScroll();
  showMessage(
    `NICE! "${info.title}" is good to go. Scroll is unlocked ${info.warning}`.trim(),
    'ok'
  );
}
 
 

lockScroll(); 
 
loadButton.addEventListener('click', handleLoad);
linkInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleLoad();
});
 