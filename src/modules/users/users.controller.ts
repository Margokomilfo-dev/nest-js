import {
  Controller,
  Get,
  UseGuards,
  Request,
  Post,
  Body,
} from '@nestjs/common';
import { AppConfigService } from '../../core/configuration/app/app-config.service';
import { AuthConfigService } from '../../core/configuration/auth/auth-config.service';
import { UsersService } from './users.service';
//import { Public } from '../auth/guards/decorators/public.decorator';
import { IsObject, IsString } from 'class-validator';
import { LocalAuthGuard } from '../auth/guards/local-auth-guard/local-auth.guard';
import { JwtStrategyAuthGuard } from '../auth/guards/jwt-auth-guard/jwt-strategy-auth.guard';
import { JWTAuthGuard } from '../auth/guards/jwt-auth-guard/without-strategy/jwt-auth.guard';
import { BasicStrategyAuthGuard } from '../auth/guards/basic-auth-guard/basic-auth.guard';

class LoginInput {
  @IsString()
  username: string;
  @IsString()
  password: string;
}
class UserData {
  @IsString()
  name: string;
  @IsString()
  pass: string;
}
class UserRequestData {
  @IsObject()
  user: UserData;
}

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

  @UseGuards(JWTAuthGuard) //проверяет валидность токена пользователя
  //@Public() - если гард висит на весь контроллер, то можно отдельно на эндпоинты повесить декоратор, который позволит проигнорировать гард
  @Get('get-users')
  getUsers(): any {
    return this.userService.findAll();
  }

  // @UseGuards(AuthGuard('local')) //Вариант 1 - в реквест кладет информацию о юзере (берет данные из @Body() data: LoginInput)
  @UseGuards(LocalAuthGuard) //Вариант 2 - создали LocalAuthGuard класс, в реквест кладет информацию о юзере (берет данные из @Body() data: LoginInput и если данные корректные,т.е юзер с такими данными есть в системе, то достает юзера и кладет его в request.user). Здесь токенами не пользуемся
  @Post('auth/login')
  async login(
    @Request() req: UserRequestData,
    @Body() data: LoginInput,
  ): Promise<any> {
    console.log(data);
    return req.user;
  }

  @UseGuards(JwtStrategyAuthGuard)
  @Get('auth/login')
  async login2(@Request() req: UserRequestData): Promise<any> {
    return req.user;
  }

  @UseGuards(BasicStrategyAuthGuard)
  @Post('auth/basic-login')
  async login3(@Request() req: UserRequestData): Promise<any> {
    return req.user;
  }
}
