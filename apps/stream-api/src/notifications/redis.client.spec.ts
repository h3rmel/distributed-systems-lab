import { describe, it, expect, vi, beforeEach } from 'vitest';

const quitMock = vi.fn().mockResolvedValue('OK');

vi.mock('ioredis', () => ({
  default: class {
    quit = quitMock;
  },
}));

import { RedisClient } from './redis.client';

describe('RedisClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create Redis instance with config', () => {
    const client = new RedisClient({ host: 'localhost', port: 6379 });

    expect(client.instance).toBeDefined();
    expect(client.instance.quit).toBeDefined();
  });

  it('should call quit() on close()', async () => {
    const client = new RedisClient({ host: 'localhost', port: 6379 });

    await client.close();

    expect(quitMock).toHaveBeenCalledOnce();
  });
});
