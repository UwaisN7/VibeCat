function lockScroll() {
  document.body.classList.add('scroll-locked');
  document.body.classList.remove('scroll-unlocked');
}

function unlockScroll() {
  document.body.classList.add('scroll-unlocked');
  document.body.classList.remove('scroll-locked');
}

lockScroll();

const songHost = document.createElement('div');
songHost.id = 'songHost';

const embed = document.createElement('div');   
embed.id = 'youtubeEmbed';
embed.className = 'youtube-embed';
embed.hidden = true;
songHost.appendChild(embed);

document.body.appendChild(songHost);

const songStore = {
  audio: new Audio(),   
  current: null,       
  listeners: [],

  set(song) {
    const prev = this.current;

    if (song.type === 'local') {
      if (typeof hideEmbed === 'function') hideEmbed();  
    } else {
      this.audio.pause();
      song.player.playVideo();
    }

    if (prev?.type === 'local' && prev.url !== song.url) {
      URL.revokeObjectURL(prev.url);
    }
    
    let spacer = document.getElementById('global-spacer');
    if (!spacer) {
        spacer = document.createElement('div');
        spacer.id = 'global-spacer';
        spacer.style.height = '60vh'; 
        spacer.style.width = '1px';
        spacer.style.visibility = 'hidden';
        spacer.style.pointerEvents = 'none';
        document.body.appendChild(spacer);
    }

    this.current = song;
    this.showControls();
    this.listeners.forEach(fn => fn(song));
    unlockScroll();
  },

  onChange(fn) { this.listeners.push(fn); },

  isPlaying() {
    const c = this.current;
    if (!c) return false;
    try {
      return c.type === 'local' ? !this.audio.paused : c.player.getPlayerState() === 1;
    } catch { return false; }
  },

  toggle() {
    const c = this.current;
    if (!c) return;
    if (c.type === 'local') {
      this.audio.paused ? this.audio.play() : this.audio.pause();
    } else {
      this.isPlaying() ? c.player.pauseVideo() : c.player.playVideo();
    }
    this.refreshButton();
  },

  showControls() {
    let btn = document.getElementById('songToggle');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'songToggle';
        btn.type = 'button';
        songHost.appendChild(btn);
    }
  },

  hideControls() {
    const btn = document.getElementById('songToggle');
    if (btn && btn.parentElement === songHost) {
        btn.remove();
    }
  },

  refreshButton() {
    const btn = document.getElementById('songToggle');
    if (btn) {
        if (!btn.dataset.bound) {
            btn.addEventListener('click', () => this.toggle());
            btn.dataset.bound = '1';
        }
        btn.textContent = this.isPlaying() ? 'Pause' : 'Play';
    }
  }
};

window.songStore = songStore;
songStore.audio.loop = true;
setInterval(() => songStore.refreshButton(), 300);