'use client';

import { useMetricsStore } from '#/store/metrics';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { ScrollArea } from '#/components/ui/scroll-area';

export function LiveLogStream() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const events = useMetricsStore((state) => state.events);

  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () =>
      scrollRef.current?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]') ?? null,
    estimateSize: () => 64,
  });

  return (
    <ScrollArea ref={scrollRef} className="flex-1 min-h-0 border border-border">
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
              className="flex items-center justify-between px-3 border-b border-border text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground font-mono text-xs">{event.provider}</span>
                <span className="text-foreground font-mono truncate max-w-[180px]">
                  {event.eventId}
                </span>
              </div>
              <span className="text-muted-foreground text-xs">{event.processingTime}ms</span>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
