import { ConnectionState } from '#/lib/socket-manager';

const config: Record<ConnectionState, { color: string; label: string }> = {
  connected: { color: 'bg-emerald-500', label: 'Connected' },
  connecting: { color: 'bg-yellow-500', label: 'Connecting...' },
  disconnected: { color: 'bg-red-500', label: 'Disconnected' },
};

interface ConnectionStatusProps {
  state: ConnectionState;
}

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  const { color, label } = config[state];

  return (
    <div className="flex items-center gap-2 text-sm text-zinc-400">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </div>
  );
}
