const pools = new Map();
let primed = false;
let preloadPromise = null;

function createAudio(url) {
  const audio = new Audio(url);
  audio.preload = "auto";
  return audio;
}

function loadSounds(soundMap) {
  for (const [name, url] of Object.entries(soundMap)) {
    if (!pools.has(name)) {
      const audio = createAudio(url);
      audio.load();
      pools.set(name, [audio]);
    }
  }
}

export function preloadSounds(soundMap) {
  if (!preloadPromise) {
    preloadPromise = Promise.resolve().then(() => loadSounds(soundMap));
  }
  return preloadPromise;
}

export function areSoundsReady() {
  return pools.size > 0;
}

export function primeAudio() {
  if (primed || pools.size === 0) return;
  primed = true;

  for (const pool of pools.values()) {
    const audio = pool[0];
    const volume = audio.volume;
    audio.volume = 0.001;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = volume;
      })
      .catch(() => {
        audio.volume = volume;
      });
  }
}

export async function prepareAudio(soundMap) {
  await preloadSounds(soundMap);
  primeAudio();
}

export function playSound(name) {
  const pool = pools.get(name);
  if (!pool?.length) return;

  let audio = pool.find((a) => a.paused || a.ended);
  if (!audio) {
    audio = pool[0].cloneNode();
    audio.preload = "auto";
    pool.push(audio);
    while (pool.length > 4) {
      pool.pop();
    }
  }

  audio.currentTime = 0;
  audio.play().catch(() => {});
}
