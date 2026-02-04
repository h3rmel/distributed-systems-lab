import v8 from 'node:v8';

export function startMemoryMonitoring(intervalMs: number = 5000) {
  const intervalId = setInterval(() => {
    const heapStats = v8.getHeapStatistics();
    const usedMb = heapStats.used_heap_size / 1024 / 1024;
    const totalMb = heapStats.heap_size_limit / 1024 / 1024;
  
    if (usedMb > 400) {
      console.warn(
        `⚠️ HIGH MEMORY: ${usedMb.toFixed(2)}MB / ${totalMb.toFixed(2)}MB`
      );
    } else {
      console.log(
        `Memory: ${usedMb.toFixed(2)}MB / ${totalMb.toFixed(2)}MB`
      );
    }
  }, intervalMs);

  return () => clearInterval(intervalId);
}