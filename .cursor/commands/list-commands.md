---
description: Return the list of available Memory Bank commands in a lean format.
---

# `/list-commands`

**Purpose:** Return the list of available Memory Bank commands in a lean format.

**Output format (lean):**
- One command per line: `/<command> - <purpose>`
- Keep it short: no examples, no extra commentary

**AI Actions:**
1. Read all command files in `.cursor/commands/`
2. Extract command names from filenames (remove `.md` extension)
3. Extract purposes from frontmatter `description` field
4. Print the lean list in alphabetical order

**Example output:**
```
/summarize - Start a new coding session with full context refresh.
/update-context - Update Memory Bank context files after significant work.
...
```
