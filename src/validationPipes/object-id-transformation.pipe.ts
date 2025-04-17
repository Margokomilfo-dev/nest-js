import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';

@Injectable()
export class ObjectIdTransformationPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata): any {
    if (metadata.metatype === Types.ObjectId) {
      if (!isValidObjectId(value)) {
        throw new BadRequestException(`Invalid ObjectId`);
      }
      console.log(value); //661e2c5a9a4d3f001fc9a6c2
      return new Types.ObjectId(value); //НЕ РАБОТАЕТ!!!! WTF? todo
    }
    return value;
  }
}
