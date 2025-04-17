import { IsString } from 'class-validator';

export class CreateUserInput {
  @IsString()
  login: string;

  @IsString()
  email: string;

  @IsString()
  pass: string;
}
