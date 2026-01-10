---
description: Provide guidance on testing strategy.
---

# `/test-guide [feature/function]`

**Purpose:** Provide guidance on testing strategy.

**AI Actions:**
1. Analyze code to be tested
2. Identify test scenarios:
   - Happy path cases
   - Edge cases
   - Error scenarios
   - Integration points
3. Suggest test structure:
   - Test file organization
   - Mock requirements
   - Assertion points
4. Provide test skeleton (if requested):
   ```typescript
   describe('WebhookService', () => {
     describe('enqueue', () => {
       it('should add job to queue with valid DTO', async () => {
         // Arrange
         // Act
         // Assert
       });
       
       it('should handle queue connection failure', async () => {
         // Test error handling
       });
     });
   });
   ```
5. Ask: "Would you like help with specific test cases?"

**Example:**
```
User: /test-guide WebhookService.enqueue
AI: [Provides test scenarios and structure guidance]
```
