import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UserOutput } from '../dto/output/user.output';

@Injectable()
export class UsersQueryRepository {
  //инжектирование модели через DI
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {}

  private findById(id: Types.ObjectId): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      _id: new Types.ObjectId(id),
      deletedAt: null,
    });
  }

  async findOrNotFoundFail(id: Types.ObjectId): Promise<UserOutput> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('user not found');
    }

    return UserOutput.mapToView(user);
  }

  async findAll(): Promise<UserDocument[]> {
    return this.UserModel.find();
  }
}
