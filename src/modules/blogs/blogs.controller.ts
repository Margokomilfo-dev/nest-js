import { Controller, Get } from '@nestjs/common';
import { BlogsConfigService } from '../../core/configuration/blogs/blogs-config.service';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsConfigService: BlogsConfigService) {}

  @Get()
  getHello(): number {
    return this.blogsConfigService.BLOG_MAX_COUNTS_CREATE_FOR_USER;
  }
}
