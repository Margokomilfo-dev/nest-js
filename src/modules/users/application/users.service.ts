import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private UserModel: UserModelType,
    private usersRepository: UsersRepository,
  ) {}

  async findOne(id: string): Promise<any | undefined> {
    return this.usersRepository.findOrNotFoundFail(id);
  }
  async findAll(): Promise<UserDocument[]> {
    return this.usersRepository.findAll();
  }
}
