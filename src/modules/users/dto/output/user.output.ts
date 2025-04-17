import { UserDocument } from '../../domain/user.entity';

export class UserOutput {
  id: string;
  login: string;
  email: string;
  createdAt: Date;

  static mapToView(user: UserDocument): UserOutput {
    const dto = new UserOutput();

    dto.email = user.email;
    dto.login = user.login;
    dto.id = user._id.toString();
    dto.createdAt = user.createdAt;

    return dto;
  }
}
