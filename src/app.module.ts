import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsModule } from './modules/posts/posts.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { ConfigurationModule } from './core/configuration/configuration.module';
import { ConfigurationService } from './core/configuration/configuration.service';
import { configurationEnvSettings } from './core/configuration/configuration-env-settings';

@Module({
  controllers: [AppController],

  imports: [
    ConfigurationModule,
    MongooseModule.forRootAsync({
      useFactory: (configurationService: ConfigurationService) => {
        return {
          uri: configurationService.MONGO_URI, //что бы configurationService не был undefined, мы его инжектим ниже
        };
      },
      inject: [ConfigurationService], //инжектим здесь
    }),
    configurationEnvSettings,
    PostsModule,
    BlogsModule,
  ],
  providers: [AppService],
  exports: [],
})
export class AppModule {}
