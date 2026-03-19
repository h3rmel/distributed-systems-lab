'use client';

import { useMetricsStore } from '#/store/metrics';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '#/components/ui/chart';

const chartConfig = {
  rps: {
    label: 'RPS',
    color: '#10b981',
  },
} satisfies ChartConfig;

export function ThroughputChart() {
  const chartData = useMetricsStore((state) => state.chartData);

  return (
    <ChartContainer config={chartConfig} className="flex-1 min-h-0 w-full border border-border">
      <LineChart data={chartData} margin={{ left: -16 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 12 }}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Line
          type="monotone"
          dataKey="rps"
          stroke="var(--color-rps)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
