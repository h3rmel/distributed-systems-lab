---
description: Commit changes using a semantic (Conventional Commits) message.
---

# `/commit [--type=<type>] [--scope=<scope>] [--message="<msg>"] [--all] [--no-verify]`

**Purpose:** Commit changes using a semantic (Conventional Commits) message.

**Semantic format (Conventional Commits):**
- `<type>(<scope>): <description>`
- `<type>: <description>` (scope optional)
- Optional **breaking change**:
  - `type(scope)!: description` OR
  - Footer: `BREAKING CHANGE: <explanation>`

**Common types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`, `build`, `revert`

**AI Actions:**
1. Inspect repo state:
   - Run `git status`
   - Summarize changes (prefer `git diff --stat`; distinguish staged vs unstaged when relevant)
2. Propose semantic commit messages:
   - Suggest 1–3 Conventional Commit messages based on the diff
   - Recommend splitting into multiple commits if changes span unrelated concerns
3. Confirm intent before mutating git state:
   - Ask which message to use (or accept `--message`)
   - Stage changes:
     - If `--all` is set: stage with `git add -A`
     - Otherwise: ask what to stage (or proceed only if changes are already staged)
   - Ask for final confirmation to run `git commit`
4. Create commit:
   - Run `git commit -m "<semantic message>"` (append `--no-verify` only if requested)
5. Report outcome:
   - Echo final commit message used
   - Show `git status` to confirm result

**Safety Rules:**
- If there are no changes, do not commit; explain why.
- If the working tree includes unrelated changes, prefer a narrower commit or multiple commits.
- Never push or tag unless explicitly instructed.

**Examples:**
```
User: /commit --type=feat --scope=webhook
AI: Proposed: "feat(webhook): add signature verification for ProviderX" ... [asks to confirm + stage + commit]
```

```
User: /commit --message="fix(queue): handle retry backoff overflow"
AI: [verifies diff matches message, asks to confirm + stage + commit]
```
