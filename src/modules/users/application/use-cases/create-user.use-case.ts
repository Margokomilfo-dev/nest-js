import { CreateUserInput } from '../../dto/input/create-user.input';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../domain/user.entity';
import { UsersRepository } from '../../infrastructure/users.repository';
import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';
import { SendInvitationEvent } from '../../../../core/notifiactions/event-handlers/send-confirmation-email.event-handler';

export class CreateUserCommand {
  constructor(public dto: CreateUserInput) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
  constructor(
    @InjectModel(User.name) private UserModel: UserModelType,
    private usersRepository: UsersRepository,
    private eventBus: EventBus,
  ) {}
  async execute({ dto }: CreateUserCommand): Promise<Types.ObjectId> {
    const userWithTheSameLogin = await this.usersRepository.findByLogin(
      dto.login,
    );
    if (!!userWithTheSameLogin) {
      throw new BadRequestException('User with the same login already exists');
    }

    const user = this.UserModel.createInstance({
      email: dto.email,
      login: dto.login,
      pass: dto.pass,
    });

    await this.usersRepository.save(user);
    this.eventBus.publish(new SendInvitationEvent(user.email, '12345'));
    return user._id;
  }
}
