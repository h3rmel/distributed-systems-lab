'use client';

import { ConnectionState } from '#/lib/socket-manager';
import { useMetricsStore } from '#/store/metrics';
import { useEffect, useState } from 'react';

const connectionColors: Record<ConnectionState, string> = {
  connected: 'text-emerald-400',
  connecting: 'text-yellow-400',
  disconnected: 'text-red-400',
};

interface MetricsCardsProps {
  connectionState: ConnectionState;
}

export function MetricsCards({ connectionState }: MetricsCardsProps) {
  const [rps, setRps] = useState<number>(0);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [avgProcessingTime, setAvgProcessingTime] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useMetricsStore.getState();

      setRps(state.computeRPS());
      setTotalEvents(state.events.length);
      const avg =
        state.events.length > 0
          ? state.events.reduce((sum, e) => sum + e.processingTime, 0) / state.events.length
          : 0;
      setAvgProcessingTime(Math.round(avg * 100) / 100);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const cards = [
    { label: 'Current RPS', value: rps, unit: 'req/s' },
    { label: 'Total Events', value: totalEvents, unit: '' },
    { label: 'Avg Processing', value: avgProcessingTime, unit: 'ms' },
  ];

  return (
    <>
      {cards.map(({ label, value, unit }) => (
        <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500 mb-1">{label}</p>
          <p className="text-2xl font-semibold text-zinc-100">
            {value}
            {unit && <span className="text-sm text-zinc-500 ml-1">{unit}</span>}
          </p>
        </div>
      ))}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-xs text-zinc-500 mb-1">Connection</p>
        <p className={`text-2xl font-semibold capitalize ${connectionColors[connectionState]}`}>
          {connectionState}
        </p>
      </div>
    </>
  );
}
