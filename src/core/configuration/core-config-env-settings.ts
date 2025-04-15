import { ConfigModule } from '@nestjs/config';
import * as process from 'node:process';
import { join } from 'path';

export enum Environments {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TESTING = 'testing',
}

console.log('NODE_ENV:', process.env.NODE_ENV);
export const coreConfigEnvSettings = ConfigModule.forRoot({
  envFilePath: [
    process.env.ENV_FILE_PATH?.trim(), //приоритет 3 перезатрет вне нижние
    join(__dirname, '..', `env`, `.env.${process.env.NODE_ENV}.local`), //приоритет 2 перезатрет вне нижние
    join(__dirname, '..', `env`, `.env.${process.env.NODE_ENV}`), //приоритет 1  = development|production|testing
    join(__dirname, '..', `env`, `.env.production`), //приоритет 1  = production
  ],
  isGlobal: true,
});
