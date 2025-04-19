import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Types } from 'mongoose';
import { UsersQueryRepository } from '../../infrastructure/users.query-repository';
import { UserOutput } from '../../dto/output/user.output';

export class GetUserByIdQuery {
  constructor(public id: Types.ObjectId) {}
}
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdQueryHandler
  implements IQueryHandler<GetUserByIdQuery>
{
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  execute({ id }: GetUserByIdQuery): Promise<UserOutput> {
    return this.usersQueryRepository.findOrNotFoundFail(id);
  }
}
