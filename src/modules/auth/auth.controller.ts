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
  signIn(@Body() signInDto: SignInDtoInput) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }
}
