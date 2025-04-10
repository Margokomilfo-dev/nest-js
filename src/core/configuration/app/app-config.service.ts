import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { Environments } from '../core-config-env-settings';
import { validationConfigUtility } from '../utils/validation-config.utility';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {
    // валидация ошибок (если порт содержит не те символы, если урл не соотвествует условию и тд (тому, что в декораторе)
    validationConfigUtility.validatedErrors(this.configService);
  }

  @IsNumber({}, { message: 'Set Env variable PORT, example: 3000' })
  PORT = Number(this.configService.get('PORT'));

  @IsNotEmpty({
    message:
      'Set Env variable MONGO_URI, example: mongodb://localhost:27017/my-app-local-db',
  })
  MONGO_URI: string = this.configService.get('MONGO_URI');

  @IsEnum(Environments)
  NODE_ENV: string = this.configService.get('NODE_ENV');

  @IsBoolean({
    message: 'Set Env variable IS_SWAGGER_ENABLED, example: true/false',
  })
  IS_SWAGGER_ENABLED: boolean = validationConfigUtility.convertToBoolean(
    this.configService.get('IS_SWAGGER_ENABLED'),
  );
}
