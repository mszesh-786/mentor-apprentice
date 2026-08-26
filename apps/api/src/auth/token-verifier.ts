import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import jwt, {
  type JwtHeader,
  type JwtPayload,
  type SigningKeyCallback,
} from 'jsonwebtoken';
import { getAuthMode } from './auth-mode';

export type VerifiedTokenPayload = {
  sub: string;
  email: string;
  displayName?: string;
  roles?: Role[];
  emailVerified: boolean;
};

const CLAIM_NS = 'https://mentor-apprentice.local/';

// Lazily loaded so stub/CI e2e never pull ESM-only jose (jwks-rsa dependency).
let jwksGetSigningKey:
  | ((header: JwtHeader, callback: SigningKeyCallback) => void)
  | null = null;

async function getAuth0SigningKeyFn() {
  if (jwksGetSigningKey) {
    return jwksGetSigningKey;
  }

  const domain = process.env.AUTH0_DOMAIN;
  if (!domain) {
    throw new UnauthorizedException('AUTH0_DOMAIN is not configured');
  }

  const jwksRsa = await import('jwks-rsa');
  const client = jwksRsa.default({
    jwksUri: `https://${domain}/.well-known/jwks.json`,
    cache: true,
    rateLimit: true,
  });

  jwksGetSigningKey = (header: JwtHeader, callback: SigningKeyCallback) => {
    if (!header.kid) {
      callback(new Error('Missing token kid'));
      return;
    }
    client.getSigningKey(header.kid, (error, key) => {
      if (error || !key) {
        callback(error ?? new Error('Unable to get signing key'));
        return;
      }
      callback(null, key.getPublicKey());
    });
  };

  return jwksGetSigningKey;
}

function readStringClaim(
  payload: JwtPayload,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function readBooleanClaim(
  payload: JwtPayload,
  keys: string[],
): boolean | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }
  return undefined;
}

function parseRoles(payload: JwtPayload): Role[] | undefined {
  const raw = payload.roles ?? payload[`${CLAIM_NS}roles`];
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const allowed = new Set<string>(Object.values(Role));
  return raw.filter(
    (value): value is Role =>
      typeof value === 'string' && allowed.has(value),
  );
}

function toVerifiedPayload(payload: JwtPayload): VerifiedTokenPayload {
  const sub = typeof payload.sub === 'string' ? payload.sub : undefined;
  const email = readStringClaim(payload, ['email', `${CLAIM_NS}email`]);
  if (!sub || !email) {
    throw new UnauthorizedException(
      'Token missing required sub/email claims. For Auth0, add a Post-Login Action that sets email claims on the access token.',
    );
  }

  return {
    sub,
    email,
    displayName: readStringClaim(payload, [
      'name',
      'displayName',
      `${CLAIM_NS}name`,
    ]),
    emailVerified:
      readBooleanClaim(payload, [
        'email_verified',
        `${CLAIM_NS}email_verified`,
      ]) ?? false,
    roles: parseRoles(payload),
  };
}

async function verifyAuth0Jwt(token: string): Promise<JwtPayload> {
  const domain = process.env.AUTH0_DOMAIN;
  const audience = process.env.AUTH0_AUDIENCE;
  if (!domain || !audience) {
    throw new UnauthorizedException(
      'Auth0 is not configured (AUTH0_DOMAIN / AUTH0_AUDIENCE)',
    );
  }

  const getKey = await getAuth0SigningKeyFn();

  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        audience,
        issuer: `https://${domain}/`,
        algorithms: ['RS256'],
      },
      (error, decoded) => {
        if (error || !decoded || typeof decoded === 'string') {
          reject(new UnauthorizedException('Invalid Auth0 token'));
          return;
        }
        resolve(decoded);
      },
    );
  });
}

export async function verifyAccessToken(
  token: string,
  jwtService: JwtService,
): Promise<VerifiedTokenPayload> {
  if (getAuthMode() === 'stub') {
    try {
      const payload = await jwtService.verifyAsync<
        JwtPayload & { emailVerified?: boolean }
      >(token);
      return toVerifiedPayload({
        ...payload,
        email_verified: payload.email_verified ?? payload.emailVerified,
      });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  try {
    const payload = await verifyAuth0Jwt(token);
    return toVerifiedPayload(payload);
  } catch (error) {
    if (error instanceof UnauthorizedException) {
      throw error;
    }
    throw new UnauthorizedException('Invalid Auth0 token');
  }
}
