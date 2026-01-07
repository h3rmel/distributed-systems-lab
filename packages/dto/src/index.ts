/**
 * Shared TypeScript type definitions for Distributed Systems Lab
 * 
 * This package provides type-safe interfaces for:
 * - Webhook data structures
 * - WebSocket events
 * - API responses
 * 
 * @packageDocumentation
 */

// Webhook types
export type { WebhookJobData, WebhookEvent, IngestResponseDto } from './webhook';

// Socket types
export type { JobCompletedEvent, SocketEventName } from './socket';
export { SocketEvents } from './socket';