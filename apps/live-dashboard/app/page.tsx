'use client';

import { useEffect, useState } from 'react';

import { ConnectionStatus } from '#/components/connection-status';
import { ConnectionState, socketManager } from '#/lib/socket-manager';
import { useMetricsStore } from '#/store/metrics';
import { ThroughputChart } from '#/components/throughput-chart';
import { LiveLogStream } from '#/components/live-log-stream';
import { MetricsCards } from '#/components/metrics-cards';

export default function Home() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  useEffect(() => {
    socketManager.connect();

    const unsubscribe = socketManager.onStateChange(setConnectionState);

    return () => {
      unsubscribe();
      socketManager.disconnect();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      useMetricsStore.getState().pushChartPoint();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Live Dashboard</h1>
        <ConnectionStatus state={connectionState} />
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4 min-h-[400px]">
          <h2 className="text-lg font-medium mb-3 text-zinc-200">Throughput (RPS)</h2>
          <ThroughputChart />
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 min-h-[400px]">
          <h2 className="text-lg font-medium mb-3 text-zinc-200">Live Events</h2>
          <LiveLogStream />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <MetricsCards connectionState={connectionState} />
      </div>
    </div>
  );
}
