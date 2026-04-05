import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { JobCompletedEvent, SocketEvents } from '@distributed-systems-lab/dto';
import { getCorsOptions } from 'src/config/cors-options';
import type { JobCompletedNotifier } from './job-completed-notifier';

@Injectable()
@WebSocketGateway({
  cors: getCorsOptions(),
})
export class MetricsGateway implements JobCompletedNotifier {
  @WebSocketServer()
  server: Server;

  /**
   * {@inheritdoc JobCompletedNotifier}
   */
  notifyJobCompleted(event: JobCompletedEvent): void {
    this.server.emit(SocketEvents.JOB_COMPLETED, event);
  }

  /**
   * Emits a job-completed event to all connected clients.
   * Prefer `notifyJobCompleted` for new code; this alias keeps tests and callers explicit.
   */
  emitJobCompleted(event: JobCompletedEvent): void {
    this.notifyJobCompleted(event);
  }
}
