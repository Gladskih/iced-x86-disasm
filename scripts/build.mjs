import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { delimiter, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { prepareBinaryen } from "./binaryen.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const upstream = JSON.parse(readFileSync(join(root, "upstream.json"), "utf8"));
const source = join(root, ".build", "iced");
const packageOutput = join(root, ".build", "pkg");
const distribution = join(root, "dist");

function run(command, args, cwd = root) {
  const executable = process.platform === "win32" ? `${command}.exe` : command;
  const result = spawnSync(executable, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${command} failed with status ${result.status}`);
}

function output(command, args, cwd = root) {
  const executable = process.platform === "win32" ? `${command}.exe` : command;
  const result = spawnSync(executable, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `${command} failed`);
  return result.stdout.trim();
}

if (!existsSync(join(source, ".git"))) {
  mkdirSync(source, { recursive: true });
  run("git", ["init", "--quiet"], source);
  run("git", ["remote", "add", "origin", upstream.repository], source);
  run("git", ["sparse-checkout", "set", "src/rust/iced-x86", "src/rust/iced-x86-js"], source);
}
let currentCommit = "";
try { currentCommit = output("git", ["rev-parse", "HEAD"], source); } catch { /* Fresh clone. */ }
if (currentCommit !== upstream.commit) {
  run("git", ["fetch", "--depth=1", "origin", upstream.commit], source);
  run("git", ["checkout", "--quiet", "--detach", "FETCH_HEAD"], source);
}
if (output("git", ["rev-parse", "HEAD"], source) !== upstream.commit) {
  throw new Error("Fetched iced source does not match upstream.json");
}
if (output("git", ["status", "--porcelain", "--untracked-files=normal"], source)) {
  throw new Error("Pinned iced source has local modifications");
}
if (readFileSync(join(source, "LICENSE.txt"), "utf8") !==
    readFileSync(join(root, "licenses", "iced.txt"), "utf8")) {
  throw new Error("Upstream iced license changed; review and update licenses/iced.txt");
}
if (!output("wasm-pack", ["--version"]).includes(` ${upstream.wasmPackVersion}`)) {
  throw new Error(`Expected wasm-pack ${upstream.wasmPackVersion}`);
}
if (!output("wasm-bindgen", ["--version"]).includes(` ${upstream.wasmBindgenCliVersion}`)) {
  throw new Error(`Expected wasm-bindgen ${upstream.wasmBindgenCliVersion}`);
}
const toolchain = readFileSync(join(root, "rust-toolchain.toml"), "utf8");
const rustVersion = toolchain.match(/^channel = "([0-9]+\.[0-9]+\.[0-9]+)"$/m)?.[1];
if (!rustVersion || !output("rustc", ["--version"]).startsWith(`rustc ${rustVersion} `)) {
  throw new Error("Active Rust compiler differs from rust-toolchain.toml");
}
process.env.PATH = `${await prepareBinaryen(join(root, ".build"), upstream.binaryen)}` +
  `${delimiter}${process.env.PATH}`;

run("wasm-pack", [
  "build", "--mode", "no-install", "--release", "--target", "web",
  "--out-dir", packageOutput, "--", "--locked", "--no-default-features",
  "--features", upstream.features.join(" "),
], join(source, "src", "rust", "iced-x86-js"));

rmSync(distribution, { recursive: true, force: true });
mkdirSync(distribution, { recursive: true });
for (const name of ["iced_x86.js", "iced_x86.d.ts", "iced_x86_bg.wasm"]) {
  copyFileSync(join(packageOutput, name), join(distribution, name));
}
writeFileSync(join(distribution, "iced_x86.d.ts"),
  "/// <reference lib=\"esnext.disposable\" />\n" +
  readFileSync(join(distribution, "iced_x86.d.ts"), "utf8"));
writeFileSync(join(distribution, "browser.js"),
  "import init from './iced_x86.js';\n" +
  "await init({ module_or_path: new URL('./iced_x86_bg.wasm', import.meta.url) });\n" +
  "export * from './iced_x86.js';\n");
writeFileSync(join(distribution, "node.js"),
  "import { readFile } from 'node:fs/promises';\n" +
  "import init from './iced_x86.js';\n" +
  "const wasmURL = new URL('./iced_x86_bg.wasm', import.meta.url);\n" +
  "await init({ module_or_path: await readFile(wasmURL) });\n" +
  "export * from './iced_x86.js';\n");
writeFileSync(join(distribution, "index.d.ts"),
  "export * from './iced_x86.js';\n");
