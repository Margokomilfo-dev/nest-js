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
import { APP_FILTER } from '@nestjs/core';
import { DomainHttpExceptionsFilter } from './core/exceptions/filters/domain-exceptions.filter';
import { AllHttpExceptionsFilter } from './core/exceptions/filters/all-exceptions.filter';
import { CoreModule } from './core/core.module';
import { NotificationConfigModule } from './core/configuration/notification/notification-config.module';
import { NotificationsModule } from './core/notifiactions/notifications.module';

const configModules = [
  coreConfigEnvSettings,
  CoreModule,
  AppConfigModule,
  BlogsConfigModule,
  PostsConfigModule,
  AuthConfigModule,
  NotificationConfigModule,
];

@Module({
  imports: [
    ...configModules,
    AuthModule,
    MongooseModule.forRootAsync({
      useFactory: (appConfigService: AppConfigService) => ({
        uri: appConfigService.MONGO_URI, //что бы appConfigService не был undefined, мы его инжектим ниже
      }),
      inject: [AppConfigService], //инжектим здесь
    }),
    PostsModule,
    BlogsModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    //регистрация глобальных exception filters
    //важен порядок регистрации! Первым сработает DomainHttpExceptionsFilter!
    {
      provide: APP_FILTER,
      useClass: AllHttpExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DomainHttpExceptionsFilter,
    },
  ],
  exports: [],
})
export class AppModule {}
