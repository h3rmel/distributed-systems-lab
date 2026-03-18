'use client';

import { useMetricsStore } from "#/store/metrics";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ThroughputChart() {
  const chartData = useMetricsStore((state) => state.chartData);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="time"
          stroke="#71717a"
          tick={{ fontSize: 12 }}
        />
        <YAxis
          stroke="#71717a"
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#18181b',
            border: '1px solid #3f3f46',
            borderRadius: '8px',
          }}
        />
        <Line
          type="monotone"
          dataKey="rps"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
