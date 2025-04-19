import { IsEmail, IsString } from 'class-validator';

export class UpdateUserInput {
  @IsString()
  @IsEmail()
  email: string;
}
