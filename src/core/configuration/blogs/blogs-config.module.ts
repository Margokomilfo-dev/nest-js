import { Global, Module } from '@nestjs/common';
import { BlogsConfigService } from './blogs-config.service';

@Global()
@Module({
  providers: [BlogsConfigService],
  exports: [BlogsConfigService],
})
export class BlogsConfigModule {}
