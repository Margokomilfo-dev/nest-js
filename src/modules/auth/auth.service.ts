import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt'; //это пакет утилит, который помогает с манипуляциями JWT. Это включает в себя генерацию и проверку токенов JWT.

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(username: string, pass: string) {
    const user = await this.usersService.findOne(username);

    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
