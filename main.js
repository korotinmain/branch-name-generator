const Selectors = {
  FEATURE: 'feature',
  BUGFIX: 'bugfix',
  HOTFIX: 'hotfix',
};

const Themes = {
  DARK: 'dark',
  LIGHT: 'light',
};

const THEME_STORAGE_KEY = 'branch-name-generator-theme';
const HISTORY_STORAGE_KEY = 'branch-name-generator-history';
const HISTORY_LIMIT = 3;

const sanitizeTaskId = (value) => value.replace(/[^a-zA-Z0-9-]/g, '');

const slugifyTitle = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const getElements = () => ({
  copyButton: document.querySelector('#copy-button'),
  toast: document.querySelector('#toast'),
  clearHistoryButton: document.querySelector('#clear-history'),
  historyList: document.querySelector('#history-list'),
  themeToggle: document.querySelector('#theme-toggle'),
  themeIcon: document.querySelector('#theme-toggle .theme-icon'),
  themeLabel: document.querySelector('#theme-toggle .theme-label'),
  taskIdInput: document.querySelector('#task-id'),
  uppercaseTaskKey: document.querySelector('#uppercase-task-key'),
  titleInput: document.querySelector('#title-input'),
  resultSpan: document.querySelector('#result-span'),
  selectorButtons: Array.from(document.querySelectorAll('[data-selector]')),
});

const detectInitialTheme = () => {
  try {
    const storedTheme = typeof localStorage !== 'undefined' && localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === Themes.DARK || storedTheme === Themes.LIGHT) {
      return storedTheme;
    }
  } catch (error) {
    // Ignore storage issues and fall through to preference check.
  }

  const prefersLight =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: light)').matches;

  return prefersLight ? Themes.LIGHT : Themes.DARK;
};

const formatTaskIdForResult = (taskId, uppercase) => {
  if (!taskId) return '';
  return uppercase ? taskId.toUpperCase() : taskId.toLowerCase();
};

const buildBranchName = ({ selector, taskId, slug, uppercase }) => {
  const normalizedTaskId = formatTaskIdForResult(taskId, uppercase);
  const segments = [];
  if (normalizedTaskId) segments.push(normalizedTaskId);
  if (slug) segments.push(slug);
  const suffix = segments.join('-');
  return `${selector}/${suffix}`;
};

const initBranchNameGenerator = () => {
  const elements = getElements();

  if (
    !elements.copyButton ||
    !elements.toast ||
    !elements.historyList ||
    !elements.clearHistoryButton ||
    !elements.themeToggle ||
    !elements.themeIcon ||
    !elements.themeLabel ||
    !elements.taskIdInput ||
    !elements.uppercaseTaskKey ||
    !elements.titleInput ||
    !elements.resultSpan ||
    elements.selectorButtons.length === 0
  ) {
    console.error('Branch name generator could not find required elements.');
    return;
  }

  const state = {
    activeSelector: Selectors.FEATURE,
    slug: '',
    theme: detectInitialTheme(),
    taskId: '',
    uppercaseTaskKey: elements.uppercaseTaskKey.checked,
    history: [],
  };

  const persistHistory = () => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(state.history));
    } catch (error) {
      // ignore
    }
  };

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        state.history = Array.isArray(parsed) ? parsed.slice(0, HISTORY_LIMIT) : [];
      }
    } catch (error) {
      state.history = [];
    }
  };

  const updateResult = () => {
    elements.resultSpan.textContent = buildBranchName({
      selector: state.activeSelector,
      taskId: state.taskId,
      slug: state.slug,
      uppercase: state.uppercaseTaskKey,
    });
  };

  const setSelector = (selector) => {
    state.activeSelector = selector;
    elements.selectorButtons.forEach((button) => {
      const isActive = button.dataset.selector === selector;
      button.classList.toggle('active', isActive);
    });
    updateResult();
  };

  const handleTitleInput = (event) => {
    state.slug = slugifyTitle(event.target.value);
    elements.titleInput.classList.remove('input-invalid');
    updateResult();
  };

  const handleTaskIdInput = (event) => {
    const cleaned = sanitizeTaskId(event.target.value);
    state.taskId = cleaned;
    if (cleaned !== event.target.value) {
      elements.taskIdInput.value = cleaned;
    }
    updateResult();
  };

  const handleUppercaseToggle = (event) => {
    state.uppercaseTaskKey = event.target.checked;
    updateResult();
  };

  const setTheme = (theme) => {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      // ignore
    }

    const isLight = theme === Themes.LIGHT;
    const icon = elements.themeIcon.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-sun', isLight);
      icon.classList.toggle('fa-moon', !isLight);
    }
    elements.themeLabel.textContent = isLight ? 'Light' : 'Dark';
    elements.themeToggle.setAttribute('aria-pressed', String(isLight));
  };

  const toggleTheme = () => {
    const nextTheme = state.theme === Themes.LIGHT ? Themes.DARK : Themes.LIGHT;
    setTheme(nextTheme);
  };

  const setCopyState = (state, message) => {
    const states = ['success', 'error'];
    states.forEach((name) => elements.copyButton.classList.toggle(name, name === state));
    elements.copyButton.setAttribute('aria-label', message);
    setTimeout(() => {
      states.forEach((name) => elements.copyButton.classList.remove(name));
      elements.copyButton.setAttribute('aria-label', 'Copy');
    }, 1800);
  };

  const showToast = (message, variant = 'success') => {
    elements.toast.textContent = message;
    elements.toast.classList.remove('success', 'error');
    elements.toast.classList.add(variant, 'show');
    setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 1800);
  };

  const renderHistory = () => {
    if (!elements.historyList) return;
    if (!state.history.length) {
      elements.historyList.innerHTML = `<div class="history-empty">No recent branches yet.</div>`;
      return;
    }
    elements.historyList.innerHTML = '';
    state.history.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'history-item';
      const text = document.createElement('span');
      text.textContent = item;
      const actions = document.createElement('div');
      actions.className = 'history-actions';
      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.className = 'history-action';
      copyButton.setAttribute('aria-label', 'Copy');
      copyButton.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i>';
      copyButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(item);
          showToast('Copied from history', 'success');
        } catch (error) {
          showToast('Failed to copy', 'error');
        }
      });
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'history-action danger';
      deleteButton.setAttribute('aria-label', 'Delete');
      deleteButton.innerHTML = '<i class="fa-solid fa-trash" aria-hidden="true"></i>';
      deleteButton.addEventListener('click', () => removeFromHistory(item));
      actions.append(copyButton, deleteButton);
      row.append(text, actions);
      elements.historyList.appendChild(row);
    });
  };

  const addToHistory = (value) => {
    const withoutDupes = [value, ...state.history.filter((item) => item !== value)];
    state.history = withoutDupes.slice(0, HISTORY_LIMIT);
    renderHistory();
    persistHistory();
  };

  const removeFromHistory = (value) => {
    state.history = state.history.filter((item) => item !== value);
    renderHistory();
    persistHistory();
  };

  const clearHistory = () => {
    state.history = [];
    renderHistory();
    persistHistory();
  };

  const copyToClipboard = async () => {
    const textToCopy = elements.resultSpan.textContent;
    if (!state.slug) {
      setCopyState('error', 'Copy failed');
      elements.titleInput.classList.add('input-invalid');
      showToast('Enter a task title first', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyState('success', 'Copied!');
      showToast('Branch name copied', 'success');
      addToHistory(textToCopy);
    } catch (error) {
      console.error('Failed to copy branch name', error);
      setCopyState('error', 'Copy failed');
      showToast('Failed to copy', 'error');
    }
  };

  elements.titleInput.addEventListener('input', handleTitleInput);
  elements.taskIdInput.addEventListener('input', handleTaskIdInput);
  elements.uppercaseTaskKey.addEventListener('change', handleUppercaseToggle);
  elements.selectorButtons.forEach((button) => {
    button.addEventListener('click', () => setSelector(button.dataset.selector));
  });
  elements.copyButton.addEventListener('click', copyToClipboard);
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.clearHistoryButton.addEventListener('click', clearHistory);

  loadHistory();
  updateResult();
  renderHistory();
  setTheme(state.theme);
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', initBranchNameGenerator);
}

if (typeof module !== 'undefined') {
  module.exports = {
    sanitizeTaskId,
    slugifyTitle,
    detectInitialTheme,
    formatTaskIdForResult,
    buildBranchName,
    Themes,
  };
}
