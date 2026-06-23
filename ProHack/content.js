let isEnabled = false;
let lastTypedWord = "";
let checkInterval = null;
let currentTypingTimeout = null;
let hudElement = null;

// Default config
let config = {
  speed: "instant", // "instant", "superfast", "fast", "human"
  delay: 0          // delay before starting to type in ms
};

// Key map for simulated human typos
const adjacentKeys = {
  a: 'qwsz', b: 'vghn', c: 'xdfv', d: 'ersfxc', e: 'wsdr',
  f: 'rtgvcd', g: 'tyhbvf', h: 'yujnbg', i: 'ujko', j: 'uikmnh',
  k: 'ijlm', l: 'okp', m: 'njk', n: 'bhjm', o: 'iklp',
  p: 'ol', q: 'wa', r: 'edft', s: 'wedxza', t: 'rfgy',
  u: 'yhji', v: 'cfgb', w: 'qase', x: 'zsdc', y: 'tghu', z: 'asx'
};

// Load saved settings
function loadSettings(callback) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["speed", "delay", "isEnabled"], (result) => {
      if (result.speed) config.speed = result.speed;
      if (result.delay !== undefined) config.delay = parseInt(result.delay, 10);
      if (result.isEnabled !== undefined) isEnabled = result.isEnabled;
      if (callback) callback();
    });
  } else {
    if (callback) callback();
  }
}

// Save isEnabled state to sync with popup
function saveEnabledState() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ isEnabled });
  }
}

// Find input element for the game
function getGameInput() {
  // Try finding by placeholder
  let input = document.querySelector('input[placeholder="Type fast..."]');
  if (input) return input;
  
  // Sibling lookup
  const headings = Array.from(document.querySelectorAll('h2, h3'));
  const wordHeader = headings.find(h => h.textContent.trim().toUpperCase() === 'TYPE THIS WORD');
  if (wordHeader) {
    const parentContainer = wordHeader.closest('div');
    if (parentContainer) {
      input = parentContainer.querySelector('input');
      if (input) return input;
    }
  }
  
  // Generic fallback: first input in a form
  const form = document.querySelector('form.game-input-sticky') || document.querySelector('form');
  if (form) {
    input = form.querySelector('input');
    if (input) return input;
  }
  
  return document.querySelector('input[type="text"]');
}

// Find current word to type
function findCurrentWord() {
  // Method 1: Find the target heading and get next sibling
  const headings = Array.from(document.querySelectorAll('h2, h3, div'));
  const wordHeader = headings.find(h => {
    const text = h.textContent.trim().toUpperCase();
    return text === 'TYPE THIS WORD' || text === 'TYPE THIS';
  });
  
  if (wordHeader) {
    let sibling = wordHeader.nextElementSibling;
    while (sibling) {
      const text = sibling.textContent.trim();
      if (text) return text;
      sibling = sibling.nextElementSibling;
    }
  }
  
  // Method 2: Look for elements with typical class styling
  const trackingWide = document.querySelector('.tracking-wide.font-extrabold');
  if (trackingWide) {
    const text = trackingWide.textContent.trim();
    if (text) return text;
  }
  
  // Method 3: Grab based on custom anim-wrapper
  const animDiv = document.querySelector('div.font-extrabold.break-words');
  if (animDiv) {
    const text = animDiv.textContent.trim();
    if (text) return text;
  }
  
  return null;
}

// Update input value ensuring React registers it
function setReactInputValue(input, val) {
  const valueSetter = Object.getOwnPropertyDescriptor(input, 'value') || {};
  const prototype = Object.getPrototypeOf(input);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value') || {};
  
  const setter = valueSetter.set || prototypeValueSetter.set;
  if (setter && setter !== valueSetter.set) {
    setter.call(input, val);
  } else {
    input.value = val;
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

// Submit input form
function submitWord(input) {
  const form = input.closest('form');
  if (form) {
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);
  }
}

// Simulate human-like or fast typing
function simulateTyping(input, word, callback) {
  if (currentTypingTimeout) clearTimeout(currentTypingTimeout);
  
  let index = 0;
  input.value = "";
  setReactInputValue(input, "");
  
  // Speed-dependent configurations
  let baseDelay = 30; // fast
  let typoChance = 0.0;
  
  if (config.speed === "superfast") {
    baseDelay = 8;
    typoChance = 0.0;
  } else if (config.speed === "fast") {
    baseDelay = 35;
    typoChance = 0.02;
  } else if (config.speed === "human") {
    baseDelay = 70; // 70-120ms randomized later
    typoChance = 0.08; // 8% chance of typo per character
  }
  
  function typeNext() {
    if (!isEnabled) return;
    
    // Check if word changed while we were typing
    const currentWord = findCurrentWord();
    if (!currentWord || currentWord !== word) {
      input.value = "";
      setReactInputValue(input, "");
      return;
    }
    
    if (index < word.length) {
      const char = word[index];
      
      // Simulate typo
      if (config.speed === "human" && Math.random() < typoChance && char.match(/[a-z]/i)) {
        const lowerChar = char.toLowerCase();
        const typoOptions = adjacentKeys[lowerChar] || "qwerty";
        const typoChar = typoOptions[Math.floor(Math.random() * typoOptions.length)];
        
        // Type the wrong letter
        input.value += typoChar;
        setReactInputValue(input, input.value);
        
        // Wait and backspace
        const typoDelay = 100 + Math.random() * 80;
        currentTypingTimeout = setTimeout(() => {
          input.value = input.value.slice(0, -1);
          setReactInputValue(input, input.value);
          
          // Wait and type correct character
          const correctionDelay = 120 + Math.random() * 100;
          currentTypingTimeout = setTimeout(() => {
            input.value += char;
            setReactInputValue(input, input.value);
            index++;
            
            // Continue normal typing
            const delay = baseDelay + (Math.random() * baseDelay * 0.5);
            currentTypingTimeout = setTimeout(typeNext, delay);
          }, correctionDelay);
        }, typoDelay);
        
      } else {
        // Normal typing
        input.value += char;
        setReactInputValue(input, input.value);
        index++;
        
        let delay = baseDelay;
        if (config.speed === "human") {
          // Add human variation
          delay = baseDelay + (Math.random() * 60) - 20;
          // Add extra delay for spaces or punctuation
          if (char === ' ' || char === ',' || char === '.') {
            delay += 100 + Math.random() * 100;
          }
        } else if (config.speed === "fast") {
          delay = baseDelay + (Math.random() * 10) - 5;
        }
        
        currentTypingTimeout = setTimeout(typeNext, Math.max(2, delay));
      }
    } else {
      // Completed typing! Submit.
      const submitDelay = config.speed === "human" ? 50 + Math.random() * 50 : 0;
      currentTypingTimeout = setTimeout(() => {
        callback();
      }, submitDelay);
    }
  }
  
  typeNext();
}

// Main execution triggers
function handleNewWord(input, word) {
  lastTypedWord = word;
  
  if (config.speed === "instant") {
    // Instant submission
    setTimeout(() => {
      if (!isEnabled || findCurrentWord() !== word) return;
      setReactInputValue(input, word);
      submitWord(input);
    }, config.delay);
  } else {
    // Simulated typing
    setTimeout(() => {
      if (!isEnabled || findCurrentWord() !== word) return;
      simulateTyping(input, word, () => {
        submitWord(input);
      });
    }, config.delay);
  }
}

// Main polling loop
function runAutoTyper() {
  if (!isEnabled) {
    if (currentTypingTimeout) clearTimeout(currentTypingTimeout);
    return;
  }
  
  const currentWord = findCurrentWord();
  const input = getGameInput();
  
  if (currentWord && input) {
    if (currentWord !== lastTypedWord) {
      handleNewWord(input, currentWord);
    }
  } else if (!currentWord) {
    // Reset if we are no longer in a typing round
    lastTypedWord = "";
  }
}

// Toggle hack status
function toggleHack() {
  isEnabled = !isEnabled;
  saveEnabledState();
  updateHUD();
  
  if (!isEnabled && currentTypingTimeout) {
    clearTimeout(currentTypingTimeout);
    const input = getGameInput();
    if (input) {
      input.value = "";
      setReactInputValue(input, "");
    }
  }
  
  // Play subtle feedback sound
  playFeedbackBeep(isEnabled);
}

// Listen for Ctrl+Shift+H and toggle
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.code === 'KeyH') {
    e.preventDefault();
    toggleHack();
  }
});

// Play audio feedback (synthetic beep)
function playFeedbackBeep(active) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (active) {
      // High pitch double-beep for active
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.start();
      
      setTimeout(() => {
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      }, 80);
      
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      oscillator.stop(audioCtx.currentTime + 0.25);
    } else {
      // Lower pitch single-beep for inactive
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(350, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      oscillator.stop(audioCtx.currentTime + 0.3);
    }
  } catch (err) {
    // Audio context blocker fallback - ignore safely
  }
}

// Create page floating HUD
function createHUD() {
  if (document.getElementById('prohack-hud')) return;
  
  hudElement = document.createElement('div');
  hudElement.id = 'prohack-hud';
  hudElement.className = isEnabled ? 'active' : 'inactive';
  
  const indicator = document.createElement('div');
  indicator.id = 'prohack-indicator';
  
  const textContainer = document.createElement('div');
  textContainer.style.display = 'flex';
  textContainer.style.flexDirection = 'column';
  textContainer.style.gap = '2px';
  
  const title = document.createElement('span');
  title.id = 'prohack-title';
  title.textContent = 'ProHack';
  
  const status = document.createElement('span');
  status.id = 'prohack-status';
  status.textContent = isEnabled ? 'ACTIVE' : 'INACTIVE';
  
  textContainer.appendChild(title);
  textContainer.appendChild(status);
  
  const details = document.createElement('span');
  details.id = 'prohack-details';
  
  hudElement.appendChild(indicator);
  hudElement.appendChild(textContainer);
  hudElement.appendChild(details);
  
  document.body.appendChild(hudElement);
}

// Update HUD texts and visual classes
function updateHUD() {
  if (!hudElement) {
    createHUD();
  }
  
  hudElement = document.getElementById('prohack-hud');
  if (!hudElement) return;
  
  hudElement.className = isEnabled ? 'active' : 'inactive';
  
  const status = document.getElementById('prohack-status');
  if (status) {
    status.textContent = isEnabled ? 'ACTIVE' : 'INACTIVE';
  }
  
  const details = document.getElementById('prohack-details');
  if (details) {
    const speedText = config.speed.toUpperCase();
    const delayText = config.delay > 0 ? ` +${config.delay}ms` : '';
    details.textContent = `${speedText}${delayText}`;
  }
}

// Listen for updates from Extension storage / popup
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes.speed) config.speed = changes.speed.newValue;
      if (changes.delay !== undefined) config.delay = parseInt(changes.delay.newValue, 10);
      if (changes.isEnabled !== undefined) {
        const val = changes.isEnabled.newValue;
        if (val !== isEnabled) {
          isEnabled = val;
          updateHUD();
          playFeedbackBeep(isEnabled);
        }
      }
      updateHUD();
    }
  });
}

// Message receiver from popup
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle") {
      toggleHack();
      sendResponse({ isEnabled });
    } else if (request.action === "getStatus") {
      sendResponse({ isEnabled, config });
    }
  });
}

// Initialize
loadSettings(() => {
  createHUD();
  updateHUD();
  
  // Set up polling loop
  checkInterval = setInterval(runAutoTyper, 30);
});
