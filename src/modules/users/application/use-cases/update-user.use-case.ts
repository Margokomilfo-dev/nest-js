import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../domain/user.entity';
import { UsersRepository } from '../../infrastructure/users.repository';
import { Types } from 'mongoose';
import { UpdateUserInput } from '../../dto/input/update-user.input';

export class UpdateUserCommand {
  constructor(public id: Types.ObjectId, public dto: UpdateUserInput) {}
}

@CommandHandler(UpdateUserCommand)
export class UpdateUserUseCase implements ICommandHandler<UpdateUserCommand> {
  constructor(
    @InjectModel(User.name) private UserModel: UserModelType,
    private usersRepository: UsersRepository,
  ) {}
  async execute(data: UpdateUserCommand): Promise<Types.ObjectId> {
    const user = await this.usersRepository.findOrNotFoundFail(
      data.id.toString(),
    );

    user.update(data.dto);

    await this.usersRepository.save(user);

    return user._id;
  }
}
