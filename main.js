const Selectors = {
  FEATURE: 'feature',
  BUGFIX: 'bugfix',
  HOTFIX: 'hotfix',
};

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
  titleInput: document.querySelector('#title-input'),
  resultSpan: document.querySelector('#result-span'),
  selectorButtons: Array.from(document.querySelectorAll('[data-selector]')),
});

const initBranchNameGenerator = () => {
  const elements = getElements();

  if (
    !elements.copyButton ||
    !elements.copyLabel ||
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

  updateResult();
};

window.addEventListener('DOMContentLoaded', initBranchNameGenerator);
