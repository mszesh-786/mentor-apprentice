import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { AuthUser } from '../../auth/auth-user';
import { isAuth0Mode } from '../../auth/auth-mode';
import { verifyAccessToken } from '../../auth/token-verifier';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthUser;
    }>();

    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const payload = await verifyAccessToken(token, this.jwtService);

    const user = await this.usersService.ensureFromAuthProvider({
      authProviderId: payload.sub,
      email: payload.email,
      displayName: payload.displayName,
      emailVerified: payload.emailVerified,
      // Auth0 mode: roles live in DB only — never trust client/token roles.
      roles: isAuth0Mode() ? [] : (payload.roles ?? []),
      acceptClientRoles: !isAuth0Mode(),
    });

    request.user = user;
    return true;
  }
}
