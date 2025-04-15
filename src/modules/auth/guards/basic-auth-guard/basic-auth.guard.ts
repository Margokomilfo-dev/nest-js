import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class BasicStrategyAuthGuard extends AuthGuard('basic') {}
