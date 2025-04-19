import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfigService } from './core/configuration/app/app-config.service';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ObjectIdValidationPipe } from './validationPipes/object-id-validation.pipe';
import { ObjectIdTransformationPipe } from './validationPipes/object-id-transformation.pipe';

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

      exceptionFactory: (error) => {
        console.log(error);
        throw new BadRequestException('ошибка в валидации поля!'); //400, message='ошибка в валидации поля!', error: Bad Request
      },
    }),
  );

  console.log('process.env.PORT :', appConfig.PORT);
  await app.listen(appConfig.PORT);
}

bootstrap();
