---
description: Interactive wizard to guide you through creating a feature step-by-step.
---

# `/guide`

**Purpose:** Interactive wizard to guide you through creating a feature step-by-step.

**AI Actions:**
1. Ask initial clarifying questions:
   - What do you want to create?
   - Which project/module does this belong to?
   - Is this modifying existing code or creating something new?
2. Investigate context:
   - Read relevant Memory Bank files
   - Check existing similar implementations
   - Identify dependencies and integration points
3. Guide step-by-step:
   - Break down the feature into small, manageable steps
   - For each step:
     - Explain what needs to be done and why
     - Ask if the user understands or needs clarification
     - Wait for user to implement or ask for help
     - Review their implementation before moving to next step
4. Validate at each step:
   - Check against Memory Bank patterns
   - Verify SOLID principles compliance
   - Ensure error handling is proper
   - Confirm tests are considered
5. Adapt to user responses:
   - If user is stuck, provide more detailed guidance
   - If user wants to skip ahead, allow it but note dependencies
   - If user diverges from plan, discuss trade-offs
6. Complete with summary:
   - What was built
   - What patterns were applied
   - Suggested next steps (tests, documentation)

**Example:**
```
User: /guide
AI: "What do you want to create?"
User: A new endpoint for webhook status
AI: "Which project? [ingestion-api / live-dashboard / stream-engine]"
User: ingestion-api
AI: [Reads context, provides step-by-step guidance]
AI: "Step 1: Define the DTO. Should this return individual webhook status or a list?"
```
