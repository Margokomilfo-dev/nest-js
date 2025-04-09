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
-- -- 

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
-- --   
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
-- --
Но, если использовать переменные за рамками жизненного цикла, то тогда они не будут видны...и ConfigModule хорошо бы вынести отдельно, чтобы его вызвать в сааамом начале запуска приложения!!!

- выносим отдельно ConfigModule и настраиваем, с учетом .envs
- добавляем файлы для энвайромантов

<b>end commit</b> #Part-1 настройка конигурационного модуля
-- --