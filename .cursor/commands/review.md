---
description: Review code for quality, patterns compliance, and best practices.
---

# `/review [file/changes]`

**Purpose:** Review code for quality, patterns compliance, and best practices.

**AI Actions:**
1. Read target file or recent changes
2. Check against all standards:
   - **SOLID Principles** from `mb-system-patterns.mdc`
   - **TypeScript Strict Mode** compliance
   - **Error Handling** (Result Pattern vs try/catch)
   - **Async/Await** usage
   - **Documentation** (JSDoc presence and quality)
   - **NestJS Patterns** (proper separation of concerns)
   - **Code Efficiency** (data structures, algorithms)
3. Provide structured feedback:
   - ✅ **Strengths:** What's done well
   - ⚠️ **Issues:** Problems found (with line numbers)
   - 💡 **Suggestions:** Improvement opportunities
   - 📋 **Checklist:** Remaining items from acceptance criteria
4. Prioritize feedback (critical → important → nice-to-have)

**Example:**
```
User: /review src/worker/webhook.processor.ts
AI: [Reviews against all standards, provides categorized feedback]
```
