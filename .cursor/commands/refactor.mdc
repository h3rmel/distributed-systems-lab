---
description: Assist with code refactoring while maintaining behavior.
---

# `/refactor [file/function]`

**Purpose:** Assist with code refactoring while maintaining behavior.

**AI Actions:**
1. Read target file/function completely
2. Analyze current implementation:
   - Identify code smells
   - Check against SOLID principles
   - Measure complexity (function length, nesting depth)
   - Find violations of `mb-system-patterns.mdc`
3. Propose refactoring strategy:
   - What needs to change and why
   - Suggested new structure
   - Risk assessment
4. Ask: "Would you like me to help with specific parts, or would you like to proceed with the refactoring yourself?"
5. If user requests help:
   - Provide guidance on specific techniques
   - Suggest function extraction points
   - Recommend interface definitions
   - **Do not implement unless explicitly asked**

**Example:**
```
User: /refactor src/webhook/webhook.controller.ts
AI: [Analyzes controller, identifies violations, proposes strategy]
AI: "Controller contains business logic in lines 45-67. Suggest extracting to WebhookValidationService. Would you like guidance on the extraction?"
```
