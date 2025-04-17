import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/application/users.service';
import { JwtService } from '@nestjs/jwt'; //это пакет утилит, который помогает с манипуляциями JWT. Это включает в себя генерацию и проверку токенов JWT.

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signInWithJWT(username: string, pass: string) {
    const user = await this.usersService.findOne(username);

    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signInWithBasic(username: string, password: string) {
    const base64 = Buffer.from(`${username}:${password}`).toString('base64');
    const authorizationHeader = `Basic ${base64}`;

    return {
      message: 'Use this header in Authorization',
      authorizationHeader,
    };
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);

    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
