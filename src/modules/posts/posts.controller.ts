import { Controller, Get } from '@nestjs/common';
import { PostsConfigService } from '../../core/configuration/posts/posts-config.service';
import { AppConfigService } from '../../core/configuration/app/app-config.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsConfigService: PostsConfigService,
    private readonly appConfigService: AppConfigService,
  ) {}

  @Get()
  getHello(): any {
    return {
      posts_count:
        this.postsConfigService.POST_MAX_COUNTS_CREATE_FOR_BLOG_BY_USER_PER_DAY,
      env: this.appConfigService.NODE_ENV,
    };
  }
}
