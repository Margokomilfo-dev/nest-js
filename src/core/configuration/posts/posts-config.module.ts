import { Global, Module } from '@nestjs/common';
import { PostsConfigService } from './posts-config.service';

@Global()
@Module({
  providers: [PostsConfigService],
  exports: [PostsConfigService],
})
export class PostsConfigModule {}
