import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = join(root, "dist");
const expected = [
  "browser.js", "iced_x86.d.ts", "iced_x86.js", "iced_x86_bg.wasm",
  "index.d.ts", "node.js",
];
assert.deepEqual(readdirSync(dist).sort(), expected);
const wasm = readFileSync(join(dist, "iced_x86_bg.wasm"));
assert.equal(wasm.subarray(0, 4).toString("hex"), "0061736d");
assert.ok(WebAssembly.validate(wasm), "Generated WebAssembly must validate");
assert.ok(wasm.length < 400_000, `WASM unexpectedly grew to ${wasm.length} bytes`);
assert.ok(statSync(join(dist, "iced_x86.js")).size < 850_000,
  "Generated JavaScript unexpectedly grew");
const binding = readFileSync(join(dist, "iced_x86.js"), "utf8");
assert.doesNotMatch(binding, /export class (?:Encoder|BlockEncoder|FastFormatter)/);
assert.match(binding, /export class Decoder/);
assert.match(binding, /export class Formatter/);
assert.match(binding, /export class InstructionInfoFactory/);
console.log(
  `Verified ${wasm.length} byte WASM and ${statSync(join(dist, "iced_x86.js")).size} byte binding`,
);
