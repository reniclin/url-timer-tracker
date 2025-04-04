(function () {
  // State management
  const state = {
    totalSeconds: 0,
    countdownSeconds: 0,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    isPaused: false,
    isEnabled: false,
    trackedUrls: [],
    timeLimit: '00:30:00',
  };

  // DOM Elements
  let timerElement = null;
  let timerInterval = null;

  // Constants
  const TIMER_CHECK_INTERVAL = 1000;
  const DEFAULT_TIME_LIMIT = '00:30:00';
  const TIMER_STYLES = {
    container: `
      position: fixed;
      top: 20px;
      left: 20px;
      background-color: rgba(50, 50, 50, 0.9);
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-family: Arial, sans-serif;
      z-index: 2147483647;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      cursor: move;
      user-select: none;
      min-width: 180px;
    `,
    warning: `
      color: #ff4d4d;
      font-weight: bold;
      margin-top: 5px;
      border-top: 1px solid #777;
      padding-top: 5px;
    `,
  };

  // Initialize
  init();

  function init() {
    loadSettingsAndCheckUrl();
    setupEventListeners();
    console.log('URL Timer initialized');
  }

  function setupEventListeners() {
    // Settings changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        loadSettingsAndCheckUrl();
      }
    });

    // Tab visibility and cleanup
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pauseTimer();
      } else {
        resumeTimer();
      }
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      cleanup();
    });

    // URL changes (SPA support)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        checkCurrentUrl();
      }
    }).observe(document, { subtree: true, childList: true });
  }

  // Timer Management
  function loadSettingsAndCheckUrl() {
    chrome.storage.sync.get(
      ['urlList', 'timeLimit', 'isEnabled'],
      function (result) {
        const prevTimeLimit = state.timeLimit;
        state.isEnabled = result.isEnabled ?? true;
        state.timeLimit = result.timeLimit ?? DEFAULT_TIME_LIMIT;
        state.trackedUrls = parseUrlList(result.urlList);

        // Handle time limit changes for active timer
        if (timerElement && prevTimeLimit !== state.timeLimit) {
          updateTimeLimitAndDisplay();
        }

        checkCurrentUrl();
      }
    );
  }

  function parseUrlList(urlList) {
    if (!urlList) return [];
    return urlList
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url !== '');
  }

  function checkCurrentUrl() {
    if (!state.isEnabled) {
      hideTimerAndReset();
      return;
    }

    const currentUrl = window.location.href.toLowerCase();
    const matchedUrl = state.trackedUrls.find(
      (url) => url.toLowerCase() && currentUrl.includes(url.toLowerCase())
    );

    matchedUrl ? showTimerAndStart() : hideTimerAndReset();
  }

  function showTimerAndStart() {
    createOrShowTimer();
    startTimer();
  }

  function hideTimerAndReset() {
    stopTimer();
    handleReset();
    if (timerElement) {
      timerElement.style.display = 'none';
    }
  }

  function pauseTimer() {
    state.isPaused = true;
  }

  function resumeTimer() {
    if (timerElement && timerElement.style.display !== 'none') {
      state.isPaused = false;
    }
  }

  function handleReset(resetTotal = true) {
    console.log('Reset timer');
    const resetButton = timerElement.querySelector('.reset-button');
    const snoozeButton = timerElement.querySelector('.snooze-button');
    resetButton.style.display = 'none';
    snoozeButton.style.display = 'none';

    const warningElement = timerElement.querySelector('.timer-warning');
    if (warningElement) {
      warningElement.remove();
    }

    if (resetTotal) {
      resetTimerState();
    } else {
      // Only reset countdown, keep total time
      const [hours, minutes, seconds] = state.timeLimit.split(':').map(Number);
      state.countdownSeconds = hours * 3600 + minutes * 60 + seconds;
    }
    updateTimerDisplay();
  }

  function createOrShowTimer() {
    timerElement = document.querySelector('.url-timer-container');

    if (timerElement) {
      timerElement.style.display = 'block';
      return;
    }

    timerElement = document.createElement('div');
    timerElement.className = 'url-timer-container';
    timerElement.style.cssText = TIMER_STYLES.container;

    const elements = createTimerContent();

    // Append all elements in the correct order
    timerElement.appendChild(elements.header);
    timerElement.appendChild(elements.totalTime);
    timerElement.appendChild(elements.countdown);
    timerElement.appendChild(elements.resetButton);
    timerElement.appendChild(elements.snoozeButton);

    setupTimerEventListeners();
    document.body.appendChild(timerElement);
    initializeTimer();
  }

  function createTimerContent() {
    // Create container elements
    const headerDiv = document.createElement('div');
    headerDiv.className = 'timer-header';
    headerDiv.style.cssText =
      'margin-bottom: 5px; font-weight: bold; border-bottom: 1px solid #777; padding-bottom: 5px;';
    headerDiv.textContent = 'URL Time Tracker';

    const totalTimeDiv = document.createElement('div');
    totalTimeDiv.className = 'timer-total';
    totalTimeDiv.style.margin = '5px 0';
    totalTimeDiv.textContent = 'Total Time: ';

    const totalTimeSpan = document.createElement('span');
    totalTimeSpan.className = 'total-time';
    totalTimeSpan.textContent = '00:00:00';
    totalTimeDiv.appendChild(totalTimeSpan);

    const countdownDiv = document.createElement('div');
    countdownDiv.className = 'timer-countdown';
    countdownDiv.style.margin = '5px 0';
    countdownDiv.textContent = 'Time Left: ';

    const countdownSpan = document.createElement('span');
    countdownSpan.className = 'countdown-time';
    countdownSpan.textContent = '00:00:00';
    countdownDiv.appendChild(countdownSpan);

    const resetButton = document.createElement('button');
    resetButton.className = 'reset-button';
    resetButton.style.cssText = `
      display: none;
      background-color: #2196F3;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 3px;
      margin: 5px 5px 5px 0px;
      cursor: pointer;
    `;
    resetButton.textContent = 'Reset Timer';

    const snoozeButton = document.createElement('button');
    snoozeButton.className = 'snooze-button';
    snoozeButton.style.cssText = `
      display: none;
      background-color: #4CAF50;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 3px;
      margin: 5px;
      cursor: pointer;
    `;
    snoozeButton.textContent = 'Snooze';

    return {
      header: headerDiv,
      totalTime: totalTimeDiv,
      countdown: countdownDiv,
      resetButton: resetButton,
      snoozeButton: snoozeButton,
    };
  }

  function setupTimerEventListeners() {
    const header = timerElement.querySelector('.timer-header');
    const resetButton = timerElement.querySelector('.reset-button');
    const snoozeButton = timerElement.querySelector('.snooze-button');

    header.addEventListener('mousedown', startDrag);
    resetButton.addEventListener('click', () => handleReset(true));
    snoozeButton.addEventListener('click', () => handleReset(false));
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
  }

  function initializeTimer() {
    timerElement.dataset.timeLimit = state.timeLimit;
    const [hours, minutes, seconds] = state.timeLimit.split(':').map(Number);
    state.countdownSeconds = hours * 3600 + minutes * 60 + seconds;
    updateTimerDisplay();
  }

  // Timer Controls
  function startTimer() {
    if (timerInterval) return;

    timerInterval = setInterval(() => {
      if (!state.isPaused) {
        state.totalSeconds++;
        if (state.countdownSeconds > 0) {
          state.countdownSeconds--;
          if (state.countdownSeconds === 0) {
            showTimeUpWarning();
          }
        }
        updateTimerDisplay();
      }
    }, TIMER_CHECK_INTERVAL);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    resetTimerState();
  }

  function resetTimerState() {
    state.totalSeconds = 0;
    const [hours, minutes, seconds] = state.timeLimit.split(':').map(Number);
    state.countdownSeconds = hours * 3600 + minutes * 60 + seconds;
  }

  function updateTimeLimitAndDisplay() {
    const [hours, minutes, seconds] = state.timeLimit.split(':').map(Number);
    const newTotalSeconds = hours * 3600 + minutes * 60 + seconds;

    // Calculate remaining percentage of time
    const prevPercentage =
      state.countdownSeconds > 0
        ? state.countdownSeconds / (state.totalSeconds + state.countdownSeconds)
        : 0;

    // Apply the same percentage to new time limit
    state.countdownSeconds = Math.round(newTotalSeconds * prevPercentage);

    // Reset warning if time increased
    if (state.countdownSeconds > 0) {
      const warningElement = timerElement.querySelector('.timer-warning');
      if (warningElement) {
        warningElement.remove();
      }
      const resetButton = timerElement.querySelector('.reset-button');
      if (resetButton) {
        resetButton.style.display = 'none';
      }
    }

    updateTimerDisplay();
  }

  // UI Updates
  function updateTimerDisplay() {
    if (!timerElement) return;

    const totalTimeElement = timerElement.querySelector('.total-time');
    const countdownTimeElement = timerElement.querySelector('.countdown-time');

    totalTimeElement.textContent = formatTime(state.totalSeconds);
    countdownTimeElement.textContent = formatTime(state.countdownSeconds);
  }

  function showTimeUpWarning() {
    if (timerElement.querySelector('.timer-warning')) {
      return;
    }

    const warningElement = document.createElement('div');
    warningElement.className = 'timer-warning';
    warningElement.style.cssText = TIMER_STYLES.warning;
    warningElement.textContent = 'Time limit reached!';

    const resetButton = timerElement.querySelector('.reset-button');
    const snoozeButton = timerElement.querySelector('.snooze-button');

    timerElement.insertBefore(warningElement, resetButton);
    resetButton.style.display = 'inline-block';
    snoozeButton.style.display = 'inline-block';
  }

  // Drag Functionality
  function startDrag(e) {
    state.isDragging = true;
    const rect = timerElement.getBoundingClientRect();
    state.dragOffset.x = e.clientX - rect.left;
    state.dragOffset.y = e.clientY - rect.top;
    timerElement.style.opacity = '0.7';
  }

  function drag(e) {
    if (!state.isDragging) return;

    const position = calculateDragPosition(e);
    updateTimerPosition(position);
  }

  function calculateDragPosition(e) {
    const left = e.clientX - state.dragOffset.x;
    const top = e.clientY - state.dragOffset.y;

    return {
      left: Math.max(
        0,
        Math.min(window.innerWidth - timerElement.offsetWidth, left)
      ),
      top: Math.max(
        0,
        Math.min(window.innerHeight - timerElement.offsetHeight, top)
      ),
    };
  }

  function updateTimerPosition({ left, top }) {
    timerElement.style.left = `${left}px`;
    timerElement.style.right = 'auto';
    timerElement.style.top = `${top}px`;
  }

  function stopDrag() {
    if (state.isDragging) {
      state.isDragging = false;
      timerElement.style.opacity = '1';
    }
  }

  // Utilities
  function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((num) => num.toString().padStart(2, '0'))
      .join(':');
  }

  function cleanup() {
    try {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      if (timerElement) {
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
        timerElement.remove();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
})();
