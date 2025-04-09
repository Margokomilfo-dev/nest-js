import { ConfigModule } from '@nestjs/config';
import * as process from 'node:process';

export enum Environments {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TESTING = 'testing',
}

export const configModule = ConfigModule.forRoot({
  envFilePath: [
    process.env.ENV_FILE_PATH?.trim(), //приоритет 3 перезатрет вне нижние
    `.env.${process.env.NODE_ENV}.local`, //приоритет 2 перезатрет вне нижние
    `.env.${process.env.NODE_ENV}`, //приоритет 1  = development|production|testing
  ],
});
