# Security policy

Report vulnerabilities privately through GitHub's security advisory flow for
this repository. Please include a minimal reproducer and affected version.
Do not include sensitive sample files in a public issue.

The package performs local analysis and does not contact a service at runtime.
The build fetches only the pinned upstream source; installed package consumers
do not run build scripts.
