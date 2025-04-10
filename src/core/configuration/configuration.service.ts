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
