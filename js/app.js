/* ============================================================
   ROMANTIC WEBSITE — APP ENGINE (POLISHED & ROBUST)
   Scene manager, passcode logic, falling petals, typewriter
   note effect, dual-mode music player, polaroid fallbacks.
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────────────────────
   SCENE DEFINITION & ORDER
   ────────────────────────────────────────────────────────── */

const SCENES = [
  's-passcode',   // 0
  's-wrong',      // 1
  's-surprise',   // 2
  's-hub-a',      // 3
  's-letter',     // 4
  's-jar',        // 5
  's-reasons',    // 6
  's-hub-b',      // 7
  's-music',      // 8
  's-photos',     // 9
  's-hub-c',      // 10
  's-award',      // 11
  's-end'         // 12
];

const PAGINATED_SCENES = [
  's-hub-a', 's-letter', 's-jar', 's-reasons',
  's-hub-b', 's-music',  's-photos',
  's-hub-c', 's-award'
];

/* ──────────────────────────────────────────────────────────
   STATE
   ────────────────────────────────────────────────────────── */
let currentScene   = 's-passcode';
let passcodeEntry  = [];
let isTransitioning = false;

// Dual Player State
let ytPlayer       = null;
let ytReady        = false;
let isPlaying      = false;
let isLooping      = false;
let volumePercent  = 80;
let isMuted        = false;

// Audio HTML5 Fallback
const audioFallback = new Audio();

// Intervals & Timeouts
let scrubInterval  = null;
let lyricInterval  = null;
let revealTimeout  = null;
let photoRevealDone = false;
let letterTyped     = false;

// Fallback illustrations for polaroid gallery
const FALLBACK_ILLUSTRATIONS = [
  `<svg viewBox="0 0 120 150" style="width:100%;height:100%;display:block;"><rect width="120" height="150" fill="#FFF0F2"/><circle cx="60" cy="55" r="25" fill="#FFE082" opacity="0.5"/><polygon points="60,25 63,35 73,35 65,42 68,52 60,45 52,52 55,42 47,35 57,35" fill="#E8728A"/><circle cx="30" cy="40" r="2.5" fill="#E8728A"/><circle cx="90" cy="30" r="3" fill="#E8728A"/><circle cx="40" cy="80" r="2" fill="#E8728A"/></svg>`,
  `<svg viewBox="0 0 120 150" style="width:100%;height:100%;display:block;"><rect width="120" height="150" fill="#FFF0F2"/><circle cx="45" cy="55" r="10" fill="#F2A6C4"/><circle cx="75" cy="50" r="12" fill="#E8728A"/><circle cx="60" cy="72" r="8" fill="#FFB3C6"/><path d="M45 55 L45 95 M75 50 L75 95 M60 72 L60 95" stroke="#6B8F5E" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  `<svg viewBox="0 0 120 150" style="width:100%;height:100%;display:block;"><rect width="120" height="150" fill="#FFF0F2"/><rect x="25" y="45" width="70" height="42" rx="4" fill="#3A2E2E"/><rect x="35" y="53" width="50" height="26" rx="2" fill="#FFD97D"/><circle cx="48" cy="66" r="6" fill="#3A2E2E"/><circle cx="72" cy="66" r="6" fill="#3A2E2E"/><path d="M53 66 L67 66" stroke="#3A2E2E" stroke-width="2"/></svg>`,
  `<svg viewBox="0 0 120 150" style="width:100%;height:100%;display:block;"><rect width="120" height="150" fill="#FFF0F2"/><path d="M60 85 C60 85 25 62 25 42 C25 27 35 17 50 17 C57 17 60 22 60 22 C60 22 63 17 70 17 C85 17 95 27 95 42 C95 62 60 85 60 85Z" fill="#E8728A"/><circle cx="48" cy="36" r="3.5" fill="white" opacity="0.6"/></svg>`
];

/* ──────────────────────────────────────────────────────────
   SCENE MANAGER
   ────────────────────────────────────────────────────────── */
function showScene(id, direction = 'forward') {
  if (isTransitioning || id === currentScene) return;
  isTransitioning = true;

  const prev = document.getElementById(currentScene);
  const next = document.getElementById(id);
  if (!next) { isTransitioning = false; return; }

  const exitClass    = direction === 'forward' ? 'exit-left' : 'exit-right';
  const enterOffset  = direction === 'forward' ? 'translateX(100%)' : 'translateX(-100%)';

  next.style.transform = enterOffset;
  next.style.opacity   = '0';
  next.style.pointerEvents = 'none';
  next.classList.remove('active', 'exit-left', 'exit-right');
  next.style.display = '';

  void next.offsetWidth;

  prev.classList.add(exitClass);
  prev.classList.remove('active');

  next.style.transition = 'opacity 500ms ease-in-out, transform 500ms ease-in-out';
  next.style.transform  = 'translateX(0)';
  next.style.opacity    = '1';

  if (id === 's-music' && !isPlaying) {
    startMusic();
  }

  setTimeout(() => {
    prev.classList.remove('active', 'exit-left', 'exit-right');
    prev.style.transform = '';
    prev.style.opacity   = '';
    prev.style.transition = '';

    next.classList.add('active');
    next.style.transform  = '';
    next.style.opacity    = '';
    next.style.transition = '';
    next.style.pointerEvents = '';

    currentScene    = id;
    isTransitioning = false;

    onSceneEnter(id);
    updatePaginationDots();
  }, 510);
}

/* ──────────────────────────────────────────────────────────
   SCENE ENTRY CALLBACKS
   ────────────────────────────────────────────────────────── */
function onSceneEnter(id) {
  switch (id) {
    case 's-wrong':
      runTypewriterHeadline('wrong-headline', 'WRONG PASSCODE!', 60);
      break;

    case 's-surprise':
      runTypewriterHeadline('surprise-headline', 'SURPRISE AWAITING ❤', 70);
      break;

    case 's-photos':
      if (!photoRevealDone) {
        photoRevealDone = true;
        setTimeout(() => runTextReveal(
          'photo-caption',
          "Here's a little reminder of how pretty you are <3",
          50
        ), 600);
      }
      break;

    case 's-letter':
      // Reset typing state if entering fresh
      if (!letterTyped) {
        const seal = document.getElementById('letter-seal-container');
        if (seal) seal.style.display = 'flex';
        const block = document.getElementById('letter-text-block');
        if (block) block.innerHTML = '';
      }
      break;

    case 's-reasons':
      initReasonsScene();
      break;
  }
}

/* ──────────────────────────────────────────────────────────
   PAGINATION DOTS
   ────────────────────────────────────────────────────────── */
function buildPaginationDots() {
  const nav = document.getElementById('pagination-dots');
  if (!nav) return;
  nav.innerHTML = '';
  PAGINATED_SCENES.forEach((sceneId, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.setAttribute('aria-label', `Go to scene ${i + 1}`);
    dot.dataset.scene = sceneId;
    dot.addEventListener('click', () => {
      const dir = PAGINATED_SCENES.indexOf(sceneId) > PAGINATED_SCENES.indexOf(currentScene)
        ? 'forward' : 'back';
      showScene(sceneId, dir);
    });
    nav.appendChild(dot);
  });
}

function updatePaginationDots() {
  const nav = document.getElementById('pagination-dots');
  if (!nav) return;
  const inPaginated = PAGINATED_SCENES.includes(currentScene);
  nav.classList.toggle('visible', inPaginated);

  document.querySelectorAll('#pagination-dots .dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.scene === currentScene);
  });
}

/* ──────────────────────────────────────────────────────────
   TYPEWRITER / TEXT REVEAL ANIMATION
   ────────────────────────────────────────────────────────── */
function runTypewriterHeadline(containerId, text, delayPerChar = 60) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.textContent = '';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = text;
    return;
  }

  let i = 0;
  function addChar() {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
      revealTimeout = setTimeout(addChar, delayPerChar);
    }
  }
  addChar();
}

function runTextReveal(containerId, text, delayPerChar = 45) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.textContent = '';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = text;
    return;
  }

  let i = 0;
  function addChar() {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
      setTimeout(addChar, delayPerChar);
    }
  }
  addChar();
}

/* ──────────────────────────────────────────────────────────
   REASONS SCENE — premium interactive jar experience
   ────────────────────────────────────────────────────────── */
let reasonsInitialized = false;

function initReasonsScene() {
  const scene = document.getElementById('s-reasons');
  if (!scene) return;

  // Reset on every visit so hearts rebuild properly
  if (reasonsInitialized) return;
  reasonsInitialized = true;

  const chipsContainer = scene.querySelector('#reason-chips');
  const cardsContainer = scene.querySelector('.reasons-cards');
  const progressEl     = scene.querySelector('.reasons-progress-text');
  const reasons        = (CONFIG.REASONS_FULL || []);
  const total          = reasons.length;
  let revealed         = 0;

  // Staggered heart chip creation
  reasons.forEach((text, i) => {
    const heart = document.createElement('button');
    heart.className = 'reason-heart-chip';
    heart.setAttribute('tabindex', '0');
    heart.setAttribute('aria-label', `Open reason ${i + 1}`);
    heart.innerHTML = `<svg viewBox="0 0 32 29" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 27 C16 27 1 17 1 8 C1 3.5 4.5 1 8.5 1 C11.5 1 14 3 16 5.5 C18 3 20.5 1 23.5 1 C27.5 1 31 3.5 31 8 C31 17 16 27 16 27Z" fill="url(#hg${i})" stroke="#C2185B" stroke-width="1.2"/>
      <defs>
        <linearGradient id="hg${i}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F48FB1"/>
          <stop offset="100%" stop-color="#E91E63"/>
        </linearGradient>
      </defs>
      <circle cx="10" cy="9" r="2.5" fill="white" opacity="0.5"/>
    </svg>
    <span class="chip-num">${i + 1}</span>`;
    heart.style.animationDelay = `${i * 0.1}s`;

    const reveal = () => {
      if (heart.classList.contains('opened')) return;
      heart.classList.add('opened');
      revealed++;

      // Update progress
      if (progressEl) progressEl.textContent = `${revealed} / ${total}`;
      scene.querySelector('.reasons-progress-bar-fill').style.width = `${(revealed / total) * 100}%`;

      // Spawn sparkles at heart position
      spawnSparkles(heart);

      // Create card
      const card = document.createElement('div');
      card.className = 'reason-card-item';
      card.style.animationDelay = '0s';
      card.innerHTML = `
        <div class="card-number">${revealed}</div>
        <div class="card-heart-icon">💕</div>
        <p class="card-text">${text}</p>`;
      cardsContainer.appendChild(card);

      // Scroll card into view
      setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);

      // Celebration when all opened
      if (revealed === total) {
        setTimeout(() => triggerReasonsCelebration(scene), 600);
      }
    };

    heart.addEventListener('click', reveal);
    heart.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(); }
    });

    chipsContainer.appendChild(heart);
  });

  // Init progress bar
  if (progressEl) progressEl.textContent = `0 / ${total}`;
}

function spawnSparkles(origin) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;
  const rect = origin.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;
  const emojis = ['✨','💖','🌸','⭐','💫'];
  for (let k = 0; k < 6; k++) {
    const sp = document.createElement('div');
    sp.className = 'reason-sparkle';
    sp.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    sp.style.left = `${cx}px`;
    sp.style.top  = `${cy}px`;
    sp.style.setProperty('--dx', `${(Math.random() - 0.5) * 120}px`);
    sp.style.setProperty('--dy', `${-(Math.random() * 100 + 40)}px`);
    sp.style.animationDelay = `${k * 0.05}s`;
    document.body.appendChild(sp);
    setTimeout(() => sp.remove(), 1100);
  }
}

function triggerReasonsCelebration(scene) {
  const existing = scene.querySelector('.reasons-celebration');
  if (existing) return;
  const cel = document.createElement('div');
  cel.className = 'reasons-celebration';
  cel.innerHTML = `
    <div class="cel-inner">
      <div class="cel-hearts" aria-hidden="true">💖💕💖</div>
      <h3 class="cel-title">You are my everything 🌸</h3>
      <p class="cel-subtitle">These are just 10 of a million reasons I love you, Manasvii.</p>
      <button class="cel-btn" id="reasons-continue-btn" aria-label="Continue our journey">
        Continue Our Journey ✨
      </button>
    </div>`;
  scene.appendChild(cel);
  // Trigger entrance
  requestAnimationFrame(() => cel.classList.add('visible'));
  cel.querySelector('#reasons-continue-btn').addEventListener('click', () => {
    showScene('s-hub-b', 'forward');
  });
}

function initPasscode() {

  const keys = document.querySelectorAll('.numpad-key[data-digit]');
  const backBtn = document.getElementById('backspace-btn');

  keys.forEach(key => {
    const digit = key.dataset.digit;
    if (digit === '*') return;

    key.addEventListener('click', () => {
      if (key === backBtn) return;
      handleDigitInput(digit);
    });

    key.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleDigitInput(digit);
      }
    });
  });

  backBtn.addEventListener('click', handleBackspace);
  backBtn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleBackspace(); }
  });

  document.addEventListener('keydown', onKeyboardPasscode);
}

function onKeyboardPasscode(e) {
  if (currentScene !== 's-passcode') return;
  if (e.key >= '0' && e.key <= '9') handleDigitInput(e.key);
  if (e.key === 'Backspace') handleBackspace();
}

function handleDigitInput(digit) {
  if (passcodeEntry.length >= 4) return;
  passcodeEntry.push(digit);
  updateDigitBoxes();

  if (passcodeEntry.length === 4) {
    setTimeout(evaluatePasscode, 200);
  }
}

function handleBackspace() {
  if (passcodeEntry.length === 0) return;
  passcodeEntry.pop();
  updateDigitBoxes();
}

function updateDigitBoxes() {
  for (let i = 0; i < 4; i++) {
    const box = document.getElementById(`db-${i}`);
    if (i < passcodeEntry.length) {
      box.classList.add('filled');
      box.setAttribute('aria-label', `Digit ${i + 1}: filled`);
    } else {
      box.classList.remove('filled', 'success', 'error');
      box.setAttribute('aria-label', `Digit ${i + 1}: empty`);
    }
  }
}

function evaluatePasscode() {
  const entered = passcodeEntry.join('');
  const correct = String(CONFIG.passcode);

  if (entered === correct) {
    handleCorrectPasscode();
  } else {
    handleWrongPasscode();
  }
}

function handleCorrectPasscode() {
  for (let i = 0; i < 4; i++) {
    const box = document.getElementById(`db-${i}`);
    box.classList.remove('filled', 'error');
    box.classList.add('success');
  }
  announceToSR('Passcode correct! Unlocking...');

  let flash = document.querySelector('.unlock-flash');
  if (!flash) {
    flash = document.createElement('div');
    flash.className = 'unlock-flash';
    flash.textContent = 'UNLOCKED ✓';
    document.querySelector('.passcode-right').appendChild(flash);
  }
  setTimeout(() => flash.classList.add('show'), 100);

  setTimeout(() => {
    flash.classList.remove('show');
    resetPasscode();
    showScene('s-surprise', 'forward');
  }, 900);
}

function handleWrongPasscode() {
  for (let i = 0; i < 4; i++) {
    const box = document.getElementById(`db-${i}`);
    box.classList.add('error');
  }
  announceToSR('Wrong passcode. Please try again.');

  setTimeout(() => {
    showScene('s-wrong', 'forward');
  }, 400);
}

function resetPasscode() {
  passcodeEntry = [];
  updateDigitBoxes();
  for (let i = 0; i < 4; i++) {
    const box = document.getElementById(`db-${i}`);
    box.classList.remove('filled', 'success', 'error');
  }
}

/* ──────────────────────────────────────────────────────────
   WRONG PASSCODE SCREEN
   ────────────────────────────────────────────────────────── */
function initWrongScreen() {
  document.getElementById('try-again-btn').addEventListener('click', () => {
    resetPasscode();
    showScene('s-passcode', 'back');
  });
}

/* ──────────────────────────────────────────────────────────
   SURPRISE SCREEN
   ────────────────────────────────────────────────────────── */
function initSurpriseScreen() {
  document.getElementById('surprise-btn').addEventListener('click', () => {
    showScene('s-hub-a', 'forward');
  });
}

/* ──────────────────────────────────────────────────────────
   HUB INTERACTIONS
   ────────────────────────────────────────────────────────── */
function initHubs() {
  bindHubItem('hub-a-gift',     's-letter');
  bindHubItem('hub-a-cassette', 's-music');
  bindHubItem('hub-a-camera',   's-photos');
  bindHubItem('hub-a-bouquet',  's-jar');

  bindHubItem('hub-b-gift',     's-music');
  bindHubItem('hub-b-music',    's-music');
  bindHubItem('hub-b-photos',   's-photos');
  bindHubItem('hub-b-more',     's-jar');

  bindHubItem('hub-c-gift',     's-award');
  bindHubItem('hub-c-award',    's-award');
  bindHubItem('hub-c-heart',    's-award');
  bindHubItem('hub-c-ribbon',   's-award');
}

function bindHubItem(btnId, targetScene) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  btn.addEventListener('click', () => {
    showScene(targetScene, 'forward');
  });

  btn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showScene(targetScene, 'forward');
    }
  });
}

/* ──────────────────────────────────────────────────────────
   LOVE LETTER — CONFIG-DRIVEN TYPING EFFECT
   ────────────────────────────────────────────────────────── */
function renderLetter() {
  if (!letterTyped) {
    setTimeout(typeLetterText, 500);
  }

  // Inject letterPhoto into the Polaroid on the love letter page
  renderLetterPhoto();
}

function renderLetterPhoto() {
  const polaroidImg = document.querySelector('.polaroid-img');
  if (!polaroidImg) return;

  if (CONFIG.letterPhoto && CONFIG.letterPhoto !== '') {
    const img = document.createElement('img');
    img.src = CONFIG.letterPhoto;
    img.alt = CONFIG.recipientName;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:4px;display:block;';
    img.onerror = () => {
      // keep existing SVG placeholder if image fails
    };
    polaroidImg.innerHTML = '';
    polaroidImg.appendChild(img);
  }
}

function typeLetterText() {
  const block = document.getElementById('letter-text-block');
  if (!block) return;
  block.innerHTML = '';
  letterTyped = true;

  let currentParaIndex = 0;
  let currentCharIndex = 0;
  
  // Ensure textLines is an array of strings
  let textLines = CONFIG.letterText;
  if (typeof textLines === 'string') {
    textLines = textLines.split('\n');
  }

  function typeNext() {
    if (currentParaIndex >= textLines.length) {
      return;
    }

    const lineText = textLines[currentParaIndex];

    if (lineText === '') {
      block.appendChild(document.createElement('br'));
      currentParaIndex++;
      currentCharIndex = 0;
      setTimeout(typeNext, 150);
      return;
    }

    let p = block.children[block.children.length - 1];
    if (!p || p.tagName === 'BR' || currentCharIndex === 0) {
      p = document.createElement('p');
      if (currentParaIndex === 0) {
        p.className = 'salutation';
      }
      block.appendChild(p);
    }

    p.textContent = lineText.substring(0, currentCharIndex + 1);

    let cursor = document.getElementById('letter-cursor');
    if (!cursor) {
      cursor = document.createElement('span');
      cursor.id = 'letter-cursor';
      cursor.className = 'typing-cursor';
    }
    p.appendChild(cursor);

    currentCharIndex++;
    if (currentCharIndex < lineText.length) {
      setTimeout(typeNext, 40);
    } else {
      cursor.remove();
      currentParaIndex++;
      currentCharIndex = 0;
      setTimeout(typeNext, 300);
    }
  }
  typeNext();
}

function initLetterNav() {
  document.getElementById('letter-back')?.addEventListener('click', () =>
    showScene('s-hub-a', 'back'));
  document.getElementById('letter-next')?.addEventListener('click', () =>
    showScene('s-reasons', 'forward'));
}

/* ──────────────────────────────────────────────────────────
   JAR SCENE — CONFIG-DRIVEN RENDERING (POLISHED)
   ────────────────────────────────────────────────────────── */
function renderJar() {
  const chips = document.getElementById('reason-chips');
  const counter = document.getElementById('reasons-count');
  if (!chips) return;

  chips.innerHTML = '';
  CONFIG.reasons.forEach((r, idx) => {
    const span = document.createElement('span');
    span.className = 'reason-chip';
    span.setAttribute('aria-label', r);
    span.textContent = `♡ ${r}`;
    
    // Add random slight tilts for organic scrapbook feel
    const angle = -5 + Math.random() * 10;
    span.style.transform = `rotate(${angle}deg)`;
    span.style.animationDelay = `${idx * 0.15}s`;
    
    chips.appendChild(span);
  });

  if (counter) counter.textContent = CONFIG.reasons.length;
}

function initJarNav() {
  document.getElementById('jar-back')?.addEventListener('click', () =>
    showScene('s-reasons', 'back'));
  document.getElementById('jar-next')?.addEventListener('click', () =>
    showScene('s-hub-b', 'forward'));
}

/* ──────────────────────────────────────────────────────────
   MUSIC PLAYER — DUAL PLAYER MODE (YouTube + HTML5 Fallback)
   ────────────────────────────────────────────────────────── */
function initMusicPlayer() {
  const titleEl = document.getElementById('music-title-display');
  const coverEl = document.getElementById('music-cover-img');
  const bigTitleEl = document.getElementById('music-big-title');
  const subArtistEl = document.getElementById('music-sub-artist');

  if (titleEl) titleEl.textContent = `${CONFIG.song.title} — ${CONFIG.song.artist}`;
  if (bigTitleEl) bigTitleEl.textContent = CONFIG.song.title;
  if (subArtistEl) subArtistEl.textContent = CONFIG.song.artist;
  if (coverEl && CONFIG.song.coverSrc) coverEl.src = CONFIG.song.coverSrc;
  
  audioFallback.src = CONFIG.song.audioSrc;
  audioFallback.addEventListener('ended', () => {
    if (isLooping) {
      audioFallback.currentTime = 0;
      audioFallback.play();
    } else {
      isPlaying = false;
      updatePlayIcons(false);
      stopScrubber();
      const playBtn = document.getElementById('music-play-main');
      if (playBtn) playBtn.style.display = 'flex';
    }
  });

  // Play controls
  document.getElementById('music-play-main')?.addEventListener('click', startMusic);
  document.getElementById('mini-play')?.addEventListener('click', togglePlayPause);
  document.getElementById('loop-btn')?.addEventListener('click', toggleLoop);

  // Volume slider
  const slider = document.getElementById('volume-slider');
  slider?.addEventListener('input', (e) => {
    setVolume(e.target.value);
  });

  // Mute button
  document.getElementById('volume-mute-btn')?.addEventListener('click', toggleMute);

  // Seeker
  document.getElementById('scrubber-track')?.addEventListener('click', seekSong);

  // Next / Prev (visual reset for single song)
  document.getElementById('mini-prev')?.addEventListener('click', () => {
    seekTo(0);
  });
  document.getElementById('mini-next')?.addEventListener('click', () => {
    seekTo(0);
  });

  // Navigation
  document.getElementById('music-back')?.addEventListener('click', () => {
    showScene('s-hub-a', 'back');
  });
  document.getElementById('music-next')?.addEventListener('click', () => {
    showScene('s-photos', 'forward');
  });
}

function startMusic() {
  const playBtn = document.getElementById('music-play-main');

  if (playBtn) playBtn.style.display = 'none';

  isPlaying = true;
  updatePlayIcons(true);

  audioFallback.play().catch(err => {
    console.log('Autoplay restriction handled: awaiting user gesture.', err);
  });
  startScrubberFallback();
}

function togglePlayPause() {
  if (!isPlaying) {
    startMusic();
  } else {
    pauseMusic();
  }
}

function pauseMusic() {
  isPlaying = false;
  updatePlayIcons(false);
  audioFallback.pause();
  stopScrubber();
  
  const playBtn = document.getElementById('music-play-main');
  if (playBtn) playBtn.style.display = 'flex';
}

function seekTo(seconds) {
  audioFallback.currentTime = seconds;
}

function setVolume(val) {
  volumePercent = val;
  audioFallback.volume = val / 100;
  
  const muteBtn = document.getElementById('volume-mute-btn');
  if (muteBtn) {
    muteBtn.textContent = val == 0 ? '🔇' : '🔊';
  }
}

function toggleMute() {
  isMuted = !isMuted;
  const slider = document.getElementById('volume-slider');
  
  if (isMuted) {
    audioFallback.muted = true;
    if (slider) slider.value = 0;
    document.getElementById('volume-mute-btn').textContent = '🔇';
  } else {
    audioFallback.muted = false;
    if (slider) slider.value = volumePercent;
    document.getElementById('volume-mute-btn').textContent = '🔊';
  }
}

function toggleLoop() {
  isLooping = !isLooping;
  const btn = document.getElementById('loop-btn');
  if (btn) btn.classList.toggle('active', isLooping);
  audioFallback.loop = isLooping;
}

function updatePlayIcons(playing) {
  const miniIcon = document.getElementById('mini-play-icon');
  if (miniIcon) {
    miniIcon.innerHTML = playing
      ? '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>'
      : '<path d="M8 5v14l11-7z"/>';
  }
}

/* Scrubber Seeking */
function seekSong(e) {
  const track = document.getElementById('scrubber-track');
  if (!track) return;
  const pct = e.offsetX / track.offsetWidth;
  const duration = audioFallback.duration || 185;
  seekTo(pct * duration);
}

/* Time Scrubber Update */
function startScrubberFallback() {
  stopScrubber();
  scrubInterval = setInterval(() => {
    const curTime = audioFallback.currentTime || 0;
    const duration = (audioFallback.duration && !isNaN(audioFallback.duration)) ? audioFallback.duration : 185;
    updateProgressBar(curTime, duration);
  }, 250);
}

function updateProgressBar(curTime, duration) {
  const pct = Math.min((curTime / duration) * 100, 100);
  const fill = document.getElementById('scrubber-fill');
  const dot  = document.getElementById('scrubber-dot');
  const cur  = document.getElementById('music-current');
  const tot  = document.getElementById('music-total');

  if (fill) fill.style.width = `${pct}%`;
  if (dot)  dot.style.left   = `${pct}%`;
  if (cur)  cur.textContent  = formatTime(curTime);
  if (tot)  tot.textContent  = formatTime(duration);
}

function stopScrubber() {
  if (scrubInterval) clearInterval(scrubInterval);
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* Lyric Overlay Manager */
function startLyricsFallback() {
  stopLyrics();
  lyricInterval = setInterval(() => {
    updateLyrics(audioFallback.currentTime);
  }, 250);
}

function updateLyrics(time) {
  const lyrics = CONFIG.song.lyrics;
  if (!lyrics) return;

  let current = lyrics[0];
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].time <= time) {
      current = lyrics[i];
    } else {
      break;
    }
  }

  const lyricEl = document.getElementById('lyric-text');
  if (lyricEl && lyricEl.dataset.current !== current.text) {
    lyricEl.dataset.current = current.text;
    lyricEl.style.animation = 'none';
    void lyricEl.offsetWidth;
    lyricEl.style.animation = '';
    lyricEl.textContent = current.text;
  }
}

function stopLyrics() {
  if (lyricInterval) clearInterval(lyricInterval);
}

/* ──────────────────────────────────────────────────────────
   PHOTO GALLERY (Scrapbook)
   ────────────────────────────────────────────────────────── */
function renderPhotos() {
  const board = document.getElementById('scrapbook-board');
  if (!board) return;

  board.innerHTML = '';

  CONFIG.photos.forEach((photo, i) => {
    const frame = document.createElement('div');
    const frameClass = photo.frameType ? `frame-${photo.frameType}` : 'frame-polaroid';
    frame.className = `scrapbook-photo ${frameClass}`;
    
    // Slight random rotation if not provided
    const rotation = photo.rotation || (Math.random() * 10 - 5);
    frame.style.transform = `rotate(${rotation}deg)`;
    frame.style.animationDelay = `${i * 0.15}s`;

    // Add Washi tape
    const tape = document.createElement('div');
    tape.className = 'washi-tape';
    frame.appendChild(tape);

    if (photo.src && photo.src !== '') {
      const img = document.createElement('img');
      img.src = photo.src;
      img.alt = photo.alt || `Memory ${i + 1}`;
      img.loading = 'lazy';

      img.onerror = () => {
        frame.removeChild(img);
        const fallbackContainer = document.createElement('div');
        fallbackContainer.innerHTML = FALLBACK_ILLUSTRATIONS[i % FALLBACK_ILLUSTRATIONS.length];
        frame.appendChild(fallbackContainer.firstChild);
      };

      frame.appendChild(img);
    } else {
      const fallbackContainer = document.createElement('div');
      fallbackContainer.innerHTML = FALLBACK_ILLUSTRATIONS[i % FALLBACK_ILLUSTRATIONS.length];
      frame.appendChild(fallbackContainer.firstChild);
    }

    // Add caption and note below all photo frames to fill the empty space
    const textContainer = document.createElement('div');
    textContainer.className = 'scrapbook-photo-text';
    
    if (photo.caption) {
      const cap = document.createElement('div');
      cap.className = 'scrapbook-caption-preview';
      cap.textContent = photo.caption;
      textContainer.appendChild(cap);
    }
    
    if (photo.note) {
      const noteEl = document.createElement('div');
      noteEl.className = 'scrapbook-note-preview';
      noteEl.textContent = photo.note;
      textContainer.appendChild(noteEl);
    }
    
    frame.appendChild(textContainer);

    // Click interaction for modal
    frame.addEventListener('click', () => {
      openMemoryModal(photo);
    });

    board.appendChild(frame);
  });
}

function openMemoryModal(photo) {
  const modal = document.getElementById('memory-modal');
  const imgEl = document.getElementById('memory-modal-img');
  const dateEl = document.getElementById('memory-modal-date');
  const captionEl = document.getElementById('memory-modal-caption');
  const noteEl = document.getElementById('memory-modal-note');

  if (!modal) return;

  imgEl.src = photo.src || '';
  dateEl.textContent = photo.date || '';
  captionEl.textContent = photo.caption || '';
  noteEl.textContent = photo.note || '';
  
  // hide date if empty
  dateEl.style.display = photo.date ? 'block' : 'none';

  modal.classList.add('open');
}

function closeMemoryModal() {
  const modal = document.getElementById('memory-modal');
  if (modal) {
    modal.classList.remove('open');
  }
}

function initPhotosNav() {
  document.getElementById('photos-back')?.addEventListener('click', () => {
    showScene('s-hub-a', 'back');
  });
  document.getElementById('photos-next')?.addEventListener('click', () => {
    showScene('s-award', 'forward');
  });

  // Modal close handlers
  document.getElementById('memory-modal-close-btn')?.addEventListener('click', closeMemoryModal);
  document.getElementById('memory-modal-close')?.addEventListener('click', closeMemoryModal);
}

/* ──────────────────────────────────────────────────────────
   AWARD SCENE — CONFIG-DRIVEN RENDERING
   ────────────────────────────────────────────────────────── */
function renderAward() {
  const aw = CONFIG.award || {};
  
  const els = {
    title: document.getElementById('cert-title'),
    subtitle: document.getElementById('cert-subtitle'),
    name: document.getElementById('cert-name'),
    date: document.getElementById('cert-date'),
    id: document.getElementById('cert-id'),
    sig: document.getElementById('cert-sig'),
    message: document.getElementById('cert-message'),
    quote: document.getElementById('award-quote-text'),
    closingText: document.getElementById('award-closing-text')
  };

  if (els.title) els.title.textContent = aw.title || "BEST GIRLFRIEND IN THE WORLD";
  if (els.subtitle) els.subtitle.textContent = aw.subtitle || "Official Certificate of Love";
  if (els.name) els.name.textContent = aw.presentedTo || CONFIG.recipientName;
  if (els.date) els.date.textContent = aw.date || new Date().toLocaleDateString();
  if (els.id) els.id.textContent = aw.certId || "GF-001";
  if (els.sig) els.sig.textContent = aw.signature || "With all my heart";
  if (els.message) els.message.textContent = aw.message || CONFIG.awardMessage;
  if (els.quote) els.quote.textContent = aw.bottomQuote || "Every love story is beautiful...";
  if (els.closingText) els.closingText.textContent = aw.closingMessage || "You mean the world to me.";
}

function initAwardNav() {
  // Back
  document.getElementById('award-back')?.addEventListener('click', () => {
    showScene('s-hub-a', 'back');
  });

  // Medal Click -> Confetti + Popup
  const medal = document.getElementById('cert-medal');
  const popup = document.getElementById('award-congrats-popup');
  const popupClose = document.getElementById('congrats-close');

  medal?.addEventListener('click', () => {
    fireConfetti();
    popup?.classList.add('visible');
  });

  popupClose?.addEventListener('click', () => {
    popup?.classList.remove('visible');
  });

  // Next (Read Final Message)
  const nextBtn = document.getElementById('award-next');
  const closingMsg = document.getElementById('award-closing-msg');
  
  let finalMessageShown = false;

  nextBtn?.addEventListener('click', () => {
    if (!finalMessageShown) {
      finalMessageShown = true;
      nextBtn.innerHTML = "Finish Experience ✨";
      closingMsg?.classList.add('visible');
      // scroll to bottom
      const scrollArea = document.querySelector('.award-scroll-area');
      if (scrollArea) {
        setTimeout(() => {
          scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    } else {
      showScene('s-end', 'forward');
    }
  });
}

function fireConfetti() {
  const canvas = document.getElementById('award-confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // Set dimensions dynamically based on parent container
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  
  const pieces = [];
  const colors = ['#E8C547', '#E8728A', '#F2A6C4', '#FFF9C4', '#FFB3C6'];
  for (let i = 0; i < 150; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height, // start above
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 5 + 3,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotSpeed;
      if (p.y < canvas.height) active = true;
      
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      ctx.restore();
    });
    if (active) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
}

/* ──────────────────────────────────────────────────────────
   END / REPLAY
   ────────────────────────────────────────────────────────── */
function initEndScreen() {
  document.getElementById('replay-btn')?.addEventListener('click', () => {
    resetPasscode();
    photoRevealDone = false;
    letterTyped = false;
    pauseMusic();
    isPlaying = false;

    const caption = document.getElementById('photo-caption');
    if (caption) caption.textContent = '';

    showScene('s-passcode', 'back');
  });
}

/* ──────────────────────────────────────────────────────────
   SCREEN READER ANNOUNCER
   ────────────────────────────────────────────────────────── */
function announceToSR(message) {
  let el = document.getElementById('sr-announcer');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sr-announcer';
    el.className = 'sr-only';
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('aria-atomic', 'true');
    document.body.appendChild(el);
  }
  el.textContent = '';
  setTimeout(() => { el.textContent = message; }, 50);
}

/* ──────────────────────────────────────────────────────────
   AESTHETIC FLOATING PETALS ENGINE
   ────────────────────────────────────────────────────────── */
function startFallingPetals() {
  const container = document.getElementById('petals-container');
  if (!container) return;

  const colors = ['#F2A6C4', '#E8728A', '#FFB3C6', '#FFF0F2'];

  setInterval(() => {
    if (document.hidden) return;
    
    const petal = document.createElement('div');
    petal.className = 'petal';
    const size = Math.random() * 12 + 6;
    
    petal.style.width = `${size}px`;
    petal.style.height = `${size}px`;
    petal.style.background = colors[Math.floor(Math.random() * colors.length)];
    petal.style.borderRadius = '50% 0 50% 50%';
    petal.style.left = `${Math.random() * 100}vw`;
    petal.style.animationDuration = `${Math.random() * 5 + 5}s`;
    
    container.appendChild(petal);

    setTimeout(() => {
      petal.remove();
    }, 10000);
  }, 400);
}

/* ──────────────────────────────────────────────────────────
   TOUCH SWIPE NAVIGATION (mobile)
   ────────────────────────────────────────────────────────── */
function initSwipeNav() {
  let startX = 0;
  let startY = 0;
  const threshold = 60;

  const swipeAllowed = PAGINATED_SCENES;

  document.getElementById('app').addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  document.getElementById('app').addEventListener('touchend', e => {
    if (!swipeAllowed.includes(currentScene)) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;

    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return;

    const idx = PAGINATED_SCENES.indexOf(currentScene);
    if (dx < 0 && idx < PAGINATED_SCENES.length - 1) {
      showScene(PAGINATED_SCENES[idx + 1], 'forward');
    } else if (dx > 0 && idx > 0) {
      showScene(PAGINATED_SCENES[idx - 1], 'back');
    }
  }, { passive: true });
}

/* ──────────────────────────────────────────────────────────
   KEYBOARD GLOBAL NAVIGATION
   ────────────────────────────────────────────────────────── */
function initKeyboardNav() {
  document.addEventListener('keydown', e => {
    if (currentScene === 's-passcode' || currentScene === 's-wrong') return;

    const idx = PAGINATED_SCENES.indexOf(currentScene);
    if (e.key === 'ArrowRight' && idx < PAGINATED_SCENES.length - 1) {
      showScene(PAGINATED_SCENES[idx + 1], 'forward');
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      showScene(PAGINATED_SCENES[idx - 1], 'back');
    }
  });
}

/* ──────────────────────────────────────────────────────────
   INIT — ENTRY POINT
   ────────────────────────────────────────────────────────── */
function init() {
  document.querySelectorAll('.scene').forEach(s => {
    if (!s.classList.contains('active')) {
      s.style.transform = 'translateX(100%)';
    }
  });

  buildPaginationDots();
  updatePaginationDots();

  renderLetter();
  renderJar();
  renderPhotos();
  renderAward();

  initPasscode();
  initWrongScreen();
  initSurpriseScreen();
  initHubs();
  initLetterNav();
  initJarNav();
  initMusicPlayer();
  initPhotosNav();
  initAwardNav();
  initEndScreen();
  initSwipeNav();
  initKeyboardNav();
  
  startFallingPetals();

  console.log('💕 Romantic website initialized. Passcode is configured in js/config.js');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
