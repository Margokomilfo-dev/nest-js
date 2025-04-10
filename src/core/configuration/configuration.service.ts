import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { IsNumber, IsNotEmpty, validateSync } from 'class-validator';

@Injectable()
export class ConfigurationService {
  constructor(private readonly configService: ConfigService) {
    // валидация ошибок (если порт содержит не те символы, если урл не соотвествует условию и тд (тому, что в декораторе)
    const errors = validateSync(this);
    if (errors.length > 0) {
      const shortErrorsArray = errors
        .map((e) => Object.values(e.constraints || {}).join(', '))
        .join('; ');
      throw new Error('Validation failed:' + shortErrorsArray);
    }
  }

  @IsNumber({}, { message: 'Set Env variable PORT, example: 3000' })
  PORT = Number(this.configService.get('PORT'));

  @IsNotEmpty({
    message:
      'Set Env variable MONGO_URI, example: mongodb://localhost:27017/my-app-local-db',
  })
  MONGO_URI: string = this.configService.get('MONGO_URI');
}
