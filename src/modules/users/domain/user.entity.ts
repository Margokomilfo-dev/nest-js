import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { Name, NameSchema } from './name.schema';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { UpdateUserInput } from '../dto/input/update-user.input';

//флаг timestemp автоматичеки добавляет поля upatedAt и createdAt
@Schema({ timestamps: true })
export class User {
  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: String, required: true })
  login: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({
    type: String,
    required: true,
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
  })
  email: string;

  @Prop({ type: NameSchema })
  name: Name;

  @Prop({ type: Date, nullable: true })
  deletedAt: Date | null;

  //метод-фабрика. Создает объект, но не сохраняет в бд! обращаться надо напрямую к Model
  static createInstance(dto: CreateUserDomainDto): UserDocument {
    const user = new this();
    user.email = dto.email;
    user.password = dto.pass;
    user.login = dto.login;

    user.name = {
      firstName: 'firstName xxx',
      lastName: 'lastName yyy',
    };

    return user as UserDocument;
  }

  //метод, который можно вызвать у полученного инстанса (не напрямую к Model), но не сохраняет в бд!
  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deletedAt = new Date();
  }

  //метод, который можно выззвать у полученного инстанса (не напрямую к Model), но не сохраняет в бд!
  update(dto: UpdateUserInput) {
    if (dto.email !== this.email) {
      this.email = dto.email;
    }
  }
}
//создает схему на основе класса
export const UserSchema = SchemaFactory.createForClass(User);

//регистрирует методы сущности в схеме
UserSchema.loadClass(User);

//Типизация документа
export type UserDocument = HydratedDocument<User>;

//Типизация модели + статические методы
export type UserModelType = Model<UserDocument> & typeof User;
