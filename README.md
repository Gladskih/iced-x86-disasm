# iced-x86-disasm

Compact x86/x64 disassembly and instruction analysis for JavaScript, built from
the current [iced-x86](https://github.com/icedland/iced) Rust source. The npm
package includes prebuilt WebAssembly and works fully offline in browsers and
Node.js. Installation does not run a compiler or download a binary.

```sh
npm install iced-x86-disasm
```

```js
import {
  Decoder, DecoderOptions, Formatter, FormatterSyntax, Instruction, Mnemonic,
} from "iced-x86-disasm";

const decoder = new Decoder(64, Uint8Array.of(0x90, 0xc3), DecoderOptions.None);
const instruction = new Instruction();
const formatter = new Formatter(FormatterSyntax.Nasm);
while (decoder.canDecode) {
  decoder.decodeOut(instruction);
  console.log(Mnemonic[instruction.mnemonic], formatter.format(instruction));
}
formatter.free();
instruction.free();
decoder.free();
```

The package exposes the upstream iced-x86 JavaScript bindings for these
features: `decoder`, `instr_api`, `instr_info`, and `nasm`. This includes
`Decoder`, `Instruction`, `Formatter`, `InstructionInfoFactory`, instruction
and CPUID metadata, and the relevant enums. The encoder, block encoder,
instruction creation, opcode metadata and other formatters are excluded.
`Instruction` objects own WASM memory; call `free()` on them and on the
decoder/formatter/factory after use. Malformed or truncated byte streams are
reported as `Code.INVALID` by iced-x86; callers should check the decoded
instruction and length before using derived fields.

The root import selects the browser loader in browser-aware bundlers and the
Node loader in Node.js. Both initialize WASM during module import, so the API
is ready when the import resolves. The browser loader fetches
`iced_x86_bg.wasm` relative to its own module URL. Host the package's WASM
asset locally and serve it as `application/wasm`. Bundlers that do not copy
`new URL(..., import.meta.url)` assets from dependencies may need an explicit
asset copy. The raw WASM is exported as `iced-x86-disasm/iced_x86_bg.wasm`.
The module requires a modern browser with WebAssembly, BigInt and top-level
`await`; Node.js 22+ is supported. Use a Web Worker for large synchronous
decode jobs. CSP must allow WebAssembly compilation.

## Size and source

At the pinned commit, this build produces a 340,043 byte WASM file and a
743,665 byte generated binding. The npm `iced-x86@1.21.0` installation used
for comparison has a 784,176 byte WASM file and a 924,376 byte binding. The
package also includes type declarations, two tiny loaders and licenses.
Sizes are raw bytes, not transfer sizes; repeat measurements after updating
the upstream pin.

[`upstream.json`](upstream.json) pins an exact upstream commit, wasm-pack
version and Cargo features. Upstream's Rust crate still identifies as
`iced-x86 1.21.0`; this package uses subsequent source changes without
claiming an upstream release. Generated bindings and WASM are built in CI,
not committed. This package is independent of the iced project. See
[third-party notices](THIRD_PARTY_NOTICES.md).

## Building and releases

Install Rust, the `wasm32-unknown-unknown` target, `wasm-pack 0.14.0`, Git,
and Node.js 22+. Then run:

```sh
npm ci
npm run build
npm test
npx playwright install chromium
npm run test:browser
npm run verify:package
npm pack --ignore-scripts
```

The build fetches the pinned upstream commit into ignored `.build/`, verifies
the commit and license, and invokes wasm-pack with only the selected features.
CI also tests a real installed tarball and uploads that exact archive with a
SHA-256 checksum. No runtime dependencies or external service calls are used
by the decoder. The release workflow publishes version tags through npm
trusted publishing with OIDC after the npm package's trusted publisher is
configured for `Gladskih/iced-x86-disasm` and `.github/workflows/publish.yml`.

To update iced, change the pin, review upstream API and licenses, rebuild,
check the package sizes, and run both Node and browser tests. Do not change
the feature list without checking downstream API use.
