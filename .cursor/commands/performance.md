---
description: Analyze performance characteristics and suggest optimizations.

---

# `/performance [file/function]`

**Purpose:** Analyze performance characteristics and suggest optimizations.

**AI Actions:**
1. Read target code
2. Identify performance concerns:
   - Synchronous I/O operations
   - Inefficient data structures (Array.find vs Map.get)
   - Sequential operations that could be parallel
   - Memory leaks (missing cleanup)
   - N+1 query patterns
3. Measure complexity:
   - Time complexity (Big O)
   - Space complexity
4. Suggest optimizations:
   - Convert to async/await if synchronous
   - Use Promise.all for parallelization
   - Better data structures
   - Caching opportunities
5. Reference `mb-system-patterns.mdc` performance guidelines

**Example:**
```
User: /performance webhook processing
AI: [Analyzes performance, suggests specific optimizations]
```
