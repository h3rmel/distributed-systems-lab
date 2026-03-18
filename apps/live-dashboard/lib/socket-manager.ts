import { Socket } from "socket.io-client";
import { createSocket } from "#/lib/socket";

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

type StateListener = (state: ConnectionState) => void;

class SocketManager {
  private socket: Socket | null = null;
  private state: ConnectionState = 'disconnected';
  private listeners = new Set<StateListener>();

  connect(): void {
    if (this.socket?.connect) return;

    this.setState('connecting');
    this.socket = createSocket();

    this.socket.on('connect', () => this.setState('connected'));
    this.socket.on('disconnect', () => this.setState('disconnected'));
    this.socket.on('reconnect_attempt', () => this.setState('connecting'));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.setState('disconnected');
  }

  getState(): ConnectionState {
    return this.state;
  }

  onStateChange(cb: StateListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private setState(state: ConnectionState): void {
    this.state = state;
    this.listeners.forEach((cb) => cb(state));
  }
}

export const socketManager = new SocketManager();
