'use client';

import { useEffect, useState } from 'react';

import { ConnectionStatus } from '#/components/connection-status';
import { ConnectionState, socketManager } from '#/lib/socket-manager';
import { useMetricsStore } from '#/store/metrics';
import { ThroughputChart } from '#/components/throughput-chart';
import { LiveLogStream } from '#/components/live-log-stream';
import { MetricsCards } from '#/components/metrics-cards';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';

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
    <div className="h-dvh p-6">
      <Card className="flex h-full flex-col">
        <CardHeader className="flex flex:row items-center justify-between border-b p-4 pt-0">
          <CardTitle className="text-2xl font-semibold tracking-tight">Live Dashboard</CardTitle>
          <CardDescription>
            <ConnectionStatus state={connectionState} />
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 overflow-hidden p-0">
          <div className="flex-2/3 flex flex-col p-4">
            <h2 className="text-lg font-medium mb-2">Throughput (RPS)</h2>
            <ThroughputChart />
          </div>
          <div className="flex-1/3 flex flex-col border-l p-4">
            <h2 className="text-lg font-medium mb-2">Live Events</h2>
            <LiveLogStream />
          </div>
        </CardContent>
        <CardFooter className="border-t border-border flex flex-row items-center justify-between p-0">
          <MetricsCards connectionState={connectionState} />
        </CardFooter>
      </Card>
    </div>
  );
}
