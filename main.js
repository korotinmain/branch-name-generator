const Selectors = {
  feature: 'feature',
  bugfix: 'bugfix',
  hotfix: 'hotfix',
};

window.addEventListener('DOMContentLoaded', () => {
  const copyButton = document.querySelector('#copy-button');
  const titleInput = document.querySelector('#title-input');
  const resultSpan = document.querySelector('#result-span');
  const featureButton = document.querySelector('#feature-button');
  const bugfixButton = document.querySelector('#bugfix-button');
  const hotfixButton = document.querySelector('#hotfix-button');
  let activeSelector = Selectors.feature;
  let resultValue = '';

  const putValueInputResultSpan = function () {
    resultSpan.innerHTML = `${activeSelector}/${resultValue}`;
  };

  putValueInputResultSpan();

  titleInput.addEventListener('input', function (event) {
    const result = event.target.value
      .trim()
      .split(' ')
      .map((x) => x.toLowerCase())
      .join('-')
      .replace(/[^a-zA-Z0-9\-]/g, '');
    resultValue = result;
    putValueInputResultSpan();
  });

  const selectorButtons = [featureButton, bugfixButton, hotfixButton];
  selectorButtons.forEach((button) => {
    button.addEventListener('click', function () {
      selectorButtons.forEach((target) => {
        target.classList.remove('active');
      });
      button.classList.add('active');
      activeSelector = Selectors[button.innerHTML];
      putValueInputResultSpan();
    });
  });

  copyButton.addEventListener('click', async function () {
    try {
      await navigator.clipboard.writeText(resultSpan.innerHTML);
      copyButton.innerHTML = 'Copied!';
      setTimeout(function () {
        copyButton.innerHTML = 'Copy';
      }, 2000);
      console.log('Content copied to clipboard');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  });
});
