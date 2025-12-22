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

const slugifyTitle = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const getElements = () => ({
  copyButton: document.querySelector('#copy-button'),
  copyLabel: document.querySelector('#copy-button .label'),
  toast: document.querySelector('#toast'),
  clearHistoryButton: document.querySelector('#clear-history'),
  historyList: document.querySelector('#history-list'),
  themeToggle: document.querySelector('#theme-toggle'),
  themeIcon: document.querySelector('#theme-toggle .theme-icon'),
  themeLabel: document.querySelector('#theme-toggle .theme-label'),
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

const initBranchNameGenerator = () => {
  const elements = getElements();

  if (
    !elements.copyButton ||
    !elements.copyLabel ||
    !elements.toast ||
    !elements.historyList ||
    !elements.clearHistoryButton ||
    !elements.themeToggle ||
    !elements.themeIcon ||
    !elements.themeLabel ||
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
    elements.resultSpan.textContent = `${state.activeSelector}/${state.slug}`;
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

  const setTheme = (theme) => {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    const isLight = theme === Themes.LIGHT;
    elements.themeIcon.textContent = isLight ? '☀️' : '🌙';
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
    elements.copyLabel.textContent = message;
    setTimeout(() => {
      states.forEach((name) => elements.copyButton.classList.remove(name));
      elements.copyLabel.textContent = 'Copy';
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
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Copy';
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(item);
          showToast('Copied from history', 'success');
        } catch (error) {
          showToast('Failed to copy', 'error');
        }
      });
      row.append(text, button);
      elements.historyList.appendChild(row);
    });
  };

  const addToHistory = (value) => {
    const withoutDupes = [value, ...state.history.filter((item) => item !== value)];
    state.history = withoutDupes.slice(0, HISTORY_LIMIT);
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
    slugifyTitle,
    detectInitialTheme,
    Themes,
  };
}
