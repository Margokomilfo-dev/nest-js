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
export class NotificationConfigModule {}

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
import { NotificationConfigModule } from './core/configuration.module';

@Module({
  imports: [
    NotificationConfigModule,
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
         useFactory: (authConfigService: NotificationConfigService) => ({
            global: true,
            secret: authConfigService.JWT_AUTH_SECRET,
            signOptions: { expiresIn: '60m' },
         }),
         inject: [NotificationConfigService],
      }),
   ],
   providers: [AuthService],
   controllers: [AuthController],
   exports: [AuthService],
})
export class AuthModule {
}


@Injectable()
export class AuthService {
   constructor(private

   usersService: UsersService
,
   private jwtService: JwtService
) {
}

async
signIn(username
:
string, pass
:
string
)
{
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

- так же есть подклбченный NotificationConfigService с переменными (secret)
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

Т.е должен быть проверяющий декоратор. Если его нет, папйп не проверит, корректно
на квери параментры нужно вешать либо классы с декораторами, что будет работать предсказуемо по вышенаписанному сценарию, либо локальные пайпы, но тогда ошибки уйдут в global exeptionFilter

если мы хотим обработать ошибки уникально, с помощью своего DomainFilterException, то нужно добавить функцию в описании подключения пайпа

```javascript
 app.useGlobalPipes(
    //new ObjectIdTransformationPipe(), todo
    new ValidationPipe({
      transform: true,
      whitelist: true, // валидатор удалит из проверенного (возвращенного) объекта все свойства, которые не используют какие-либо декораторы валидации.
      stopAtFirstError: true, //Выдавать первую ошибку для каждого поля

      exceptionFactory: (errors) => {
        const formattedErrors: Extension[] = [];

        //функция, если в определенном формате нам надо выводить ошибки
        //...

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
```
Так же можно написать логику своего кастомного пайпа, который будет не только проверять на ObjectId, но и трансформировать
```javascript
async updateUser(
@Param('id', ObjectIdValidationTransformationPipe) id: Types.ObjectId,
@Body() body: UpdateUserInput,
): Promise<UserOutput> {
  //...
}
```
```javascript
@Injectable()
export class ObjectIdValidationTransformationPipe implements PipeTransform {
  transform(value: any) {
    if (Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }
    throw new DomainException({
      code: DomainExceptionCode.ValidationError,
      message: `Invalid ObjectId: ${value}`,
    });
  }
}
```
Ошибка будет падать сразу в AllExceptionFilter, так как жто локальный фильтр (не в globalPipe exception)
<b>end commit</b> #1) basic ValidationPipe

---

## ExceptionsFilters (user entity)

Для того, чтобы отлавливать ошибки и упаковоывать их в свой вариант ответа, можно написать свои кастомные филтры (DomainFilter)... либо оптимизировать дефолтные (например, allExceptionFilter)

Создадим класс, с помощью которого мы будем генерировать нужный ответ
```javascript
export class DomainException extends Error {
   message: string;
   code: DomainExceptionCode;
   extensions: Extension[];

   constructor(errorInfo: {
      code: DomainExceptionCode;
      message: string;
      extensions?: Extension[];
   }) {
      super(errorInfo.message);
      this.message = errorInfo.message;
      this.code = errorInfo.code;
      this.extensions = errorInfo.extensions || [];
   }
}
```
а так же напишем два фильтра, один - новый, другой - модификация "подкапотного"

```javascript
@Catch()
//модификация подкапотного - всегда будет срабатывать при catch 
export class AllHttpExceptionsFilter implements ExceptionFilter {
   catch(exception: any, host: ArgumentsHost): void {
      console.log('in ALL EXCEPTIONS FILTER');
      //ctx нужен, чтобы получить request и response (express). Это из документации, делаем по аналогии
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();

      //Если сработал этот фильтр, то пользователю улетит 500я ошибка
      const message = exception.message || 'Unknown exception occurred.';
      const status = HttpStatus.INTERNAL_SERVER_ERROR;
      const responseBody = this.buildResponseBody(request.url, message);

      response.status(status).json(responseBody);
   }

   private buildResponseBody(
           requestUrl: string,
           message: string,
   ): ErrorResponseBody {
      //TODO: Replace with getter from configService. will be in the following lessons
      const isProduction = process.env.NODE_ENV === 'production';

      if (isProduction) {
         return {
            timestamp: new Date().toISOString(),
            path: null,
            message: 'Some error occurred',
            extensions: [],
            code: DomainExceptionCode.InternalServerError,
         };
      }

      return {
         timestamp: new Date().toISOString(),
         path: requestUrl,
         message,
         extensions: [],
         code: DomainExceptionCode.InternalServerError,
      };
   }
}
```
```javascript
//Ошибки класса DomainException (instanceof DomainException)
@Catch(DomainException)
export class DomainHttpExceptionsFilter implements ExceptionFilter {
   catch(exception: DomainException, host: ArgumentsHost): void {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();

      const status = this.mapToHttpStatus(exception.code);
      const responseBody = this.buildResponseBody(exception, request.url);

      response.status(status).json(responseBody);
   }

   private mapToHttpStatus(code: DomainExceptionCode): number {
      switch (code) {
         case DomainExceptionCode.BadRequest:
         case DomainExceptionCode.ValidationError:
         case DomainExceptionCode.ConfirmationCodeExpired:
         case DomainExceptionCode.EmailNotConfirmed:
         case DomainExceptionCode.PasswordRecoveryCodeExpired:
            return HttpStatus.BAD_REQUEST;
         case DomainExceptionCode.Forbidden:
            return HttpStatus.FORBIDDEN;
         case DomainExceptionCode.NotFound:
            return HttpStatus.NOT_FOUND;
         case DomainExceptionCode.Unauthorized:
            return HttpStatus.UNAUTHORIZED;
         case DomainExceptionCode.InternalServerError:
            return HttpStatus.INTERNAL_SERVER_ERROR;
         default:
            return HttpStatus.I_AM_A_TEAPOT;
      }
   }

   private buildResponseBody(
           exception: DomainException,
           requestUrl: string,
   ): ErrorResponseBody {
      return {
         timestamp: new Date().toISOString(),
         path: requestUrl,
         message: exception.message,
         code: exception.code,
         extensions: exception.extensions,
      };
   }
}

export type ErrorResponseBody = {
   timestamp: string;
   path: string | null;
   message: string;
   extensions: Extension[];
   code: DomainExceptionCode;
};
```
Останется теперб их только подключить к приложению
```javascript
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
```
Теперь чтобы получить ответ в должном виде, в приложение стоит только отправить ошибку следущим образом:

```javascript
 throw new DomainException({
   code: DomainExceptionCode.ValidationError,
   message: 'Validation failed',
   extensions: formattedErrors,
});
```
---

## Mongoose (user entity)

```javascript
pnpm add @nestjs/mongoose mongoose
```

1) подключение
   1.1) базовое:

```javascript
@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/nest-blogger-platform'), // Укажите свой URL MongoDB
    UserAccountsModule,
  ],
})
export class AppModule {}
```

1.2) с использование перменных окружения (env-configuration branch)

```javascript
@Module({
  imports: [
    //...
    MongooseModule.forRootAsync({
      useFactory: (appConfigService: AppConfigService) => ({
        uri: appConfigService.MONGO_URI, //что бы appConfigService не был undefined, мы его инжектим ниже
      }),
      inject: [AppConfigService], //инжектим здесь
    }),
  //...
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [],
})
```

2) Создание схемы

```javascript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { Name, NameSchema } from './name.schema';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { UpdateUserInput } from '../dto/input/update-user.input';

//флаг timestemp автоматичеки добавляет поля upatedAt и createdAt
@Schema({ timestamps: true })
export class User {
  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: String, required: true })
  login: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({
    type: String,
    required: true,
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
  })
  email: string;

  @Prop({ type: NameSchema })
  name: Name;

  @Prop({ type: Date, nullable: true })
  deletedAt: Date | null;

  //метод-фабрика. Создает объект, но не сохраняет в бд! обращаться надо напрямую к Model
  static createInstance(dto: CreateUserDomainDto): UserDocument {
    const user = new this();
    user.email = dto.email;
    user.password = dto.pass;
    user.login = dto.login;

    user.name = {
      firstName: 'firstName xxx',
      lastName: 'lastName yyy',
    };

    return user as UserDocument;
  }

  //метод, который можно вызвать у полученного инстанса (не напрямую к Model), но не сохраняет в бд!
  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deletedAt = new Date();
  }

  //метод, который можно выззвать у полученного инстанса (не напрямую к Model), но не сохраняет в бд!
  update(dto: UpdateUserInput) {
    if (dto.email !== this.email) {
      this.email = dto.email;
    }
  }
}
//создает схему на основе класса
export const UserSchema = SchemaFactory.createForClass(User);

//регистрирует методы сущности в схеме
UserSchema.loadClass(User);

//Типизация документа
export type UserDocument = HydratedDocument<User>;

//Типизация модели + статические методы
export type UserModelType = Model<UserDocument> & typeof User;
```

3) Подключение схемы

```javascript
@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, UsersQueryRepository],
  exports: [UsersService],
})
export class UsersModule {}
```

4) Использование схемы в репозитории, сервисе
5) Добавление UsersQueryRepository для query запросов
6) Не забываем, что у нас стоит в папйпе условие проверять входящие данные и декораторы в них обязательны, иначе данных не видно
   <b>end commit</b> mongoose (integration to user entity)

---

## Decorator IsStringWithTrim (branch `decorators`)

```javascript
//creating of custom decorator
export const IsStringWithTrim = (minLength: number, maxLength: number) =>
  applyDecorators(
    IsString(),
    Length(minLength, maxLength),

    Transform(({ value }: TransformFnParams) => {
      return typeof value === 'string' ? value.trim() : value;
    }),
  );

//use it into dto
@IsStringWithTrim(3, 20) //проверит + удалит пробелы
email: string;
```

<b>end commit</b> decorator IsStringWithTrim

-- --

## CQRS

1) pnpm add @nestjs/cqrs
2) создаем отедльный можуль, делаем его глобальным, так как CqrsModule надо сдеать глобальным.
```javascript
//глобальный модуль для провайдеров и модулей необходимых во всех частях приложения (например LoggerService, CqrsModule, etc...)
@Global()
@Module({
   imports: [CqrsModule],
   exports: [CqrsModule],
   providers: [],
})
export class CoreModule {}
```
3) модуль User декомпозируем... сервисы на юз-кейсы, юз-кейсы упаковываем в команды. Логика query если сложная, то уводим ее в queryHandlers

Пример ниже: 
```javascript
@Controller('users')
export class UsersController {
   constructor(
   //...
   private readonly queryBus: QueryBus,
   private readonly commandBus: CommandBus,
) {
   //...
   @Post()
   async create(@Body() createUserDto: CreateUserInput): Promise<UserOutput> {
      const userId = await this.commandBus.execute(
              new CreateUserCommand(createUserDto),
      );
      return this.queryBus.execute(new GetUserByIdQuery(userId));
   }
}
```
```javascript

export class CreateUserCommand {
   constructor(public dto: CreateUserInput) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
   constructor(
           @InjectModel(User.name) private UserModel: UserModelType,
   private usersRepository: UsersRepository,
) {}
async execute({ dto }: CreateUserCommand): Promise<Types.ObjectId> {
   const userWithTheSameLogin = await this.usersRepository.findByLogin(
           dto.login,
   );
   if (!!userWithTheSameLogin) {
   throw new BadRequestException('User with the same login already exists');
}

const user = this.UserModel.createInstance({
   email: dto.email,
   login: dto.login,
   pass: dto.pass,
});

await this.usersRepository.save(user);

return user._id;
}
}
```
```javascript
export class GetUserByIdQuery { 
  constructor(public id: Types.ObjectId) {}
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdQueryHandler implements IQueryHandler<GetUserByIdQuery> {
   constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

   execute({ id }: GetUserByIdQuery): Promise<UserOutput> {
      return this.usersQueryRepository.findOrNotFoundFail(id);
   }
}
```
---
## Nodemailer, send message to email of customer
1) создать гугл акк
2) зайти в настройки аккаунта
   2.1) включить двухфакторную
   2.2) перейти по ссылке https://myaccount.google.com/apppasswords
   2.3) создать название приложения (н-р, nodeMailer)
   2.4) сохранить код, который будет дан системой (использовать его надо убдет вместо пароля от почты)
3) pnpm add nodemailer, 
4) pnpm add @nestjs-modules/mailer
5) в енвайроманты добавляем новые переменные относитльно раоботы с почтой
```javascript
MAIL_HOST=//заполнить
MAIL_PORT=//заполнить
MAIL_SECURE=//заполнить
MAIL_USER=blabla@gmail.com//заполнить
MAIL_PASS=codeFromGMAIL //код при создании приложения в настройках аккаунта
```
6) создаем конфигурационные настройки (NotificationConfigModule, NotificationConfigService), подключаем в Импорты app.module.ts NotificationConfigModule
7) создаем модуль с нотификациями
```javascript
@Module({
   imports: [
      MailerModule.forRootAsync({
         imports: [NotificationConfigModule],
         inject: [NotificationConfigService],
         useFactory: (notificationConfigService: NotificationConfigService) => {
            console.log(notificationConfigService);
            return {
               transport: {
                  host: notificationConfigService.MAIL_HOST,
                  port: notificationConfigService.MAIL_PORT,
                  secure: notificationConfigService.MAIL_SECURE, // true для порта 465, false для 587
                  auth: {
                     user: notificationConfigService.MAIL_USER,
                     pass: notificationConfigService.MAIL_PASS,
                  },
               },
               defaults: {
                  from: `"No Reply =) " <${notificationConfigService.MAIL_USER}>`,
               },
            };
         },
      }),
   ],
   providers: [
      EmailService,
      SendConfirmationEmailWhenUserRegisteredEventHandler,
   ],
   exports: [],
})
export class NotificationsModule {}
```
8) не заыбваем модуль добавить в app.module.ts
9) создаем сервис, которые сообщения отправляет, сервис добавляем в providers: [] модуля (выше)
```javascript
@Injectable()
export class EmailService {
   constructor(private mailerService: MailerService) {}

async sendConfirmationEmail(email: string, code: string): Promise<void> {
   await this.mailerService.sendMail({
      to: email,
      subject: 'Email confirmation - TEST',
      text: `confirm registration via link https://some.com?code=${code}`,
   });
  }
}
```
10) создаем SendConfirmationEmailWhenUserRegisteredEventHandler, handler, который будет вызываться шиной() при событии SendInvitationEvent
```javascript
export class SendInvitationEvent {
   constructor(public readonly email: string, public confirmationCode: string) {}
}

@EventsHandler(SendInvitationEvent)
export class SendConfirmationEmailWhenUserRegisteredEventHandler
        implements IEventHandler<SendInvitationEvent>
{
   constructor(private emailService: EmailService) {}

async handle(event: SendInvitationEvent) {
   // Ошибки в EventHandlers не могут быть пойманы фильтрами исключений:
   // необходимо обрабатывать вручную
   try {
      console.log('event:', event);
      await this.emailService.sendConfirmationEmail(
              event.email,
              event.confirmationCode,
      );
   } catch (e) {
      console.error('send email', e);
   }
}
}
```
11) SendConfirmationEmailWhenUserRegisteredEventHandler добавим в провайдеры в модуле NotificationsModule
12) вызовем где надо наш метод событий и проверим как он работает
```javascript
export class CreateUserCommand {
  constructor(public dto: CreateUserInput) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
  constructor(
    //...
    private eventBus: EventBus,
  ) {}
  async execute({ dto }: CreateUserCommand): Promise<Types.ObjectId> {
    //...
    //!!!!!!!!!!
    this.eventBus.publish(new SendInvitationEvent(user.email, '12345'));
    //..
  }
}
```
