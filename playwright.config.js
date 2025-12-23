const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'e2e',
  timeout: 30000,
  use: {
    viewport: { width: 1280, height: 720 },
    trace: 'retain-on-failure',
  },
});
