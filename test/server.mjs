import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const contentTypes = new Map([
  [".html", "text/html"], [".js", "text/javascript"], [".wasm", "application/wasm"],
]);
const allowedPaths = new Set([
  "/test/browser.html", "/dist/browser.js", "/dist/iced_x86.js", "/dist/iced_x86_bg.wasm",
]);

createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (!allowedPaths.has(pathname)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const data = await readFile(fileURLToPath(new URL(`..${pathname}`, import.meta.url)));
    const extension = pathname.slice(pathname.lastIndexOf("."));
    response.writeHead(200, { "content-type": contentTypes.get(extension) });
    response.end(data);
  } catch {
    response.writeHead(404).end();
  }
}).listen(4179, "127.0.0.1");
