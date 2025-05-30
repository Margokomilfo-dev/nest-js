import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AppConfigService } from '../../../core/configuration/app/app-config.service';
import { AuthConfigService } from '../../../core/configuration/auth/auth-config.service';
import { UsersService } from '../application/users.service';
//import { Public } from '../auth/guards/decorators/public.decorator';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { LocalAuthGuard } from '../../auth/guards/local-auth-guard/local-auth.guard';
import { JwtStrategyAuthGuard } from '../../auth/guards/jwt-auth-guard/jwt-strategy-auth.guard';
import { BasicStrategyAuthGuard } from '../../auth/guards/basic-auth-guard/basic-auth.guard';
import { ApiParam } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { IsObjectIdPipe } from '@nestjs/mongoose';
import { CreateUserInput } from '../dto/input/create-user.input';
import { UsersQueryRepository } from '../infrastructure/users.query-repository';
import { UserOutput } from '../dto/output/user.output';
import { ObjectIdValidationTransformationPipe } from '../../../core/pipes/object-id-validation-transformation-pipe.service';
import { UpdateUserInput } from '../dto/input/update-user.input';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '../application/use-cases/create-user.use-case';
import { GetUserByIdQuery } from '../application/queries/get-user-by-id.query-handler';
import { UpdateUserCommand } from '../application/use-cases/update-user.use-case';
import { DeleteUserCommand } from '../application/use-cases/delete-user.use-case';

class LoginInput {
  @IsString()
  username: string;
  @IsString()
  password: string;
}
class UserData {
  @IsString()
  @IsNotEmpty()
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
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  getHello(): any {
    return {
      login: this.authConfigService.BASIC_AUTH_LOGIN,
      password: this.authConfigService.BASIC_AUTH_PASSWORD,
      env: this.appConfigService.NODE_ENV,
    };
  }

  //@UseGuards(JWTAuthGuard) //проверяет валидность токена пользователя
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

  @Post()
  async create(@Body() createUserDto: CreateUserInput): Promise<UserOutput> {
    const userId = await this.commandBus.execute(
      new CreateUserCommand(createUserDto),
    );
    return this.queryBus.execute(new GetUserByIdQuery(userId));
  }

  @ApiParam({ name: 'id' }) //для сваггера
  @Get('/byId/:id')
  findOne(@Param() id: string) {
    console.log(id);
    return 'This action returns a user';
  }

  @ApiParam({ name: 'id', type: 'string' }) //для сваггера
  @Get('/byUUId/:id')
  // global Pipe transform to Types.ObjectId does not work! todo
  // findOneByUUid(@Param('id') id: Types.ObjectId) {
  findOneByUUid(@Param('id', IsObjectIdPipe) id: string) {
    console.log('id:', new Types.ObjectId(id));
    return 'This action returns a user';
  }

  @ApiParam({ name: 'id', type: 'string' })
  @Put(':id')
  async updateUser(
    @Param('id', ObjectIdValidationTransformationPipe) id: Types.ObjectId,
    @Body() body: UpdateUserInput,
  ): Promise<UserOutput> {
    const updUserId = await this.commandBus.execute(
      new UpdateUserCommand(id, body),
    );
    return this.queryBus.execute(new GetUserByIdQuery(updUserId));
  }

  @ApiParam({ name: 'id' }) //для сваггера
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id', IsObjectIdPipe) id: string) {
    return this.commandBus.execute(new DeleteUserCommand(id));
  }
}
