import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { IsNumber } from 'class-validator';
import { validationConfigUtility } from '../utils/validation-config.utility';

@Injectable()
export class PostsConfigService {
  constructor(private readonly configService: ConfigService) {
    // валидация ошибок (если порт содержит не те символы, если урл не соотвествует условию и тд (тому, что в декораторе)
    validationConfigUtility.validatedErrors(this.configService);
  }

  @IsNumber(
    {},
    {
      message:
        'Set Env variable POST_MAX_COUNTS_CREATE_FOR_BLOG_BY_USER_PER_DAY, example: 1',
    },
  )
  POST_MAX_COUNTS_CREATE_FOR_BLOG_BY_USER_PER_DAY = Number(
    this.configService.get('POST_MAX_COUNTS_CREATE_FOR_BLOG_BY_USER_PER_DAY'),
  );
}
