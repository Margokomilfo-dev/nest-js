import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ObjectIdValidationTransformationPipe implements PipeTransform {
  transform(value: any) {
    if (Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }
    //здесь мы упадем в глобальный эксепшен, не в функцию пайп-настроек
    throw new BadRequestException(`Invalid ObjectId: ${value}`); //400
    // throw new BadRequestException(`Invalid ObjectId: ${value}`); //500
    // throw new DomainException({
    //   code: DomainExceptionCode.ValidationError,
    //   message: `Invalid ObjectId: ${value}`,
    // });
  }
}
