 // Service Worker for Focus Beta Focus Chrome Extension

let focusState = {
  isActive: false,
  blockedSites: [],
  schedule: null, 
  streakCount: 0, 
  lastFocusDate: null 
};

// Initialize extension 
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Focus Beta Focus installed');
  
  // Load saved data
  try {
    const data = await chrome.storage.local.get([
      'blockedSites', 
      'schedule', 
      'streakCount', 
      'lastFocusDate',
      'isActive'
    ]);
    
    focusState = {
      isActive: data.isActive || false,
      blockedSites: data.blockedSites || ['youtube.com', 'twitter.com', 'instagram.com', 'facebook.com', 'reddit.com', 'netflix.com'],
      schedule: data.schedule || { start: '09:00', end: '17:00', enabled: true },
      streakCount: data.streakCount || 0,
      lastFocusDate: data.lastFocusDate || null
    };
    
    console.log('Initial state loaded:', focusState);
    
    // Set up daily streak check
    chrome.alarms.create('dailyStreakCheck', { 
      when: Date.now() + 1000,
      periodInMinutes: 60 
    });
    
    updateBlockingRules();
  } catch (error) {
    console.log('Error during initialization:', error);
  }
});

// Handle alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyStreakCheck') {
    checkAndUpdateStreak();
  }
});

// Update blocking rules based on current state
async function updateBlockingRules() {
  try {
    const shouldBlock = await shouldBlockNow();
    console.log('Should block now:', shouldBlock, 'Focus active:', focusState.isActive);
    
    if (shouldBlock && focusState.isActive) {
      const rules = focusState.blockedSites.map((site, index) => ({
        id: index + 1,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: {
            url: chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(site)
          }
        },
        condition: {
          urlFilter: `*://*.${site}/*`,
          resourceTypes: ['main_frame']
        }
      }));
      
      console.log('Adding blocking rules:', rules);
      
      // Clear existing rules and add new ones
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: Array.from({length: 100}, (_, i) => i + 1),
        addRules: rules
      });
    } else {
      console.log('Removing all blocking rules');
      // Remove all blocking rules
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: Array.from({length: 100}, (_, i) => i + 1)
      });
    }
  } catch (error) {
    console.log('Error updating blocking rules:', error);
  }
}

// Check if we should block based on time schedule
async function shouldBlockNow() {
  if (!focusState.schedule || !focusState.schedule.enabled) return false;
  
  const now = new Date();
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                     now.getMinutes().toString().padStart(2, '0');
  
  return currentTime >= focusState.schedule.start && currentTime <= focusState.schedule.end;
}

// Check and update streak
async function checkAndUpdateStreak() {
  try {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (focusState.lastFocusDate === yesterday) {
      // Continue streak
      focusState.streakCount += 1;
    } else if (focusState.lastFocusDate !== today) {
      // Reset streak if missed a day
      focusState.streakCount = 0;
    }
    
    focusState.lastFocusDate = today;
    
    // Save to storage
    await chrome.storage.local.set({
      streakCount: focusState.streakCount,
      lastFocusDate: focusState.lastFocusDate
    });
    
    updateBlockingRules();
  } catch (error) {
    console.log('Error updating streak:', error);
  }
}

// Listen for messages from popup/content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.action) {
    case 'getState':
      console.log('Sending state:', focusState);
      sendResponse(focusState);
      break;
      
    case 'updateSettings':
      focusState = { ...focusState, ...message.data };
      chrome.storage.local.set(message.data);
      updateBlockingRules();
      sendResponse({ success: true });
      break;
      
    case 'toggleFocus':
      focusState.isActive = !focusState.isActive;
      console.log('Focus toggled to:', focusState.isActive);
      chrome.storage.local.set({ isActive: focusState.isActive });
      updateBlockingRules();
      sendResponse({ isActive: focusState.isActive });
      break;
      
    case 'breakStreak':
      focusState.streakCount = 0;
      chrome.storage.local.set({ streakCount: 0 });
      sendResponse({ streakCount: 0 });
      break;
      
    case 'shouldBlock':
      shouldBlockNow().then(result => {
        sendResponse({ shouldBlock: result && focusState.isActive });
      });
      return true; // Keep message channel open for async response
  }
});

// Update rules when storage changes
chrome.storage.onChanged.addListener((changes) => {
  let needsUpdate = false;
  
  for (let key in changes) {
    if (key in focusState) {
      focusState[key] = changes[key].newValue;
      needsUpdate = true;
    }
  }
  
  if (needsUpdate) {
    console.log('Storage changed, updating rules');
    updateBlockingRules();
  }
});
