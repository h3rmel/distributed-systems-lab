import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import v8 from 'node:v8';
import { MemoryMonitor } from './memory';

describe('MemoryMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should start interval with configured ms', () => {
    const monitor = new MemoryMonitor(2000);

    monitor.start();
    vi.advanceTimersByTime(2000);

    expect(console.log).toHaveBeenCalled();
    monitor.stop();
  });

  it('should stop and clear interval on stop()', () => {
    const monitor = new MemoryMonitor(1000);

    monitor.start();
    vi.advanceTimersByTime(1000);
    const callCount = vi.mocked(console.log).mock.calls.length;

    monitor.stop();
    vi.advanceTimersByTime(5000);

    // No additional calls after stop
    const warnCount = vi.mocked(console.warn).mock.calls.length;
    expect(vi.mocked(console.log).mock.calls.length + warnCount).toBe(callCount + warnCount);
  });

  it('should not throw when stop() called without start()', () => {
    const monitor = new MemoryMonitor();

    expect(() => monitor.stop()).not.toThrow();
  });

  it('should warn when heap usage exceeds 400MB', () => {
    vi.spyOn(v8, 'getHeapStatistics').mockReturnValue({
      used_heap_size: 450 * 1024 * 1024,
      heap_size_limit: 512 * 1024 * 1024,
    } as ReturnType<typeof v8.getHeapStatistics>);

    const monitor = new MemoryMonitor(1000);
    monitor.start();
    vi.advanceTimersByTime(1000);

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('HIGH MEMORY'));
    monitor.stop();
  });

  it('should use default interval of 5000ms', () => {
    const monitor = new MemoryMonitor();

    monitor.start();

    // No log at 4999ms
    vi.advanceTimersByTime(4999);
    expect(console.log).not.toHaveBeenCalled();

    // Logs at 5000ms
    vi.advanceTimersByTime(1);
    expect(console.log).toHaveBeenCalled();

    monitor.stop();
  });
});
