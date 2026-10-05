#!/bin/bash
# SessionStart hook: make sure the everything-claude-code (ecc) plugin is
# installed, enabled and has its runtime dependencies, then report the result
# to Claude as session context. Never fails the session start.
set -uo pipefail

MARKETPLACE="ecc"
MARKETPLACE_REPO="affaan-m/everything-claude-code"
PLUGIN="ecc@ecc"
LOG="${TMPDIR:-/tmp}/ensure-ecc.log"

problems=()
actions=()

run() {
  # Run a command, logging its output; return its exit code.
  echo "+ $*" >>"$LOG"
  "$@" >>"$LOG" 2>&1
}

plugin_json() {
  claude plugin list --json 2>/dev/null | node -e '
    let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
      try {
        const p = JSON.parse(s).find(x => x.id === process.argv[1])
        if (p) console.log([p.enabled ? "enabled" : "disabled", p.version, p.installPath, p.projectEnabled === false ? "project-off" : "project-on"].join("\t"))
      } catch {}
    })' "$PLUGIN"
}

emit() {
  local status="$1" detail="$2"
  local msg="ECC (everything-claude-code) startup check: ${status}. ${detail}"
  node -e 'console.log(JSON.stringify({hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: process.argv[1]}}))' "$msg"
  exit 0
}

: >"$LOG"

if ! command -v claude >/dev/null 2>&1; then
  echo '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"ECC startup check: FAILED. The claude CLI is not on PATH, so the plugin could not be checked."}}'
  exit 0
fi
if ! command -v node >/dev/null 2>&1; then
  echo '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"ECC startup check: FAILED. Node.js is not installed; ECC hooks cannot run."}}'
  exit 0
fi

# 1. Marketplace
if ! claude plugin marketplace list --json 2>/dev/null | grep -q "\"name\": \"$MARKETPLACE\""; then
  if run claude plugin marketplace add "$MARKETPLACE_REPO"; then
    actions+=("added marketplace")
  else
    problems+=("could not add marketplace $MARKETPLACE_REPO")
  fi
fi

# 2. Plugin installed and enabled (user scope, so the repo's settings stay untouched)
info="$(plugin_json)"
installed_now=false
if [ -z "$info" ]; then
  if run claude plugin install "$PLUGIN" --scope user; then
    actions+=("installed plugin")
    installed_now=true
  else
    problems+=("could not install $PLUGIN")
  fi
  info="$(plugin_json)"
fi
if [ -n "$info" ] && [ "${info%%$'\t'*}" = "disabled" ]; then
  if run claude plugin enable "$PLUGIN"; then
    actions+=("enabled plugin")
  else
    problems+=("plugin is disabled and could not be enabled")
  fi
  info="$(plugin_json)"
fi

if [ "$(cut -f4 <<<"$info")" = "project-off" ]; then
  problems+=("ecc@ecc is disabled in this repo's .claude/settings.json (enabledPlugins)")
fi

version="$(cut -f2 <<<"$info")"
root="$(cut -f3 <<<"$info")"

# 3. Plugin contents and runtime dependencies
if [ -n "$root" ] && [ -d "$root" ]; then
  [ -f "$root/hooks/hooks.json" ] || problems+=("hooks/hooks.json missing")
  skills=$(find "$root/skills" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
  agents=$(find "$root/agents" -maxdepth 1 -name '*.md' 2>/dev/null | wc -l)
  [ "$skills" -gt 0 ] || problems+=("no skills found")
  [ "$agents" -gt 0 ] || problems+=("no agents found")

  deps_ok() {
    (cd "$root" && node -e '
      const deps = Object.keys(require("./package.json").dependencies || {})
      for (const d of deps) require.resolve(d)')
  } 2>/dev/null
  if ! deps_ok; then
    if (cd "$root" && run npm install --omit=dev --no-audit --no-fund --ignore-scripts) && deps_ok; then
      actions+=("installed plugin npm dependencies")
    else
      problems+=("plugin npm dependencies are missing and npm install failed")
    fi
  fi
elif [ -n "$info" ]; then
  problems+=("install path $root does not exist")
fi

summary="version ${version:-unknown}, ${skills:-0} skills, ${agents:-0} agents"
[ ${#actions[@]} -gt 0 ] && summary+="; fixed: $(IFS=,; echo "${actions[*]}")"

if [ ${#problems[@]} -gt 0 ]; then
  emit "FAILED" "Problems: $(IFS=';'; echo "${problems[*]}"). Log: $LOG. Tell the user ECC is not working and why."
elif $installed_now; then
  emit "INSTALLED NOW" "($summary). The plugin was installed during this startup, so its skills/agents/hooks load only from the next session. Tell the user."
else
  emit "OK" "($summary)."
fi
