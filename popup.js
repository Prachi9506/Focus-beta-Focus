// Focus Beta Focus Popup Script

let state = {
  isActive: false,
  streakCount: 0,
  schedule: { start: '09:00', end: '23:59', enabled: true },
  pomodoroTime: 25 * 60, // 25 minutes in seconds
  pomodoroInterval: null,
  isPomodoroActive: false
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Focus Beta Focus popup loaded');
  await loadState();
  updateUI();
  setupEventListeners();
  showRandomQuote();
});

// Load state from background script
async function loadState() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getState' });
    if (response) {
      state = { ...state, ...response };
      console.log('State loaded:', state);
    }
  } catch (error) {
    console.log('Error loading state:', error);
  }
}

// Update UI elements
function updateUI() {
  // Update status indicator
  const statusIndicator = document.getElementById('status-indicator');
  const statusDot = statusIndicator.querySelector('.status-dot');
  const statusText = statusIndicator.querySelector('.status-text');
  
  if (state.isActive) {
    statusDot.classList.remove('inactive');
    statusText.textContent = 'Focus Active';
  } else {
    statusDot.classList.add('inactive');
    statusText.textContent = 'Focus Off';
  }
  
  // Update streak count
  document.getElementById('streak-count').textContent = state.streakCount || 0;
  
  // Update toggle button
  const toggleBtn = document.getElementById('toggle-focus');
  const toggleText = toggleBtn.querySelector('.toggle-text');
  const toggleIcon = toggleBtn.querySelector('.toggle-icon');
  
  if (state.isActive) {
    toggleBtn.classList.add('active');
    toggleText.textContent = 'Stop Focus Mode';
    toggleIcon.textContent = '🛑';
  } else {
    toggleBtn.classList.remove('active');
    toggleText.textContent = 'Start Focus Mode';
    toggleIcon.textContent = '🎯';
  }
  
  // Update schedule display
  if (state.schedule) {
    const scheduleDisplay = document.getElementById('schedule-display');
    const scheduleTime = scheduleDisplay.querySelector('.schedule-time');
    const scheduleStatus = scheduleDisplay.querySelector('.schedule-status');
    
    const startTime = formatTime(state.schedule.start);
    const endTime = formatTime(state.schedule.end);
    scheduleTime.textContent = `${startTime} - ${endTime}`;
    
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');
    
    if (state.schedule.enabled && currentTime >= state.schedule.start && currentTime <= state.schedule.end) {
      scheduleStatus.textContent = 'Active';
      scheduleStatus.style.color = '#48bb78';
      scheduleStatus.style.background = 'rgba(72, 187, 120, 0.1)';
    } else {
      scheduleStatus.textContent = 'Inactive';
      scheduleStatus.style.color = '#718096';
      scheduleStatus.style.background = 'rgba(113, 128, 150, 0.1)';
    }
  }
}

// Setup event listeners
function setupEventListeners() {
  console.log('Setting up event listeners');
  
  // Toggle focus mode
  const toggleBtn = document.getElementById('toggle-focus');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('Toggle focus clicked');
      try {
        const response = await chrome.runtime.sendMessage({ action: 'toggleFocus' });
        if (response) {
          state.isActive = response.isActive;
          updateUI();
          
          if (state.isActive) {
            showNotification('Focus mode activated! 🎯', 'success');
          } else {
            showNotification('Focus mode deactivated', 'info');
          }
        }
      } catch (error) {
        console.log('Error toggling focus:', error);
        showNotification('Error toggling focus mode', 'error');
      }
    });
  }
  
  // Pomodoro button
  const pomodoroBtn = document.getElementById('pomodoro-btn');
  if (pomodoroBtn) {
    pomodoroBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Pomodoro clicked');
      const pomodoroSection = document.getElementById('pomodoro-section');
      if (pomodoroSection) {
        pomodoroSection.style.display = pomodoroSection.style.display === 'none' ? 'block' : 'none';
      }
    });
  }
  
  // Close pomodoro
  const closePomodoroBtn = document.getElementById('close-pomodoro');
  if (closePomodoroBtn) {
    closePomodoroBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('pomodoro-section').style.display = 'none';
    });
  }
  
  // Pomodoro timer controls
  const startTimerBtn = document.getElementById('start-timer');
  if (startTimerBtn) {
    startTimerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      startPomodoro();
    });
  }
  
  const pauseTimerBtn = document.getElementById('pause-timer');
  if (pauseTimerBtn) {
    pauseTimerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      pausePomodoro();
    });
  }
  
  const resetTimerBtn = document.getElementById('reset-timer');
  if (resetTimerBtn) {
    resetTimerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetPomodoro();
    });
  }
  
  // Settings button
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Settings clicked');
      chrome.runtime.openOptionsPage();
    });
  }
  
  // Blocked sites button
  const blockedSitesBtn = document.getElementById('blocked-sites-btn');
  if (blockedSitesBtn) {
    blockedSitesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Blocked sites clicked');
      chrome.runtime.openOptionsPage();
    });
  }
  
  // Edit schedule button
  const editScheduleBtn = document.getElementById('edit-schedule');
  if (editScheduleBtn) {
    editScheduleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Edit schedule clicked');
      chrome.runtime.openOptionsPage();
    });
  }
}

// Pomodoro timer functions
function startPomodoro() {
  if (state.pomodoroInterval) return;
  
  state.isPomodoroActive = true;
  state.pomodoroInterval = setInterval(() => {
    state.pomodoroTime--;
    updatePomodoroDisplay();
    
    if (state.pomodoroTime <= 0) {
      completePomodoroSession();
    }
  }, 1000);
  
  const startBtn = document.getElementById('start-timer');
  if (startBtn) startBtn.disabled = true;
}

function pausePomodoro() {
  if (state.pomodoroInterval) {
    clearInterval(state.pomodoroInterval);
    state.pomodoroInterval = null;
    state.isPomodoroActive = false;
    const startBtn = document.getElementById('start-timer');
    if (startBtn) startBtn.disabled = false;
  }
}

function resetPomodoro() {
  pausePomodoro();
  state.pomodoroTime = 25 * 60;
  updatePomodoroDisplay();
}

function updatePomodoroDisplay() {
  const minutes = Math.floor(state.pomodoroTime / 60);
  const seconds = state.pomodoroTime % 60;
  const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const timerDisplay = document.getElementById('timer-display');
  if (timerDisplay) {
    timerDisplay.textContent = display;
  }
}

function completePomodoroSession() {
  pausePomodoro();
  state.pomodoroTime = 25 * 60;
  updatePomodoroDisplay();
  
  showNotification('Pomodoro session complete! 🍅 Take a break!', 'success');
}

// Utility functions
function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':');
  const hour24 = parseInt(hours);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes} ${ampm}`;
}

function showRandomQuote() {
  const quotes = [
    "Focus is the bridge between goals and accomplishment.",
    "Discipline is choosing between what you want now and what you want most.",
    "Your future self will thank you for this discipline.",
    "Every 'no' to distraction is a 'yes' to your dreams.",
    "The successful warrior is the average person with laser-like focus.",
    "Where focus goes, energy flows and results show.",
    "Focus on being productive instead of busy.",
    "Concentration is the secret of strength."
  ];
  
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  const quoteElement = document.getElementById('motivation-quote');
  if (quoteElement) {
    quoteElement.textContent = `"${randomQuote}"`;
  }
}

function showNotification(message, type = 'info') {
  console.log(`Notification: ${message} (${type})`);
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#fc8181' : '#3182ce'};
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-weight: 600;
    z-index: 1000;
    font-size: 12px;
    max-width: 200px;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}
