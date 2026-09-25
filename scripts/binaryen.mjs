import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  createReadStream, createWriteStream, existsSync, mkdirSync, renameSync, unlinkSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const platform = () => {
  if (process.arch !== "x64") throw new Error(`Unsupported build architecture: ${process.arch}`);
  if (process.platform === "linux") return "x86_64-linux";
  if (process.platform === "win32") return "x86_64-windows";
  throw new Error(`Unsupported build platform: ${process.platform}`);
};

async function fileHash(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

async function downloadArchive(url, path) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Could not download pinned Binaryen: HTTP ${response.status}`);
  }
  mkdirSync(dirname(path), { recursive: true });
  const staging = `${path}.download`;
  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(staging));
    renameSync(staging, path);
  } finally {
    if (existsSync(staging)) unlinkSync(staging);
  }
}

function versionAt(path) {
  const result = spawnSync(path, ["--version"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`Pinned wasm-opt failed: ${result.stderr}`);
  return result.stdout.trim();
}

export async function prepareBinaryen(buildRoot, binaryen) {
  const target = platform();
  if (!/^version_[0-9]+$/.test(binaryen.version) ||
      !/^[0-9a-f]{64}$/.test(binaryen.sha256[target] ?? "")) {
    throw new Error("Invalid Binaryen pin");
  }
  const filename = `binaryen-${binaryen.version}-${target}.tar.gz`;
  const archive = join(buildRoot, "binaryen", filename);
  const tool = join(buildRoot, "binaryen", binaryen.version, target, "bin",
    process.platform === "win32" ? "wasm-opt.exe" : "wasm-opt");
  if (!existsSync(archive)) {
    const url = `https://github.com/WebAssembly/binaryen/releases/download/` +
      `${binaryen.version}/${filename}`;
    await downloadArchive(url, archive);
  }
  if (await fileHash(archive) !== binaryen.sha256[target]) {
    unlinkSync(archive);
    throw new Error(`Pinned Binaryen archive failed SHA-256 verification: ${archive}`);
  }
  mkdirSync(dirname(dirname(tool)), { recursive: true });
  const result = spawnSync("tar", ["-xzf", archive, "-C", dirname(dirname(tool)),
    "--strip-components=1"], { stdio: "inherit" });
  if (result.status !== 0) throw new Error("Could not extract pinned Binaryen archive");
  const actualVersion = versionAt(tool);
  if (!actualVersion.includes(binaryen.version)) {
    throw new Error(`Pinned wasm-opt has the wrong version: ${actualVersion}`);
  }
  return dirname(tool);
}
