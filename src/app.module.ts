//импорт этого модуля должен быть на самом верху! Для того, чтобы переменные окружения подгружались на самом старте запуска приложения
import { configModule } from './core/config';

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsModule } from './modules/posts/posts.module';
import { BlogsModule } from './modules/blogs/blogs.module';

@Module({
  imports: [
    configModule,
    MongooseModule.forRoot(process.env.MONGO_URI),
    PostsModule,
    BlogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
