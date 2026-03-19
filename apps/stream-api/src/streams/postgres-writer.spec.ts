import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Writable } from 'node:stream';

const mockCopyStream = new Writable({
  write(_chunk, _enc, cb) {
    cb();
  },
});
const releaseMock = vi.fn();
const endMock = vi.fn().mockResolvedValue(undefined);
const connectMock = vi.fn().mockResolvedValue({
  query: vi.fn().mockReturnValue(mockCopyStream),
  release: releaseMock,
});

vi.mock('pg', () => ({
  Pool: class {
    connect = connectMock;
    end = endMock;
  },
}));

vi.mock('pg-copy-streams', () => ({
  default: {
    from: vi.fn().mockReturnValue('COPY FROM STDIN'),
  },
}));

import { DatabaseService } from './postgres-writer';

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DatabaseService({
      host: 'localhost',
      port: 5432,
      user: 'test',
      password: 'test',
      database: 'test_db',
    });
  });

  it('should create COPY stream from pool client', async () => {
    const { stream, done } = await service.createCopyStream();

    expect(stream).toBe(mockCopyStream);
    expect(done).toBeTypeOf('function');
  });

  it('should release client on done()', async () => {
    const { done } = await service.createCopyStream();

    await done();

    expect(releaseMock).toHaveBeenCalledOnce();
  });

  it('should close pool on close()', async () => {
    await service.close();

    expect(endMock).toHaveBeenCalledOnce();
  });
});
