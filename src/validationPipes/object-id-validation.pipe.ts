import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';

// Custom pipe example
@Injectable()
export class ObjectIdValidationPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata): any {
    console.log('1');
    if (metadata.metatype === Types.ObjectId) {
      if (!isValidObjectId(value)) {
        throw new BadRequestException(`Invalid ObjectId`);
      }
    }
    return value;
  }
}
