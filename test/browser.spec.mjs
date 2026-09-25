import { expect, test } from "@playwright/test";

test("loads local WASM and decodes in Chromium", async ({ page }) => {
  await page.goto("http://127.0.0.1:4179/test/browser.html");
  await expect.poll(() => page.evaluate(() => window.result)).toEqual({
    mnemonic: "Ret", text: "ret",
  });
});
