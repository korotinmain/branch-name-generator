const path = require('path');
const { pathToFileURL } = require('url');
const { test, expect } = require('@playwright/test');

const fileUrl = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const themeKey = 'branch-name-generator-theme';
    window.localStorage.setItem(themeKey, 'dark');
    window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    window.__clipboard = { text: '' };
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text) => {
          window.__clipboard.text = text;
          return Promise.resolve();
        },
      },
      configurable: true,
    });
  });
  await page.goto(fileUrl);
});

test('updates branch name when typing title', async ({ page }) => {
  await page.getByLabel('Task title').fill('My Task');
  await expect(page.locator('#result-span')).toHaveText('feature/my-task');
});

test('sanitizes task id input to allowed characters', async ({ page }) => {
  await page.locator('#task-id').fill('RND 12$%34--ab');
  await page.locator('#title-input').fill('Ship');
  await expect(page.locator('#result-span')).toHaveText('feature/RND1234--AB-ship');
});

test('respects task id casing toggle without changing input', async ({ page }) => {
  const taskIdInput = page.locator('#task-id');
  const uppercaseToggle = page.locator('#uppercase-task-key');

  await taskIdInput.fill('rnd-123');
  await page.locator('#title-input').fill('Ship It');
  await uppercaseToggle.setChecked(false, { force: true });
  await expect(page.locator('#result-span')).toHaveText('feature/rnd-123-ship-it');
  await expect(taskIdInput).toHaveValue('rnd-123');

  await uppercaseToggle.setChecked(true, { force: true });
  await expect(page.locator('#result-span')).toHaveText('feature/RND-123-ship-it');
  await expect(taskIdInput).toHaveValue('rnd-123');
});

test('switches prefix when selecting bugfix', async ({ page }) => {
  await page.locator('#title-input').fill('Fix crash');
  await page.getByRole('button', { name: 'bugfix' }).click();
  await expect(page.locator('#result-span')).toHaveText('bugfix/fix-crash');
});

test('copies result, shows success icon, and adds history entry', async ({ page }) => {
  await page.locator('#title-input').fill('New feature');
  await page.locator('#copy-button').click();
  await expect(page.locator('#copy-button i')).toHaveClass(/fa-check/);
  await expect(page.locator('.history-item')).toHaveText(/feature\/new-feature/);
  await expect(page.evaluate(() => window.__clipboard.text)).resolves.toBe('feature/new-feature');
});

test('history copy shows checkmark and writes clipboard', async ({ page }) => {
  await page.locator('#title-input').fill('Story');
  await page.locator('#copy-button').click();
  const historyCopy = page.locator('.history-action').first();
  await historyCopy.click();
  await expect(historyCopy.locator('i')).toHaveClass(/fa-check/);
  await expect(page.evaluate(() => window.__clipboard.text)).resolves.toBe('feature/story');
});

test('delete removes a single history item', async ({ page }) => {
  await page.locator('#title-input').fill('First');
  await page.locator('#copy-button').click();
  await page.locator('#title-input').fill('Second');
  await page.locator('#copy-button').click();
  await expect(page.locator('.history-item')).toHaveCount(2);
  await page.locator('.history-action.danger').first().click();
  await expect(page.locator('.history-item')).toHaveCount(1);
});

test('clear history removes all entries', async ({ page }) => {
  await page.locator('#title-input').fill('One');
  await page.locator('#copy-button').click();
  await page.locator('#title-input').fill('Two');
  await page.locator('#copy-button').click();
  await page.getByRole('button', { name: /clear/i }).click();
  await expect(page.locator('.history-item')).toHaveCount(0);
  await expect(page.locator('.history-empty')).toHaveText(/No recent/);
});

test('theme toggle flips data-theme and icon', async ({ page }) => {
  const toggle = page.getByRole('button', { name: /toggle theme/i });
  const icon = page.locator('#theme-toggle i');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(icon).toHaveClass(/fa-sun/);
});
