# Project instructions

## everything-claude-code (ECC)

Always use the ECC plugin (`ecc@ecc`) in this repository: prefer its skills,
agents and commands whenever one fits the task (for example its Next.js,
React, frontend, code-review, security and testing skills).

At session start the `.claude/hooks/ensure-ecc.sh` hook checks that ECC is
installed, enabled and has its dependencies, repairs what it can, and adds an
"ECC (everything-claude-code) startup check" line to your context.

- `OK`: proceed normally.
- `INSTALLED NOW`: ECC was missing and has just been installed; it is not
  loaded in this session. Tell the user before doing anything else.
- `FAILED`, or no startup-check line at all: tell the user ECC is not working,
  with the reason, before doing anything else.
