- по дефолту все библиотеки были созданы
- добавила swagger, class-validation, mongoose(8ая версия, так как 11 не подходила из-за несоотвествия версий)

```javascript
pnpm add @nestjs/mongoose class-validator
pnpm i @nestjs/swagger -D
```

- подключила mongoose, добавив в app.module

```javascript
  imports: [MongooseModule.forRoot(`mongodb://localhost:27017/blogs-platform`)],
```

<b>end commit</b> #added mongoose, class-validator, swagger;  #start application

---

- устанавливаю cross-env, для того, чтобы на всех машинах с разными операционными системами из строки запуска правильно считывались envs

```javascript
pnpm i cross-env -D
scripts: {
"start:dev": "cross-env NODE_ENV=development PORT=8888 nest start --watch",
"start:debug": "cross-env NODE_ENV=development nest start --debug --watch",
"start:prod": "cross-env NODE_ENV=production node dist/main",
"test:watch": "cross-env NODE_ENV=testing jest --watch",
"test:cov": "cross-env NODE_ENV=testing jest --coverage",
"test:debug": "cross-env NODE_ENV=testing node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
"test:e2e": "cross-env NODE_ENV=testing jest --config ./test/jest-e2e.json"
},
```

Теперь все переменные окружения можно указывать в строке подключения

```javascript
 "start:dev": "cross-env NODE_ENV=development PORT=8888 MONGO_URI=mongodb://localhost:27017/blogs-platform nest start --watch",
```

НО ЭТО КАПЕЕЕЦ КАК НЕУДОБНО!!!

<b>end commit</b> #env configuration from command

---

потому что

- длинная строка подключения и сделить за переменными в командах
- постоянно во всем приложении вызывать process.env - не комильфо
- в production скриптах не хотелось бы секретные энвы светить

Поэтому читаем https://docs.nestjs.com/techniques/configuration
и следуем инструкции

- подключаем библиотеку

```javascript
pnpm add @nestjs/config -D
```

- в app.module в imports добавляю

```javascript
 imports: [
  ConfigModule.forRoot({
    envFilePath: ['.env.development'],
  }),
  //MongooseModule.forRoot(process.env.MONGO_URI),
  //PostsModule,
  //BlogsModule,
],
```

!!! Обязательно учитываем последовательность. Сначала энвайроманты интегрируем в модуль, а потом остальное

<b>end commit</b> #базовый запуск приложения с .env файлами. Поднимается, запускается.

---

Но, если использовать переменные за рамками жизненного цикла, то тогда они не будут видны...и ConfigModule хорошо бы вынести отдельно, чтобы его вызвать в сааамом начале запуска приложения!!!

- выносим отдельно ConfigModule и настраиваем, с учетом .envs
- добавляем файлы для энвайромантов

<b>end commit</b> #Part-1 настройка конигурационного модуля

---

Теперь реализуем логику, чтобы напрямую <b>не обращаться в коде к process.env.</b> (из контроллеров, из сервисов, из репозиториев)
Есть от неста ConfigService, который нужно положить в контсруктор класса, импортировать из nestJs/config

```javascript
import { ConfigService } from '@nestjs/config';
//
constructor (
  private configService: ConfigService,
)
//
//

const node_env = this.configService.get('NODE_ENV');
```

так же нужно в настройках configurationEnvSettings добавить свойство isGlobal=true

```javascript
export const configurationEnvSettings = ConfigModule.forRoot({
  envFilePath: [
    process.env.ENV_FILE_PATH?.trim(), //приоритет 3 перезатрет вне нижние
    `.env.${process.env.NODE_ENV}.local`, //приоритет 2 перезатрет вне нижние
    `.env.${process.env.NODE_ENV}`, //приоритет 1  = development|production|testing
  ],
  isGlobal: true,
});

```

с тем учетом, что все перемнные в енвайремантах имеют тип строки... И поэтому надо написать некую валирацию. Для этого создадим новый класс (провайдер, сервис), в котором будем инжектить ConfigModule и настраивать все переменные
```javascript
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigurationService {
  constructor(private readonly configService: ConfigService) {}
  // PORT = Number(process.env.PORT);
  PORT = Number(this.configService.get('PORT'));

  // MONGO_URI: string = process.env.MONGO_URI;
  MONGO_URI: string = this.configService.get('MONGO_URI');
}
```
Инжектим его в провайдеры app.module и теперь пользуемся им как вспомагатором

например

```javascript

@Controller()
export class AppController {
  constructor(private

  readonly
  onfigService: PostsConfigService
) {
}

@Get()
getHello()
:
any
{
  return {
    port: this.configService.PORT,
    mongo_uri: this.configService.MONGO_URI,
  };
}
}
```

!!! внутри функции booster вызывается process.env... но это не класс и мы не можем configurationService заинжектить. 
Но.. у нас есть app... а в несте у этого app можно с ioc достать все что нам нужно

```javascript
const appConfig = app.get(PostsConfigService);
console.log(appConfig.PORT)
```

так же у нас есть обращение к process.env в самом модуле, там где, например MongoUri  подключается. Ниже то, что есть:

```javascript

@Module({
  imports: [
    coreConfigEnvSettings,
    MongooseModule.forRoot(process.env.MONGO_URI),
    PostsModule,
    BlogsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PostsConfigService],
})
export class AppModule {
}

```

В несте можно этот вопрос решить с помощью forRootAsync и некотрой конфигурации модуля...

```javascript

@Global() //делаем глобальным, чтобы ConfigurationService был ему доступен... НЕХОРОШО его делать глобальным(( 
@Module({
  imports: [
    // было так, но мы хотим уйти от прямого обращения к process.env
    // MongooseModule.forRoot(process.env.MONGO_URI), 

    MongooseModule.forRootAsync({
      useFactory: (appConfigService: PostsConfigService) => {
        return {
          uri: appConfigService.MONGO_URI, //что бы PostsConfigService не был undefined, мы его инжектим ниже
        };
      },
      inject: [PostsConfigService], //инжектим здесь
    }),
    coreConfigEnvSettings,
    PostsModule,
    BlogsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PostsConfigService],
  exports: [PostsConfigService], //так же нужно его экспортировать, чтобы он был всем дрступен. в том числе и монгус
})
export class AppModule {
}
```

НОООО делать App Module Global не хорошо... а это мы делаем сейчас, чтобы в нашей useFactory был дступен ConfigurationService...

поэтому мы создадим отдельный модуль 

```javascript
import { Global, Module } from '@nestjs/common';
import { PostsConfigService } from './app-config.service';

@Global()
@Module({
  providers: [PostsConfigService],
  exports: [PostsConfigService],
})
export class PostsConfigModule {}

```

и сделаем его глобальным. Теперь AppModule можно переписать на следующий вариант

```javascript
//импорт этого модуля должен быть на самом верху! Для того, чтобы переменные окружения подгружались на самом старте запуска приложения
import { coreConfigEnvSettings } from './core/config';

import { Global, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsModule } from './modules/posts/posts.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { PostsConfigService } from './core/configuration.service';
import { PostsConfigModule } from './core/configuration.module';

@Module({
  imports: [
    PostsConfigModule,
    MongooseModule.forRootAsync({
      useFactory: (appConfigService: PostsConfigService) => {
        return {
          uri: appConfigService.MONGO_URI, //что бы PostsConfigService не был undefined, мы его инжектим ниже
        };
      },
      inject: [PostsConfigService], //инжектим здесь
    }),
    coreConfigEnvSettings,
    PostsModule,
    BlogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [],
})
export class AppModule {}
```
Приложение запустилось...

<b>end commit</b> #Part-2 настройка конфигурационного модуля

<b>end commit</b> #Part-2 настройка конфигурационного модуля

<b>end commit</b> #Part-3 настройка конфигурационного модуля

---
Подключение конфигурационного модуля во время сборки.
Так как при сборке на хостинге идет запуск приложения из dist... переменные .env не попадут и на этапе сборки приложение упадет.
Поэтому все энвайроманты мы перенесем в отдельную папку env в src (/core)

в файлк nest-cli.json добавляем настройки
```javascript
 "compilerOptions": {
    "deleteOutDir": true,
    "assets": [
      { "include": "**/env/*.env*","watchAssets": true}
    ]
  }
```
в файле core-config-env-settings.ts
```javascript
export const configModule = ConfigModule.forRoot({
  envFilePath: [
    process.env.ENV_FILE_PATH?.trim() || '',
    join(__dirname, '..', 'env', `.env.${process.env.NODE_ENV}.local`),
    join(__dirname, '..', 'env', `.env.${process.env.NODE_ENV}`), // и могут быть переопределены выше стоящими файлами
  ],
  isGlobal: true,
});
```

<b>end commit</b> #Part-3 настройка конфигурационного модуля

---