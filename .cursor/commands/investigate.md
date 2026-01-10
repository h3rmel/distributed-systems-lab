---
description: Deep dive into existing code to understand implementation before making changes.
---

# `/investigate [topic/module/file]`

**Purpose:** Deep dive into existing code to understand implementation before making changes.

**AI Actions:**
1. Identify scope:
   - If module name: Find all files in that module
   - If file path: Focus on that specific file
   - If topic: Search codebase for relevant code
2. Perform analysis:
   - Read relevant files completely
   - Trace data flow and dependencies
   - Identify patterns and architecture used
   - Look for related tests
3. Provide structured report:
   - **Purpose:** What this code does
   - **Architecture:** How it's structured (classes, functions, modules)
   - **Dependencies:** What it depends on and what depends on it
   - **Patterns Used:** SOLID principles, design patterns observed
   - **Data Flow:** Input → Processing → Output
   - **Test Coverage:** What tests exist
   - **Observations:** Code quality, potential issues, improvement opportunities
4. Ask: "What would you like to do with this code?"

**Example:**
```
User: /investigate WebhookModule
AI: [Analyzes all WebhookModule files, provides detailed report]
```
