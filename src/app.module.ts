import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsModule } from './modules/posts/posts.module';
import { BlogsModule } from './modules/blogs/blogs.module';

@Module({
  imports: [
    MongooseModule.forRoot(`mongodb://localhost:27017/blogs-platform`),
    PostsModule,
    BlogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
