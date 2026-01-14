# ADR-0004: Use Zustand over React Context for High-Frequency State Updates

## Status
Accepted

## Context
The Live Dashboard needs to display real-time metrics from WebSocket events:
- Receives 100+ events/second from ingestion API
- Must maintain 60 FPS rendering performance
- UI must remain responsive (CPU < 70%)
- Chart updates must be throttled to prevent re-render storms

**Problem with React Context:**
- Every context update triggers re-render of all consumers
- High-frequency updates (100+/sec) cause browser freeze
- Cannot throttle updates effectively at context level

**Alternatives considered:**
1. **React Context + useState:** Causes re-render storms, browser freeze
2. **Redux:** Overkill, complex setup, still causes re-renders
3. **Zustand:** Lightweight, external store, can update without triggering React re-renders
4. **Jotai/Recoil:** Atomic state management, but more complex than needed

## Decision
We will use **Zustand** for high-frequency state management in the Dashboard.

**Architecture:**
- Socket events update Zustand store directly (outside React)
- React components subscribe to store with throttled intervals (30-60 FPS)
- Store holds buffer of last 100 events
- UI updates happen at controlled rate, not on every event

## Consequences

### Positive
- **Performance:** No re-render storms, maintains 60 FPS
- **Simplicity:** Lightweight API, easy to use
- **Flexibility:** Can update store outside React lifecycle
- **Throttling:** Easy to implement throttled UI updates
- **Memory:** Efficient storage, only keeps last N events

### Negative
- **Learning Curve:** Team needs to understand external store pattern
- **State Management:** Need to be careful about state synchronization
- **Testing:** Slightly more complex to test than pure React state

### Implementation Notes
- Create Zustand store for metrics (events, RPS calculation)
- Socket listener updates store directly: `useMetricsStore.getState().addEvent(event)`
- Components use `useEffect` with `setInterval` to throttle updates (30 FPS)
- Do NOT subscribe directly to store in render (causes re-renders)
- Use TanStack Virtual for large lists (LiveLogStream)

## References
- [SPEC-DASHBOARD.md](../SPEC-DASHBOARD.md)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
