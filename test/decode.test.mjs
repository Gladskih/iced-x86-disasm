import assert from "node:assert/strict";
import test from "node:test";
import * as iced from "../dist/node.js";

test("exports only analysis and NASM formatting capabilities", () => {
  assert.equal(typeof iced.Decoder, "function");
  assert.equal(typeof iced.InstructionInfoFactory, "function");
  assert.equal(typeof iced.Formatter, "function");
  assert.equal(iced.Encoder, undefined);
  assert.equal(iced.BlockEncoder, undefined);
  assert.equal(iced.FastFormatter, undefined);
});

test("decodes and formats 16, 32 and 64 bit returns", () => {
  for (const bitness of [16, 32, 64]) {
    const decoder = new iced.Decoder(bitness, Uint8Array.of(0xc3), iced.DecoderOptions.None);
    const instruction = new iced.Instruction();
    const formatter = new iced.Formatter(iced.FormatterSyntax.Nasm);
    decoder.decodeOut(instruction);
    assert.equal(iced.Mnemonic[instruction.mnemonic], "Ret");
    assert.equal(instruction.length, 1);
    assert.equal(formatter.format(instruction), "ret");
    assert.equal(instruction.flowControl, iced.FlowControl.Return);
    formatter.free();
    instruction.free();
    decoder.free();
  }
});

test("reports branch target and CPUID metadata", () => {
  // E9 +1 is a relative near jump, followed by NOP and RET.
  const decoder = new iced.Decoder(64,
    Uint8Array.of(0xe9, 1, 0, 0, 0, 0x90, 0xc3), iced.DecoderOptions.None);
  const instruction = new iced.Instruction();
  decoder.ip = 0x1000n;
  decoder.decodeOut(instruction);
  assert.equal(instruction.nearBranchTarget, 0x1006n);
  assert.equal(instruction.flowControl, iced.FlowControl.UnconditionalBranch);
  assert.ok(instruction.cpuidFeatures() instanceof Int32Array);
  instruction.free();
  decoder.free();
});

test("handles empty and truncated input without reading beyond it", () => {
  for (const bytes of [new Uint8Array(), Uint8Array.of(0x0f)]) {
    const decoder = new iced.Decoder(64, bytes, iced.DecoderOptions.None);
    const instruction = new iced.Instruction();
    assert.equal(decoder.canDecode, bytes.length > 0);
    if (decoder.canDecode) {
      decoder.decodeOut(instruction);
      assert.equal(instruction.code, iced.Code.INVALID);
      assert.ok(instruction.length <= bytes.length);
    }
    instruction.free();
    decoder.free();
  }
});
