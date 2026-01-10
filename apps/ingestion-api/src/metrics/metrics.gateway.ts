import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { JobCompletedEvent, SocketEvents } from '@distributed-systems-lab/dto';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [
      'http://localhost:3000',
    ],
    credentials: true,
  },
})
export class MetricsGateway {
  @WebSocketServer()
  server: Server;

  /**
   * Emits a job-completed event to all connected clients
   */
  emitJobCompleted(event: JobCompletedEvent): void {
    this.server.emit(SocketEvents.JOB_COMPLETED, event);
  }
}
