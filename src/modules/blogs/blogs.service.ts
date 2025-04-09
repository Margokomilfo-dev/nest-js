import { Injectable } from '@nestjs/common';

@Injectable()
export class BlogsService {
  getHello(): string {
    return 'Hello Blogs!';
  }
}
