import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { UpdateUserInput } from '../dto/input/update-user.input';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';

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
  async deleteUser(id: string) {
    const user = await this.usersRepository.findOrNotFoundFail(id);

    user.makeDeleted();

    await this.usersRepository.save(user);
  }

  async updateUser(
    id: Types.ObjectId,
    dto: UpdateUserInput,
  ): Promise<Types.ObjectId> {
    const user = await this.usersRepository.findOrNotFoundFail(id.toString());

    user.update(dto);

    await this.usersRepository.save(user);

    return user._id;
  }
}
