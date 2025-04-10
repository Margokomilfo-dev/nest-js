import { Controller, Get } from '@nestjs/common';
import { ConfigurationService } from './core/configuration/configuration.service';

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigurationService) {}

  @Get()
  getHello(): any {
    return {
      port: this.configService.PORT,
      mongo_uri: this.configService.MONGO_URI,
    };
  }
}
