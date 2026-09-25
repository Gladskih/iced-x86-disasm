# Third-party notices

The generated JavaScript bindings and WebAssembly include the upstream iced-x86
project, copyright (c) 2018-present iced project and contributors, licensed
under MIT. The license text is included in `licenses/iced.txt`.

Upstream source: https://github.com/icedland/iced. The exact commit and selected
features are recorded in `upstream.json`. The package is independent of icedland.

The generated JavaScript glue includes code from wasm-bindgen, licensed under
MIT OR Apache-2.0. This package uses the MIT option; its license is included
in `licenses/wasm-bindgen-MIT.txt`. wasm-pack may optimize WebAssembly with
Binaryen wasm-opt, which is a build tool and is not shipped with the package.
