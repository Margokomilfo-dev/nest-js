import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsModule } from './modules/posts/posts.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { coreConfigEnvSettings } from './core/configuration/core-config-env-settings';
import { AppConfigModule } from './core/configuration/app/app-config.module';
import { AppConfigService } from './core/configuration/app/app-config.service';
import { BlogsConfigModule } from './core/configuration/blogs/blogs-config.module';
import { PostsConfigModule } from './core/configuration/posts/posts-config.module';
import { AuthConfigModule } from './core/configuration/auth/auth-config.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';

const configModules = [
  coreConfigEnvSettings,
  AppConfigModule,
  BlogsConfigModule,
  PostsConfigModule,
  AuthConfigModule,
];
@Module({
  imports: [
    ...configModules,
    AuthModule,
    MongooseModule.forRootAsync({
      useFactory: (appConfigService: AppConfigService) => {
        console.log(appConfigService);
        return {
          uri: appConfigService.MONGO_URI, //что бы appConfigService не был undefined, мы его инжектим ниже
        };
      },
      inject: [AppConfigService], //инжектим здесь
    }),
    PostsModule,
    BlogsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [],
})
export class AppModule {}
