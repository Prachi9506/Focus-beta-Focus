// Content script for Focus Lock extension

let blockCheckInterval;
let isPageBlocked = false;

// Initialize content script
(function init() {
  // Check if this page should be blocked
  checkIfBlocked();
  
  // Set up periodic checking
  blockCheckInterval = setInterval(checkIfBlocked, 2000);
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'pageBlocked') {
      showBlockedPage(message.site);
    }
  });
})();

async function checkIfBlocked() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'shouldBlock' });
    
    if (response && response.shouldBlock) {
      const hostname = window.location.hostname.replace('www.', '');
      const { blockedSites } = await chrome.runtime.sendMessage({ action: 'getState' });
      
      if (blockedSites && blockedSites.some(site => hostname.includes(site))) {
        if (!isPageBlocked) {
          showBlockedPage(hostname);
        }
      }
    }
  } catch (error) {
    console.log('Focus Beta Focus: Error checking block status', error);
  }
}

function showBlockedPage(site) {
  if (isPageBlocked) return;
  
  isPageBlocked = true;
  clearInterval(blockCheckInterval);
  
  // Hide original content
  document.documentElement.style.display = 'none';
  
  // Create blocked page overlay
  const blockedOverlay = document.createElement('div');
  blockedOverlay.id = 'focus-lock-overlay';
  blockedOverlay.innerHTML = `
    <div class="focus-lock-container">
      <div class="focus-lock-content">
        <div class="focus-lock-icon">🔒</div>
        <h1>Focus Mode Active</h1>
        <p class="site-name">${site} is blocked during your focus hours</p>
        
        <div class="motivation-quote">
          <p id="quote-text">"This urge will pass. Greatness won't."</p>
        </div>
        
        <div class="focus-stats">
          <div class="stat">
            <span class="stat-number" id="streak-count">0</span>
            <span class="stat-label">Day Streak</span>
          </div>
          <div class="stat">
            <span class="stat-number" id="time-saved">2.5h</span>
            <span class="stat-label">Time Saved</span>
          </div>
        </div>
        
        <div class="actions">
          <button id="go-back-btn" class="primary-btn">
            ← Return to Focus
          </button>
          <button id="emergency-override" class="danger-btn">
            Emergency Override
          </button>
        </div>
        
        <div id="override-countdown" class="override-section" style="display: none;">
          <h3>⚠️ Are you sure this is urgent?</h3>
          <p>Think carefully. This will break your streak.</p>
          <div class="countdown-timer">
            <span id="countdown-number">10</span>
            <p>seconds to reflect...</p>
          </div>
          <div class="countdown-actions">
            <button id="cancel-override" class="secondary-btn">Cancel & Stay Focused</button>
            <button id="confirm-override" class="danger-btn" disabled>Break Streak & Continue</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(blockedOverlay);
  
  // Load and display current streak
  loadFocusStats();
  
  // Set up event listeners
  setupBlockedPageEvents();
  
  // Show random motivational quote
  showRandomQuote();
}

async function loadFocusStats() {
  try {
    const state = await chrome.runtime.sendMessage({ action: 'getState' });
    if (state) {
      document.getElementById('streak-count').textContent = state.streakCount || 0;
    }
  } catch (error) {
    console.log('Error loading focus stats:', error);
  }
}

function setupBlockedPageEvents() {
  const goBackBtn = document.getElementById('go-back-btn');
  const emergencyBtn = document.getElementById('emergency-override');
  const cancelBtn = document.getElementById('cancel-override');
  const confirmBtn = document.getElementById('confirm-override');
  const countdownSection = document.getElementById('override-countdown');
  
  goBackBtn.addEventListener('click', () => {
    window.history.back();
  });
  
  emergencyBtn.addEventListener('click', () => {
    countdownSection.style.display = 'block';
    startOverrideCountdown();
  });
  
  cancelBtn.addEventListener('click', () => {
    countdownSection.style.display = 'none';
    showCelebration('Great choice! Your streak continues! 🎉');
  });
  
  confirmBtn.addEventListener('click', async () => {
    try {
      await chrome.runtime.sendMessage({ action: 'breakStreak' });
      document.documentElement.style.display = 'block';
      document.getElementById('focus-lock-overlay').remove();
    } catch (error) {
      console.log('Error breaking streak:', error);
    }
  });
}

function startOverrideCountdown() {
  let countdown = 10;
  const countdownElement = document.getElementById('countdown-number');
  const confirmBtn = document.getElementById('confirm-override');
  
  const timer = setInterval(() => {
    countdown--;
    countdownElement.textContent = countdown;
    
    if (countdown <= 0) {
      clearInterval(timer);
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Proceed (Streak will be lost)';
      countdownElement.textContent = '⏰';
    }
  }, 1000);
}

function showRandomQuote() {
  const quotes = [
    "This urge will pass. Greatness won't.",
    "You're 15 minutes away from breaking focus. Don't.",
    "Every 'no' to distraction is a 'yes' to your dreams.",
    "Your future self will thank you for this discipline.",
    "Focus is the bridge between goals and accomplishment.",
    "Discipline is choosing between what you want now and what you want most.",
    "The successful warrior is the average person with laser-like focus.",
    "Where focus goes, energy flows and results show."
  ];
  
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  const quoteElement = document.getElementById('quote-text');
  if (quoteElement) {
    quoteElement.textContent = `"${randomQuote}"`;
  }
}

function showCelebration(message) {
  const celebration = document.createElement('div');
  celebration.className = 'celebration-popup';
  celebration.textContent = message;
  
  document.body.appendChild(celebration);
  
  // Add confetti effect
  createConfetti();
  
  setTimeout(() => {
    celebration.remove();
  }, 3000);
}

function createConfetti() {
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.backgroundColor = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 5)];
    confetti.style.animationDelay = Math.random() * 3 + 's';
    
    document.body.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 3000);
  }
}