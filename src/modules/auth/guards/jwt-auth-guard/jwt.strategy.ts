import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthConfigService } from '../../../../core/configuration/auth/auth-config.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authConfigService: AuthConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), //from Authorization headers
      ignoreExpiration: false, //Не игнорировать Expiration у jwt token
      secretOrKey: authConfigService.JWT_AUTH_SECRET,
    });
  }

  async validate(payload: any) {
    console.log('payload', payload);
    return { userId: payload.sub, username: payload.username };
  }
}
