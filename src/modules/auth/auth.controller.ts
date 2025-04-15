import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsString } from 'class-validator';

class SignInDtoInput {
  @IsString()
  username: string;
  @IsString()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  signInWithJWT(@Body() signInDto: SignInDtoInput) {
    return this.authService.signInWithJWT(
      signInDto.username,
      signInDto.password,
    );
  }

  @Post('basic-login')
  signInWithBasic(@Body() signInDto: SignInDtoInput) {
    return this.authService.signInWithBasic(
      signInDto.username,
      signInDto.password,
    );
  }
}
