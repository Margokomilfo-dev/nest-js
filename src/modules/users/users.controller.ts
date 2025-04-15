import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppConfigService } from '../../core/configuration/app/app-config.service';
import { AuthConfigService } from '../../core/configuration/auth/auth-config.service';
import { UsersService } from './users.service';
import { JWTAuthGuard } from '../auth/guards/jwt-auth-guard/jwt-auth.guard';
import { Public } from '../auth/guards/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(
    private readonly authConfigService: AuthConfigService,
    private readonly appConfigService: AppConfigService,
    private readonly userService: UsersService,
  ) {}

  @Get()
  getHello(): any {
    return {
      login: this.authConfigService.BASIC_AUTH_LOGIN,
      password: this.authConfigService.BASIC_AUTH_PASSWORD,
      env: this.appConfigService.NODE_ENV,
    };
  }

  @UseGuards(JWTAuthGuard)
  //@Public() - если гард висит на весь контроллер, то можно отдельно на эндпоинты повесить декоратор, который позволит проигнорировать гард
  @Get('get-users')
  getUsers(): any {
    return this.userService.findAll();
  }
}
