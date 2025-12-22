const { slugifyTitle, detectInitialTheme, Themes } = require('../main');

describe('slugifyTitle', () => {
  test('trims leading and trailing whitespace', () => {
    expect(slugifyTitle('   task title   ')).toBe('task-title');
  });

  test('lowercases all characters', () => {
    expect(slugifyTitle('Fix THIS Bug')).toBe('fix-this-bug');
  });

  test('collapses multiple spaces into single hyphens', () => {
    expect(slugifyTitle('many    spaced    words')).toBe('many-spaced-words');
  });

  test('removes special characters and keeps alphanumerics and hyphens', () => {
    expect(slugifyTitle('feat: add @api(#123)!')).toBe('feat-add-api123');
  });

  test('collapses duplicate hyphens', () => {
    expect(slugifyTitle('feature--with---dashes')).toBe('feature-with-dashes');
  });
});

describe('detectInitialTheme', () => {
  const originalMatchMedia = global.matchMedia;
  const originalLocalStorage = global.localStorage;

  const mockMatchMedia = (matches) =>
    jest.fn(() => ({
      matches,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

  const createStorage = (value) => ({
    getItem: jest.fn(() => value),
    setItem: jest.fn(),
  });

  beforeEach(() => {
    jest.resetModules();
    global.matchMedia = originalMatchMedia;
    if (global.window) {
      delete global.window;
    }
    if (originalLocalStorage === undefined) {
      delete global.localStorage;
    } else {
      global.localStorage = originalLocalStorage;
    }
  });

  test('prefers stored light theme', () => {
    global.localStorage = createStorage(Themes.LIGHT);
    expect(detectInitialTheme()).toBe(Themes.LIGHT);
  });

  test('prefers stored dark theme', () => {
    global.localStorage = createStorage(Themes.DARK);
    expect(detectInitialTheme()).toBe(Themes.DARK);
  });

  test('falls back to OS preference (light)', () => {
    global.localStorage = createStorage(null);
    global.window = { matchMedia: mockMatchMedia(true) };
    expect(detectInitialTheme()).toBe(Themes.LIGHT);
  });

  test('falls back to dark when no storage and no light preference', () => {
    global.localStorage = createStorage(null);
    global.window = { matchMedia: mockMatchMedia(false) };
    expect(detectInitialTheme()).toBe(Themes.DARK);
  });
});
