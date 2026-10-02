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

const embed = document.createElement('div');   // youtubeApi.js puts the YT player in here
embed.id = 'youtubeEmbed';
embed.hidden = true;
songHost.appendChild(embed);

document.body.appendChild(songHost);

const songStore = {
  audio: new Audio(),   // lives in memory, not in your HTML
  current: null,        // {type:'local', url, name} | {type:'youtube', videoId, title, player}
  listeners: [],
  button: null,

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
    if (this.button) return;
    this.button = document.createElement('button');
    this.button.id = 'songToggle';
    this.button.type = 'button';
    this.button.addEventListener('click', () => this.toggle());
    songHost.appendChild(this.button);
    this.refreshButton();
  },

  hideControls() {
    this.button?.remove();
    this.button = null;
  },

  refreshButton() {
    if (this.button) this.button.textContent = this.isPlaying() ? 'Pause' : 'Play';
  }
};


setInterval(() => songStore.refreshButton(), 300);




