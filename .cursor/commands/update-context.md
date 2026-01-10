---
description: Update Memory Bank context files after significant work.
---

# `/update-context`

**Purpose:** Update Memory Bank context files after significant work.

**AI Actions:**
1. Ask user: "What context needs updating? [active | product | both]"
2. Based on response:
   - **active**: Update `mb-active-context.mdc`:
     - Add recent changes to table with today's date
     - Update next steps checklist
     - Update current focus if changed
     - Add any new architecture decisions
     - Update open questions/blockers
   - **product**: Update `mb-product-context.mdc`:
     - Add new user stories if applicable
     - Update KPIs if changed
     - Document new business requirements
   - **both**: Update both files as described above
3. Show diff of changes made
4. Confirm: "Context updated. Anything else to document?"

**Example:**
```
User: /update-context
AI: What context needs updating? [active | product | both]
User: active
AI: [Updates mb-active-context.mdc with recent session work]
```
