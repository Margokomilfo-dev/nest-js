import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { IsBoolean, IsNumber, IsString } from 'class-validator';
import { validationConfigUtility } from '../utils/validation-config.utility';

@Injectable()
export class NotificationConfigService {
  constructor(private readonly configService: ConfigService) {
    // валидация ошибок (если порт содержит не те символы, если урл не соотвествует условию и тд (тому, что в декораторе)
    validationConfigUtility.validatedErrors(this.configService);
  }

  @IsString({
    message: 'Set Env variable MAIL_HOST, example: smtp.gmail.com',
  })
  MAIL_HOST = this.configService.get('MAIL_HOST');

  @IsNumber(
    {},
    {
      message: 'Set Env variable MAIL_PORT, example: 123',
    },
  )
  MAIL_PORT = this.configService.get('MAIL_PORT');

  @IsBoolean({ message: 'Set Env variable MAIL_SECURE, example: true/false' })
  MAIL_SECURE = validationConfigUtility.convertToBoolean(
    this.configService.get('MAIL_SECURE'),
  );

  @IsString({
    message: 'Set Env variable MAIL_USER, example: email@email.com',
  })
  MAIL_USER = this.configService.get('MAIL_USER');

  @IsString({
    message: 'Set Env variable MAIL_PASS, example: `123 dsg11 as`',
  })
  MAIL_PASS = this.configService.get('MAIL_PASS');
}
