import { IsString } from 'class-validator';
import { IsStringWithTrim } from '../../../../decorators/is-string-with-trim';

export class CreateUserInput {
  @IsString()
  login: string;

  @IsStringWithTrim(3, 20) //проверит + удалит пробелы
  email: string;

  @IsString()
  pass: string;
}
