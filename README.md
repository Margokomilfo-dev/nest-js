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
  //UsersModule,
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
  constructor(private readonly configService: PostsConfigService) {}

@Get()
getHello():any {
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
    UsersModule,
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
    UsersModule,
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
export class AuthConfigModule {}

```

и сделаем его глобальным. Теперь AppModule можно переписать на следующий вариант

```javascript
//импорт этого модуля должен быть на самом верху! Для того, чтобы переменные окружения подгружались на самом старте запуска приложения
import { coreConfigEnvSettings } from './core/config';

import { Global, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/posts/posts.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { PostsConfigService } from './core/configuration.service';
import { AuthConfigModule } from './core/configuration.module';

@Module({
  imports: [
    AuthConfigModule,
    MongooseModule.forRootAsync({
      useFactory: (appConfigService: PostsConfigService) => {
        return {
          uri: appConfigService.MONGO_URI, //что бы PostsConfigService не был undefined, мы его инжектим ниже
        };
      },
      inject: [PostsConfigService], //инжектим здесь
    }),
    coreConfigEnvSettings,
    UsersModule,
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

## Guards, passport-strategy
branch `guards-passport-strategy`
### создание JWTAuthGuard без стратегий
1) auth module, внутри папки лежат guards

JWT auth-guard, ниже подключение JwtModule, там где удет формироваться токен, т.е в authService 
```javascript
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      useFactory: (authConfigService: AuthConfigService) => ({
        global: true,
        secret: authConfigService.JWT_AUTH_SECRET,
        signOptions: { expiresIn: '60m' },
      }),
      inject: [AuthConfigService],
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}


@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

    async signIn(username: string, pass: string){
      const user = await this.usersService.findOne(username);
    
      if (user?.password !== pass) {
        throw new UnauthorizedException();
      }
      const payload = { username: user.username, sub: user.userId };
      return {
        access_token: await this.jwtService.signAsync(payload),
      };
  }
}
```

Но если нужно где-то(снаружи auth module/controller/service) заинжектить JwtService от JwtService, надо обязательно заИМПОРТировать JwtModule.

Например, гард мы вешаем на один из эндпоинтов контроллера Users.. значит в UsersModule нужно обязательно заИМПОРТировать JwtModule 
```javascript
@Module({
  imports: [JwtModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

2) создание JWTAuthGuard
3) подключение на контроллер или на эндпоинт
4) знакомимся с декоратором @Public() - если гард висит на весь контроллер, то можно отдельно на эндпоинты повесить декоратор, который позволит проигнорировать гард

<b>end commit</b> #1) jwt-guard without strategy

-- --

### Создание локального гарда, который будет проверять какие-то данные СО СТРАТЕГИЕЙ local
1) создание local.strategy.ts
```javascript
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }
  //достает из body username и password, ищет юзера, если такой есть, то кладет его в req.user, иначе Ошибка
  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```
2) создание local-auth.guard.ts
```javascript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

//чтобы не писать в контроллерах 'local'
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
```
3) в auth.module добавляем в imports и providers
```javascript
@Module({
  imports: [..., PassportModule],
  providers: [..., LocalStrategy],
})
export class AuthModule {}
```
4) в контроллере используем гард
```javascript
// Вариант 1 - в реквест кладет информацию о юзере (берет данные из @Body() data: LoginInput)
// @UseGuards(AuthGuard('local')) 

// Вариант 2 - создали LocalAuthGuard класс, в реквест кладет информацию о юзере (берет данные из @Body() 
// data: LoginInput и если данные корректные,т.е юзер с такими данными есть в системе, 
// то достает юзера и кладет его в request.user). Здесь токенами не пользуемся
@UseGuards(LocalAuthGuard) 
@Post('auth/login')
async login(
  @Request() req: UserRequestData,
@Body() data: LoginInput,
): Promise<any> {
  console.log(data);
  return req.user;
}
```

5) переопределение полей из Body в стратегии,так как они там по дефолту username и password
```javascript
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService
) {
  super({ usernameField: 'name', passwordField: 'pass' });
}

//...
}
```
<b>end commit</b> #2) simple local-guard with strategy

-- --
### Создание JWT AUTH гарда, который будет проверять токен СО СТРАТЕГИЕЙ jwt
т.к ранее уже был подключен import { JwtService } from '@nestjs/jwt';  и написана логика валидации и созданий accessToken, 
то используем то, что у нас уже есть в AuthService

```javascript
async validateUser(username: string, pass: string): Promise<any> {...}
async login(user: any) {
  ...
  return {
    access_token: this.jwtService.sign(payload),
  };
}
```
- так же есть подклбченный AuthConfigService с переменными (secret)
- в authModule подклбчен JwtModule
1) создание jwt.strategy.ts
```javascript
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
```
2) создание jwt-local-auth.guard.ts
```javascript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtLocalAuthGuard extends AuthGuard('jwt') {}
```
3) Поключение стратегии в AuthModule 
4) Использование Guard в контроллере

Все аналогично local стратегии.

!!! НЕ ЗАБЫВАЕМ УСТАНАВЛИВАТЬ СООТВЕТСВУЮЩИЕ БИБЛ

<b>end commit</b> #3) jwt-guard with strategy

-- --
### Создание BACIC AUTH гарда, который будет проверять токен СО СТРАТЕГИЕЙ 'basic'
по аналогии с предыдущими случаями

только в самой стратегии в validate функцию в параметры приходит первый параметр req
```javascript
  //basic.strategy.ts
  async validate(
      req: Request, //!!!!!!!!!!!!!!1
      username: string,
      password: string,
    ): Promise<any> {
      const user = await this.authService.validateUser(username, password);
      if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```
<b>end commit</b> #4) basic-guard with strategy

-- --
## Validation (ValidationPipe)
Для проверки входных данных от клиента (query, body) Экспортируется ValidationPipe из @nestjs/common пакета.

```javascript
pnpm add class-validator class-transformer
```

```javascript
//Глобальный пайп для валидации и трансформации входящих данных.
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true, // валидатор удалит из проверенного (возвращенного) объекта все свойства, которые не используют какие-либо декораторы валидации.
    stopAtFirstError: true, //Выдавать первую ошибку для каждого поля
  }),
);

class UserData {
  @IsString()
  name: string;
  
  @IsString()
  @IsNotEmpty()
  pass: string;
}

@Post()
create(@Body() createUserDto: UserData) {
  return 'This action adds a new user';
}
```
Теперь при запросе на Post запрос метода create приложение валидирует входящие данные относительно декораторов указанных в классе dto

Если данные будут клиентом некорректно введены, то респнс клиенту будет следующий
```javascript
{
  "statusCode": 400,
  "message": [
    "name must be a string",
    "pass must be a string"
  ],
  "error": "Bad Request"
}
```
Обработка Respose - следующая тема

так же можно валидировать и входящие параметры в Url
```javascript
export class FindOneParams {
  @IsNumberString()
  id: string;
}

@Get(':id')
findOne(@Param() params: FindOneParams) {
  return 'This action returns a user';
}
```
Будет возвращена ошибка, если Id был не числоподобный :)

А так же можно повесить индивидуальную валидацию на входящие данные 
```javascript
@Param('id', ParseIntPipe) id: number,
@Query('sort', ParseBoolPipe) sort: boolean

@ParseIntPipe
@ParseBoolPipe
@ParseArrayPipe
@ParseUUIDPipe
```
<b>end commit</b> #1) basic ValidationPipe

-- --


