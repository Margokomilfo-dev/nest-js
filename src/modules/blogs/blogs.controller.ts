import { Controller, Get } from '@nestjs/common';
import { BlogsService } from './blogs.service';

@Controller()
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  getHello(): string {
    return this.blogsService.getHello();
  }
}
