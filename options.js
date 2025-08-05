// Focus Beta Focus Options Page Script

let settings = {
  blockedSites: ['youtube.com', 'twitter.com', 'instagram.com', 'facebook.com', 'reddit.com', 'netflix.com'],
  schedule: { start: '09:00', end: '17:00', enabled: true },
  showQuotes: true,
  showStats: true,
  celebrationEffects: true,
  overrideCountdown: 10,
  breakStreakWarning: true,
  streakCount: 0,
  bestStreak: 0,
  totalTimeSaved: 0,
  blocksToday: 0
};

// Initialize options page
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Options page loaded');
  await loadSettings();
  updateUI();
  setupEventListeners();
});

// Load settings from chrome storage
async function loadSettings() {
  try {
    const stored = await chrome.storage.local.get([
      'blockedSites', 'schedule', 'showQuotes', 'showStats', 
      'celebrationEffects', 'overrideCountdown', 'breakStreakWarning',
      'streakCount', 'bestStreak', 'totalTimeSaved', 'blocksToday'
    ]);
    
    settings = { ...settings, ...stored };
    console.log('Settings loaded:', settings);
  } catch (error) {
    console.log('Error loading settings:', error);
  }
}

// Update UI with current settings
function updateUI() {
  // Schedule settings
  const scheduleEnabled = document.getElementById('schedule-enabled');
  const startTime = document.getElementById('start-time');
  const endTime = document.getElementById('end-time');
  
  if (scheduleEnabled) scheduleEnabled.checked = settings.schedule.enabled;
  if (startTime) startTime.value = settings.schedule.start;
  if (endTime) endTime.value = settings.schedule.end;
  
  // Motivation settings
  const showQuotes = document.getElementById('show-quotes');
  const showStats = document.getElementById('show-stats');
  const celebrationEffects = document.getElementById('celebration-effects');
  
  if (showQuotes) showQuotes.checked = settings.showQuotes;
  if (showStats) showStats.checked = settings.showStats;
  if (celebrationEffects) celebrationEffects.checked = settings.celebrationEffects;
  
  // Override settings
  const overrideCountdown = document.getElementById('override-countdown');
  const breakStreakWarning = document.getElementById('break-streak-warning');
  
  if (overrideCountdown) overrideCountdown.value = settings.overrideCountdown;
  if (breakStreakWarning) breakStreakWarning.checked = settings.breakStreakWarning;
  
  // Update blocked sites list
  updateSitesList();
  
  // Update statistics
  updateStatistics();
}

// Update blocked sites list display
function updateSitesList() {
  const sitesList = document.getElementById('sites-list');
  if (!sitesList) return;
  
  if (settings.blockedSites.length === 0) {
    sitesList.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">No sites blocked yet. Add some sites to get started!</p>';
    return;
  }
  
  sitesList.innerHTML = settings.blockedSites.map(site => `
    <div class="site-item">
      <span class="site-name">${site}</span>
      <button class="remove-site-btn" data-site="${site}">×</button>
    </div>
  `).join('');
  
  // Add event listeners to remove buttons
  sitesList.querySelectorAll('.remove-site-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      removeSite(e.target.dataset.site);
    });
  });
}

// Update statistics display
function updateStatistics() {
  const currentStreak = document.getElementById('current-streak');
  const bestStreak = document.getElementById('best-streak');
  const totalTime = document.getElementById('total-time');
  const blocksToday = document.getElementById('blocks-today');
  
  if (currentStreak) currentStreak.textContent = settings.streakCount || 0;
  if (bestStreak) bestStreak.textContent = settings.bestStreak || 0;
  if (totalTime) totalTime.textContent = formatTime(settings.totalTimeSaved || 0);
  if (blocksToday) blocksToday.textContent = settings.blocksToday || 0;
}

// Setup event listeners
function setupEventListeners() {
  console.log('Setting up options event listeners');
  
  // Add site functionality
  const addSiteBtn = document.getElementById('add-site-btn');
  const newSiteInput = document.getElementById('new-site-input');
  
  if (addSiteBtn) {
    addSiteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const site = newSiteInput.value.trim().toLowerCase();
      if (site) {
        addSite(site);
        newSiteInput.value = '';
      }
    });
  }
  
  if (newSiteInput) {
    newSiteInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const site = newSiteInput.value.trim().toLowerCase();
        if (site) {
          addSite(site);
          newSiteInput.value = '';
        }
      }
    });
  }
  
  // Preset site buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      addSite(btn.dataset.site);
    });
  });
  
  // Save settings button
  const saveBtn = document.getElementById('save-settings');
  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      saveSettings();
    });
  }
  
  // Reset statistics button
  const resetStatsBtn = document.getElementById('reset-stats-btn');
  if (resetStatsBtn) {
    resetStatsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
        resetStatistics();
      }
    });
  }
  
  // Export data button
  const exportBtn = document.getElementById('export-data-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', (e) => {
      e.preventDefault();
      exportData();
    });
  }
  
  // Auto-save on input changes
  document.querySelectorAll('input[type="checkbox"], input[type="time"], input[type="number"]').forEach(input => {
    input.addEventListener('change', debounce(saveSettings, 1000));
  });
}

// Add a site to blocked list
function addSite(site) {
  // Clean up the site URL
  site = site.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  
  if (!site || settings.blockedSites.includes(site)) {
    showStatus('Site already in list or invalid', 'error');
    return;
  }
  
  // Validate domain format
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
  if (!domainRegex.test(site)) {
    showStatus('Please enter a valid domain (e.g., youtube.com)', 'error');
    return;
  }
  
  settings.blockedSites.push(site);
  updateSitesList();
  showStatus(`Added ${site} to blocked list`, 'success');
}

// Remove a site from blocked list
function removeSite(site) {
  settings.blockedSites = settings.blockedSites.filter(s => s !== site);
  updateSitesList();
  showStatus(`Removed ${site} from blocked list`, 'success');
}

// Save all settings
async function saveSettings() {
  try {
    // Collect all settings from form
    const newSettings = {
      blockedSites: settings.blockedSites,
      schedule: {
        enabled: document.getElementById('schedule-enabled')?.checked || false,
        start: document.getElementById('start-time')?.value || '09:00',
        end: document.getElementById('end-time')?.value || '17:00'
      },
      showQuotes: document.getElementById('show-quotes')?.checked || false,
      showStats: document.getElementById('show-stats')?.checked || false,
      celebrationEffects: document.getElementById('celebration-effects')?.checked || false,
      overrideCountdown: parseInt(document.getElementById('override-countdown')?.value || 10),
      breakStreakWarning: document.getElementById('break-streak-warning')?.checked || false
    };
    
    // Update local settings
    settings = { ...settings, ...newSettings };
    
    // Save to chrome storage
    await chrome.storage.local.set(newSettings);
    
    // Notify background script
    chrome.runtime.sendMessage({ 
      action: 'updateSettings', 
      data: newSettings 
    });
    
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    console.log('Error saving settings:', error);
    showStatus('Error saving settings. Please try again.', 'error');
  }
}

// Reset all statistics
async function resetStatistics() {
  try {
    const resetData = {
      streakCount: 0,
      bestStreak: 0,
      totalTimeSaved: 0,
      blocksToday: 0
    };
    
    settings = { ...settings, ...resetData };
    await chrome.storage.local.set(resetData);
    
    updateStatistics();
    showStatus('Statistics reset successfully!', 'success');
  } catch (error) {
    console.log('Error resetting statistics:', error);
    showStatus('Error resetting statistics. Please try again.', 'error');
  }
}

// Export user data
function exportData() {
  const exportData = {
    settings: settings,
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `focus-beta-focus-data-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  showStatus('Data exported successfully!', 'success');
}

// Utility functions
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function showStatus(message, type) {
  const statusElement = document.getElementById('save-status');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = `save-status ${type}`;
    
    setTimeout(() => {
      statusElement.textContent = '';
      statusElement.className = 'save-status';
    }, 3000);
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}