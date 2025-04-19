import { Global, Module } from '@nestjs/common';
import { NotificationConfigService } from './notification-config.service';

@Global()
@Module({
  providers: [NotificationConfigService],
  exports: [NotificationConfigService],
})
export class NotificationConfigModule {}
