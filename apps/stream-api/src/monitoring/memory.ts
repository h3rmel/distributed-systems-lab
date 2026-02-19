import v8 from 'node:v8';

/**
 * Periodically logs v8 heap statistics for memory monitoring.
 * Warns when usage exceeds 400MB (approaching 512MB container limit).
 */
export class MemoryMonitor {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly intervalMs: number = 5000) {}

  /** Starts periodic memory monitoring. */
  start(): void {
    this.intervalId = setInterval(() => {
      const heapStats = v8.getHeapStatistics();
      const usedMb = heapStats.used_heap_size / 1024 / 1024;
      const totalMb = heapStats.heap_size_limit / 1024 / 1024;

      if (usedMb > 400) {
        console.warn(`⚠️ HIGH MEMORY: ${usedMb.toFixed(2)}MB / ${totalMb.toFixed(2)}MB`);
      } else {
        console.log(`Memory: ${usedMb.toFixed(2)}MB / ${totalMb.toFixed(2)}MB`);
      }
    }, this.intervalMs);
  }

  /** Stops the monitoring interval. */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
