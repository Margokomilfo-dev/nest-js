import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../domain/user.entity';
import { UsersRepository } from '../../infrastructure/users.repository';

export class DeleteUserCommand {
  constructor(public id: string) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase implements ICommandHandler<DeleteUserCommand> {
  constructor(
    @InjectModel(User.name) private UserModel: UserModelType,
    private usersRepository: UsersRepository,
  ) {}
  async execute(data: DeleteUserCommand): Promise<void> {
    const user = await this.usersRepository.findOrNotFoundFail(data.id);

    user.makeDeleted();

    await this.usersRepository.save(user);
  }
}
