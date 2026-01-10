import { Global, Module } from '@nestjs/common';
import { MetricsGateway } from './metrics.gateway';

@Global()
@Module({
  providers: [MetricsGateway],
  exports: [MetricsGateway],
})
export class MetricsModule {}
