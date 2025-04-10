import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { IsNumber } from 'class-validator';
import { validationConfigUtility } from '../utils/validation-config.utility';

@Injectable()
export class BlogsConfigService {
  constructor(private readonly configService: ConfigService) {
    // валидация ошибок (если порт содержит не те символы, если урл не соотвествует условию и тд (тому, что в декораторе)
    validationConfigUtility.validatedErrors(this.configService);
  }

  @IsNumber(
    {},
    { message: 'Set Env variable BLOG_MAX_COUNTS_CREATE_FOR_USER, example: 1' },
  )
  BLOG_MAX_COUNTS_CREATE_FOR_USER = Number(
    this.configService.get('BLOG_MAX_COUNTS_CREATE_FOR_USER'),
  );
}
