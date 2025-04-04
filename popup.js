document.addEventListener('DOMContentLoaded', function () {
  // Cache DOM elements
  const elements = {
    urlEditor: document.getElementById('urlEditor'),
    timeLimit: document.getElementById('timeLimit'),
    toggleTracking: document.getElementById('toggleTracking'),
    saveButton: document.getElementById('saveButton'),
    addCurrentButton: document.getElementById('addCurrentButton'),
    validationError: document.getElementById('validationError'),
  };

  // Constants
  const DEFAULT_TIME_LIMIT = '00:30:00';
  const SAVE_FEEDBACK_DURATION = 1500;
  const INVALID_DOMAINS = ['', 'newtab', 'chrome', 'extension'];

  // Initialize
  loadSettings();

  // Event Listeners
  elements.saveButton.addEventListener('click', saveSettings);
  elements.addCurrentButton.addEventListener('click', addCurrentUrl);
  elements.toggleTracking.addEventListener('change', saveSettings);

  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'urlList',
        'timeLimit',
        'isEnabled',
      ]);

      elements.urlEditor.value = result.urlList || '';
      elements.timeLimit.value = result.timeLimit || DEFAULT_TIME_LIMIT;
      elements.toggleTracking.checked = result.isEnabled ?? true;

      await checkCurrentUrl(result.urlList || '');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async function saveSettings() {
    try {
      const settings = {
        urlList: normalizeUrlList(elements.urlEditor.value),
        timeLimit: elements.timeLimit.value,
        isEnabled: elements.toggleTracking.checked,
      };

      await chrome.storage.sync.set(settings);
      showSaveConfirmation();
      await checkCurrentUrl(settings.urlList);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // Add these constants at the top with other constants
  const DOMAIN_MAX_LENGTH = 255; // Maximum length for a domain name
  const MAX_URLS = 1000; // Reasonable limit for number of URLs

  function normalizeUrlList(urlList) {
    let hasError = false;

    const normalizedList = urlList
      .split('\n')
      .map((url) => {
        const sanitizedUrl = url
          .trim()
          .replace(/<[^>]*>/g, '')
          .replace(/[^a-zA-Z0-9-._]/g, '')
          .toLowerCase();

        if (sanitizedUrl.length > DOMAIN_MAX_LENGTH) {
          showValidationError(`Domain too long: ${url.trim()}`);
          hasError = true;
          return '';
        }

        if (!isValidDomain(sanitizedUrl)) {
          showValidationError(`Invalid domain format: ${url.trim()}`);
          hasError = true;
          return '';
        }

        return sanitizedUrl;
      })
      .filter((url) => url !== '')
      .slice(0, MAX_URLS)
      .filter((url, index, self) => self.indexOf(url) === index)
      .join('\n');

    if (!hasError) {
      hideValidationError();
    }

    return normalizedList;
  }

  function showValidationError(message) {
    elements.validationError.textContent = message;
    elements.validationError.classList.add('show');
  }

  function hideValidationError() {
    elements.validationError.textContent = '';
    elements.validationError.classList.remove('show');
  }

  elements.urlEditor.addEventListener('input', () => {
    normalizeUrlList(elements.urlEditor.value);
  });

  function isValidDomain(domain) {
    if (!domain || INVALID_DOMAINS.includes(domain)) {
      return false;
    }

    // Stricter domain validation regex
    const domainRegex = /^(?!-)[a-z0-9-._]+(?<!-)$/;

    return (
      domainRegex.test(domain) &&
      !domain.startsWith('.') &&
      !domain.endsWith('.') &&
      domain.length <= DOMAIN_MAX_LENGTH
    );
  }

  async function addCurrentUrl() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.url) {
        return;
      }

      const domain = new URL(tab.url).hostname.replace('www.', '');
      if (!isValidDomain(domain)) {
        console.log('Invalid domain:', domain);
        return;
      }

      const currentUrls = elements.urlEditor.value
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url !== '');

      if (currentUrls.includes(domain)) {
        toggleAddCurrentButton(false);
        return;
      }

      elements.urlEditor.value =
        currentUrls.length > 0 ? [...currentUrls, domain].join('\n') : domain;

      await saveSettings();
    } catch (error) {
      console.error('Error adding current URL:', error);
    }
  }

  async function checkCurrentUrl(urlList) {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.url) return;

      const domain = new URL(tab.url).hostname.replace('www.', '');
      const urlListArray = urlList.split('\n');

      toggleAddCurrentButton(!urlListArray.includes(domain));
    } catch (error) {
      console.error('Error checking current URL:', error);
    }
  }

  function toggleAddCurrentButton(isEnabled) {
    elements.addCurrentButton.disabled = !isEnabled;
    elements.addCurrentButton.style.backgroundColor = isEnabled
      ? '#2196f3'
      : '#ccc';
    elements.addCurrentButton.textContent = isEnabled
      ? 'Add Current Domain'
      : 'Already Added';
  }

  function showSaveConfirmation() {
    const originalText = elements.saveButton.textContent;
    elements.saveButton.textContent = 'Saved!';

    setTimeout(() => {
      elements.saveButton.textContent = originalText;
    }, SAVE_FEEDBACK_DURATION);
  }
});
