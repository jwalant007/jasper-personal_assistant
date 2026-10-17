const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Store the browser binary in project cache so Render / Docker persists it across build and runtime
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
