import { Controller, Get } from '@nestjs/common';
import { AppConfigService } from './core/configuration/app/app-config.service';

@Controller('app')
export class AppController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Get()
  getHello(): any {
    return {
      port: this.appConfigService.PORT,
      mongo_uri: this.appConfigService.MONGO_URI,
    };
  }
}
