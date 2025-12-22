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

  const copyToClipboard = async () => {
    const textToCopy = elements.resultSpan.textContent;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyState('success', 'Copied!');
    } catch (error) {
      console.error('Failed to copy branch name', error);
      setCopyState('error', 'Copy failed');
    }
  };

  elements.titleInput.addEventListener('input', handleTitleInput);
  elements.selectorButtons.forEach((button) => {
    button.addEventListener('click', () => setSelector(button.dataset.selector));
  });
  elements.copyButton.addEventListener('click', copyToClipboard);
  elements.themeToggle.addEventListener('click', toggleTheme);

  updateResult();
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
