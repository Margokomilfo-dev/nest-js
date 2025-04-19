import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfigService } from './core/configuration/app/app-config.service';
import { ValidationPipe } from '@nestjs/common';
import {
  DomainException,
  DomainExceptionCode,
  Extension,
} from './core/exceptions/domain-exceptions';
import { ValidationError } from 'class-validator/types/validation/ValidationError';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const appConfig = app.get(AppConfigService);

  if (appConfig.IS_SWAGGER_ENABLED) {
    //from nestJS documentation
    const config = new DocumentBuilder()
      .setTitle('IT-incubator blogs-platform application')
      .setDescription('The API description')
      .setVersion('1.0')
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);
  }

  //Глобальный пайп для валидации и трансформации входящих данных.
  app.useGlobalPipes(
    //new ObjectIdTransformationPipe(), todo
    new ValidationPipe({
      transform: true,
      whitelist: true, // валидатор удалит из проверенного (возвращенного) объекта все свойства, которые не используют какие-либо декораторы валидации.
      stopAtFirstError: true, //Выдавать первую ошибку для каждого поля

      exceptionFactory: (errors) => {
        console.log('in exceptionFactory');
        const formattedErrors: Extension[] = [];

        //в определенном формате нам надо выводить ошибки
        const formatErrors = (
          errors: ValidationError[],
          extensions: Extension[],
        ) => {
          for (const error of errors) {
            if (error.constraints) {
              for (const key in error.constraints) {
                extensions.push({
                  message: `${error.constraints[key]}; Received value: ${error.value}`,
                  key: error.property,
                });
              }
            }

            if (error.children?.length) {
              formatErrors(error.children, extensions);
            }
          }
        };

        formatErrors(errors, formattedErrors);

        throw new DomainException({
          code: DomainExceptionCode.ValidationError,
          message: 'Validation failed',
          extensions: formattedErrors,
        });
      },
    }),
  );

  console.log('process.env.PORT :', appConfig.PORT);
  await app.listen(appConfig.PORT);
}

bootstrap();
