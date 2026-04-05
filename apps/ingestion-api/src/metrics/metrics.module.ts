import { Module } from '@nestjs/common';
import { MetricsGateway } from './metrics.gateway';
import { JOB_COMPLETED_NOTIFIER } from './job-completed-notifier';

@Module({
  providers: [
    MetricsGateway,
    {
      provide: JOB_COMPLETED_NOTIFIER,
      useExisting: MetricsGateway,
    },
  ],
  exports: [MetricsGateway, JOB_COMPLETED_NOTIFIER],
})
export class MetricsModule {}
