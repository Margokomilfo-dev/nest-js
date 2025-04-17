import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class UsersRepository {
  //инжектирование модели через DI
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      _id: new Types.ObjectId(id),
      deletedAt: null,
    });
  }

  async save(user: UserDocument) {
    await user.save();
  }
  async findByLogin(login: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ login });
  }
  async findOrNotFoundFail(id: string): Promise<UserDocument> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('user not found');
    }

    return user;
  }
  async findAll(): Promise<UserDocument[]> {
    return this.UserModel.find();
  }
}
