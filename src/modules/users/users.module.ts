import { Module } from '@nestjs/common';
import { UsersController } from './api/users.controller';
import { UsersService } from './application/users.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersRepository } from './infrastructure/users.repository';
import { UsersQueryRepository } from './infrastructure/users.query-repository';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { GetUserByIdQueryHandler } from './application/queries/get-user-by-id.query-handler';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    UsersQueryRepository,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    GetUserByIdQueryHandler,
  ],
  exports: [UsersService],
})
export class UsersModule {}
