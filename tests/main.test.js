const {
  slugifyTitle,
  detectInitialTheme,
  Themes,
  sanitizeTaskId,
  formatTaskIdForResult,
  buildBranchName,
} = require('../main');

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

describe('sanitizeTaskId', () => {
  test('removes unsupported characters', () => {
    expect(sanitizeTaskId('RND 12$%34')).toBe('RND1234');
  });

  test('preserves letters, numbers, and dashes', () => {
    expect(sanitizeTaskId('AbC-12-xy')).toBe('AbC-12-xy');
  });
});

describe('formatTaskIdForResult', () => {
  test('returns empty string for empty task id', () => {
    expect(formatTaskIdForResult('', true)).toBe('');
  });

  test('uppercases task id when enabled', () => {
    expect(formatTaskIdForResult('rnd-1234', true)).toBe('RND-1234');
  });

  test('lowercases task id when disabled', () => {
    expect(formatTaskIdForResult('RND-1234', false)).toBe('rnd-1234');
  });
});

describe('buildBranchName', () => {
  test('joins selector and slug when no task id', () => {
    expect(buildBranchName({ selector: 'feature', taskId: '', slug: 'new-thing', uppercase: true })).toBe(
      'feature/new-thing'
    );
  });

  test('joins selector and task id when no slug', () => {
    expect(buildBranchName({ selector: 'feature', taskId: 'rnd-123', slug: '', uppercase: true })).toBe(
      'feature/RND-123'
    );
  });

  test('joins selector, task id, and slug', () => {
    expect(
      buildBranchName({ selector: 'feature', taskId: 'rnd-123', slug: 'new-thing', uppercase: true })
    ).toBe('feature/RND-123-new-thing');
  });

  test('keeps selector with trailing slash when no suffix', () => {
    expect(buildBranchName({ selector: 'feature', taskId: '', slug: '', uppercase: true })).toBe(
      'feature/'
    );
  });
});
