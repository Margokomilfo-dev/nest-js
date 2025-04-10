import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigurationService } from './core/configuration/configuration.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const appConfig = app.get(ConfigurationService);

  //from nestJS documentation
  const config = new DocumentBuilder()
    .setTitle('IT-incubator blogs-platform application')
    .setDescription('The API description')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  console.log('process.env.PORT :', appConfig.PORT);
  await app.listen(appConfig.PORT);
}

bootstrap();
