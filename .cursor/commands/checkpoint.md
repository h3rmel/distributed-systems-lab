---
description: Create a checkpoint of current work state.
---

# `/checkpoint`

**Purpose:** Create a checkpoint of current work state.

**AI Actions:**
1. Summarize work done in current session:
   - Files modified
   - Features added/fixed
   - Tests written
   - Documentation updated
2. Suggest context updates:
   - Should `mb-active-context.mdc` be updated?
   - Should `mb-product-context.mdc` be updated?
3. Verify completion:
   - Are there TODO items to create?
   - Are there open questions to document?
   - Are there follow-up tasks?
4. Recommend next steps

**Example:**
```
User: /checkpoint
AI: [Summarizes session, suggests context updates, identifies next steps]
```
