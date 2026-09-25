import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { prepareBinaryen } from "../scripts/binaryen.mjs";

const target = process.platform === "win32" ? "x86_64-windows" : "x86_64-linux";
const sha256 = "0".repeat(64);

test("rejects malformed Binaryen version and checksum pins", async () => {
  await assert.rejects(prepareBinaryen(tmpdir(), {
    version: "../version_117", sha256: { [target]: sha256 },
  }), /Invalid Binaryen pin/);
  await assert.rejects(prepareBinaryen(tmpdir(), {
    version: "version_117", sha256: { [target]: "invalid" },
  }), /Invalid Binaryen pin/);
});

test("rejects a truncated Binaryen archive before extraction", async () => {
  const buildRoot = mkdtempSync(join(tmpdir(), "iced-binaryen-test-"));
  const archive = join(buildRoot, "binaryen", `binaryen-version_117-${target}.tar.gz`);
  try {
    mkdirSync(join(buildRoot, "binaryen"));
    writeFileSync(archive, "truncated archive");
    await assert.rejects(prepareBinaryen(buildRoot, {
      version: "version_117", sha256: { [target]: sha256 },
    }), /SHA-256 verification/);
    assert.equal(existsSync(archive), false);
  } finally {
    rmSync(buildRoot, { recursive: true, force: true });
  }
});
