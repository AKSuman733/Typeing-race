document.addEventListener('DOMContentLoaded', () => {
  const hackToggle = document.getElementById('hack-toggle');
  const statusDisplay = document.getElementById('status-display');
  const delaySlider = document.getElementById('delay-slider');
  const delayVal = document.getElementById('delay-val');
  const speedCards = document.querySelectorAll('.speed-card');
  const rigStatus = document.getElementById('rig-status');

  let currentSpeed = 'instant';
  let currentDelay = 0;

  // Initialize UI from local storage
  chrome.storage.local.get(['isEnabled', 'speed', 'delay'], (data) => {
    // 1. Sync Toggle Switch
    const isEnabled = !!data.isEnabled;
    hackToggle.checked = isEnabled;
    updateStatusDisplay(isEnabled);

    // 2. Sync Speed Button Grid
    if (data.speed) {
      currentSpeed = data.speed;
      speedCards.forEach(card => {
        if (card.getAttribute('data-speed') === currentSpeed) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });
    }

    // 3. Sync Delay Slider
    if (data.delay !== undefined) {
      currentDelay = parseInt(data.delay, 10);
      delaySlider.value = currentDelay;
      delayVal.textContent = `${currentDelay}ms`;
    }
  });

  // Check connection to active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getStatus" }, (response) => {
        if (chrome.runtime.lastError || !response) {
          rigStatus.textContent = "● STANDBY (OPEN GAME)";
          rigStatus.className = "inactive-dot";
        } else {
          rigStatus.textContent = "● SYNCED WITH GAME";
          rigStatus.className = "active-dot";
          
          // Double sync switch state with content script
          hackToggle.checked = response.isEnabled;
          updateStatusDisplay(response.isEnabled);
        }
      });
    }
  });

  // Toggle switch listener
  hackToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    updateStatusDisplay(isEnabled);

    // Save to local storage
    chrome.storage.local.set({ isEnabled }, () => {
      // Notify active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "toggle" });
        }
      });
    });
  });

  // Speed selection cards listener
  speedCards.forEach(card => {
    card.addEventListener('click', () => {
      // Visual feedback
      speedCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const speed = card.getAttribute('data-speed');
      currentSpeed = speed;

      // Save speed setting
      chrome.storage.local.set({ speed });
    });
  });

  // Delay slider listener
  delaySlider.addEventListener('input', (e) => {
    const delay = parseInt(e.target.value, 10);
    currentDelay = delay;
    delayVal.textContent = `${delay}ms`;
    
    // Save delay setting
    chrome.storage.local.set({ delay });
  });

  // Helper to update visual text and color for status
  function updateStatusDisplay(active) {
    if (active) {
      statusDisplay.textContent = 'ACTIVE';
      statusDisplay.className = 'status-value active';
    } else {
      statusDisplay.textContent = 'INACTIVE';
      statusDisplay.className = 'status-value inactive';
    }
  }
});
