'use client';

import { useMetricsStore } from "#/store/metrics";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

export function LiveLogStream() {
  const parentRef = useRef<HTMLDivElement>(null);

  const events = useMetricsStore((state) => state.events);
  
  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
  });
  
  return (
    <div ref={parentRef} className="h-[350px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }} className="relative w-full">
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const event = events[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="flex items-center justify-between px-3 border-b border-zinc-800 text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 font-mono text-xs">{event.provider}</span>
                <span className="text-zinc-300 font-mono truncate max-w-[180px]">
                  {event.eventId}
                </span>
              </div>
              <span className="text-zinc-500 text-xs">{event.processingTime}ms</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
