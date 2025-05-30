import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthConfigService } from '../../core/configuration/auth/auth-config.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './guards/local-auth-guard/local.strategy';
import { JwtStrategy } from './guards/jwt-auth-guard/jwt.strategy';
import { BasicStrategy } from './guards/basic-auth-guard/basic.strategy';

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
    PassportModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, BasicStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
