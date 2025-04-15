import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { IsString } from 'class-validator';
import { validationConfigUtility } from '../utils/validation-config.utility';

@Injectable()
export class AuthConfigService {
  constructor(private readonly configService: ConfigService) {
    // валидация ошибок (если порт содержит не те символы, если урл не соотвествует условию и тд (тому, что в декораторе)
    validationConfigUtility.validatedErrors(this.configService);
  }

  @IsString({
    message: 'Set Env variable BASIC_AUTH_LOGIN, example: login',
  })
  BASIC_AUTH_LOGIN = this.configService.get('BASIC_AUTH_LOGIN');

  @IsString({
    message: 'Set Env variable BASIC_AUTH_PASSWORD, example: 1234qwerty',
  })
  BASIC_AUTH_PASSWORD = this.configService.get('BASIC_AUTH_PASSWORD');

  @IsString({
    message: 'Set Env variable JWT_AUTH_SECRET, example: secret',
  })
  JWT_AUTH_SECRET = this.configService.get('JWT_AUTH_SECRET');
}
