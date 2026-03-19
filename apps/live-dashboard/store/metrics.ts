import { JobCompletedEvent } from '@distributed-systems-lab/dto';
import { create } from 'zustand';

export interface MetricsStore {
  events: JobCompletedEvent[];
  chartData: {
    time: string;
    rps: number;
  }[];
  addEvent: (event: JobCompletedEvent) => void;
  computeRPS: () => number;
  pushChartPoint: () => void;
}

export const useMetricsStore = create<MetricsStore>((set, get) => ({
  events: [],
  chartData: [],

  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, 100),
    })),

  computeRPS: () => {
    const now = Date.now();

    return get().events.filter((event) => now - Date.parse(event.timestamp) < 1000).length;
  },

  pushChartPoint: () => {
    const rps = get().computeRPS();
    const time = new Date().toLocaleTimeString();
    set((state) => ({
      chartData: [...state.chartData, { time, rps }].slice(-60),
    }));
  },
}));
