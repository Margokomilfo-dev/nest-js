import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthConfigService } from '../../core/configuration/auth/auth-config.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      useFactory: (authConfigService: AuthConfigService) => ({
        global: true,
        secret: authConfigService.JWT_AUTH_SECRET,
        signOptions: { expiresIn: '60m' },
      }),
      inject: [AuthConfigService],
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
