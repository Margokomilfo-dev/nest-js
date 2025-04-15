import { Injectable } from '@nestjs/common';

const users = [
  {
    userId: 1,
    username: 'margo',
    password: '1234',
  },
  {
    userId: 2,
    username: 'leo',
    password: '12345',
  },
];

@Injectable()
export class UsersService {
  async findOne(username: string): Promise<any | undefined> {
    return users.find((user) => user.username === username);
  }
  findAll(): any[] {
    return users;
  }
}
