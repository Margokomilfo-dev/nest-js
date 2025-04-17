import { applyDecorators } from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

// Объединение декораторов
// https://docs.nestjs.com/custom-decorators#decorator-composition
export const IsStringWithTrim = (minLength: number, maxLength: number) =>
  applyDecorators(
    IsString(),
    Length(minLength, maxLength),

    Transform(({ value }: TransformFnParams) => {
      return typeof value === 'string' ? value.trim() : value;
    }),
  );
