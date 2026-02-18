# ADR-0005: Use Object Storage (S3/MinIO) for Stream API File Uploads

## Status

Accepted

## Context

The Stream API needs to process large CSV files (2GB+) with strict constraints:

- Memory limit: 512MB container RAM
- Must handle network failures gracefully
- Must support retry mechanisms without re-uploading entire file
- Must maintain streaming operations (no loading entire file into memory)

**Problem with direct streaming (HTTP → Database):**

- Network failure mid-upload → partial data in database (inconsistent state)
- Database failure after partial processing → wasted bandwidth, no retry
- Client disconnection → unclear state (did some rows get inserted?)
- No way to retry processing without re-uploading entire 2GB file

**Alternatives considered:**

1. **Direct streaming (HTTP → Database):** Fast but no retry, partial data risk
2. **Local temp file:** Uses container disk, doesn't survive restarts
3. **Object storage (S3/MinIO):** Persistent, retry-able, no local disk needed

## Decision

We will use **object storage (S3/MinIO)** as an intermediate buffer for file uploads.

**Architecture (Two-Stage Pipeline):**

- **Stage 1:** HTTP → Object Storage (streaming upload, return 202 Accepted)
- **Stage 2:** Object Storage → Database (streaming download, process, cleanup)

**Implementation:**

- Use `@aws-sdk/lib-storage` Upload class for streaming uploads
- Use `@aws-sdk/client-s3` GetObjectCommand for streaming downloads
- Use MinIO for local development (S3-compatible)
- Delete objects from storage after successful processing

## Consequences

### Positive

- **Network Reliability:** Upload completes before processing starts
- **Retry Mechanism:** Can retry processing without re-uploading entire file
- **No Local Disk:** Uses object storage instead of container filesystem
- **Horizontal Scaling:** Multiple instances can process same file
- **Memory Constraint:** Still maintains 512MB RAM limit (streaming operations)
- **Survivability:** Files persist even if container crashes

### Negative

- **Infrastructure:** Requires S3/MinIO service (additional dependency)
- **Latency:** Slight increase in end-to-end latency (but acceptable)
- **Cost:** Storage costs for temporary files (minimal, auto-deleted)
- **Complexity:** More moving parts (upload service, download service, cleanup)

### Implementation Notes

- Use `Upload` class for streaming HTTP → S3 (no local disk writes)
- Use `GetObjectCommand` for streaming S3 → Database pipeline
- Return HTTP 202 immediately after upload completes
- Process file asynchronously after upload
- Delete object from S3 after successful processing
- Keep object in S3 if processing fails (enable retry endpoint)
- Use MinIO for local dev, AWS S3 for production

## References

- [SPEC-STREAM-API.md](../SPEC-STREAM-API.md)
- [AWS SDK v3 Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
