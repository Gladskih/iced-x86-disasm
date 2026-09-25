import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const filename = JSON.parse(readFileSync("pack-result.json", "utf8").replace(/^\uFEFF/, ""))[0].filename;
const temporary = mkdtempSync(join(tmpdir(), "iced-x86-disasm-"));
try {
  const npmCli = process.env.npm_execpath ??
    join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
  const command = process.platform === "win32" && existsSync(npmCli) ? process.execPath : "npm";
  const args = command === process.execPath ? [npmCli] : [];
  const install = spawnSync(command, [...args,
    "install", "--ignore-scripts", "--no-audit", "--no-fund", resolve(filename),
  ], { cwd: temporary, stdio: "inherit" });
  assert.equal(install.status, 0, "tarball installation failed");
  const script = "import('iced-x86-disasm').then(m => { const d = new m.Decoder(64, Uint8Array.of(0xc3), m.DecoderOptions.None); const i = new m.Instruction(); d.decodeOut(i); if (m.Mnemonic[i.mnemonic] !== 'Ret') process.exitCode = 1; i.free(); d.free(); })";
  const smoke = spawnSync(process.execPath, ["-e", script], {
    cwd: temporary, stdio: "inherit",
  });
  assert.equal(smoke.status, 0, "installed tarball failed to decode ret");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
