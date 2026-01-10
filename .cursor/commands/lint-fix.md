---
description: Identify and help fix linter errors.
---

# `/lint-fix [scope]`

**Purpose:** Identify and help fix linter errors.

**AI Actions:**
1. Read linter errors for specified scope (file/directory/all)
2. Categorize errors:
   - TypeScript errors (type safety)
   - ESLint errors (code quality)
   - Import errors
   - Unused variables
3. For each error:
   - Explain what's wrong
   - Suggest fix approach
   - If user approves, apply fix
4. After fixes, verify no new errors introduced

**Example:**
```
User: /lint-fix src/webhook/
AI: [Reads lints, categorizes, suggests fixes one by one]
```
