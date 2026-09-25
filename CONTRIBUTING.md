# Contributing

Open an issue before changing the public feature set or upstream pin. Build
from the pinned source and run `npm test`, `npm run test:browser`,
`npm run verify:package`, and the tarball smoke test before submitting a pull
request. Keep generated files out of Git. Document any size change and test
the affected browser and Node APIs. Use imperative, present-tense commits.

For upstream changes, check the iced-x86 source and license, update
`upstream.json`, and ensure each enabled feature is needed for disassembly or
instruction analysis. Preserve local-only browser operation.
