export default {
  testDir: "./test",
  testMatch: "*.spec.mjs",
  use: { browserName: "chromium" },
  webServer: {
    command: "node test/server.mjs",
    url: "http://127.0.0.1:4179/test/browser.html",
    reuseExistingServer: !process.env.CI,
  },
};
