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
      // Keep a managed object structure
      pools.set(name, {
        instances: [audio],
        maxInstances: name === "countdown" ? 1 : 4, // FORCE countdown to only ever have ONE element
      });
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

  for (const poolObj of pools.values()) {
    const audio = poolObj.instances[0];
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
  const poolObj = pools.get(name);
  if (!poolObj) return;

  const { instances, maxInstances } = poolObj;

  // 1. If it's a countdown, forcefully stop any existing countdown track immediately
  if (name === "countdown") {
    const singleInstance = instances[0];
    singleInstance.pause(); // Explicitly kill audio decoding
    singleInstance.currentTime = 0; // Rewind completely
    singleInstance.play().catch((e) => console.log("Playback interrupted:", e));
    return;
  }

  // 2. Standard Polyphonic handling for regular game actions (attack, wrong, victory)
  let audio = instances.find((a) => a.paused || a.ended);

  if (!audio) {
    if (instances.length < maxInstances) {
      audio = instances[0].cloneNode();
      audio.preload = "auto";
      instances.push(audio);
    } else {
      // Rotate back to the oldest instance to avoid overflowing the browser buffer
      audio = instances.shift();
      instances.push(audio);
    }
  }

  // Ensure clean termination before restarting polyphonic audio tracks
  try {
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (err) {
    // Catch silent errors if DOM is not fully interacted with yet
  }
}
