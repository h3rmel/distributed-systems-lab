import { useMetricsStore } from "#/store/metrics";
import { JobCompletedEvent } from "@distributed-systems-lab/dto";
import { SocketEvents } from "@distributed-systems-lab/dto";
import { io, Socket } from "socket.io-client";

export function createSocket(): Socket {
  const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });

  socket.on(SocketEvents.JOB_COMPLETED, (data: JobCompletedEvent) => {
    useMetricsStore.getState().addEvent(data);
  });

  return socket;
}