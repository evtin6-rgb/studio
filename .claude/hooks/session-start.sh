#!/bin/bash
# Installs the everything-claude-code (ecc) plugin in Claude Code cloud sessions.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if ! claude plugin marketplace list 2>/dev/null | grep -q 'ecc'; then
  claude plugin marketplace add affaan-m/everything-claude-code
fi

if ! claude plugin list 2>/dev/null | grep -q 'ecc@ecc'; then
  claude plugin install ecc@ecc --scope user
fi
