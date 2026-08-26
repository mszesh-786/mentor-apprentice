import { SignJWT } from 'jose'
import type { AppRole, AuthSession } from '@/auth/session'

function getSecret(): Uint8Array {
  const secret = import.meta.env.VITE_JWT_SECRET ?? 'dev-jwt-secret-change-me'
  return new TextEncoder().encode(secret)
}

export async function mintStubToken(input: {
  sub: string
  email: string
  displayName: string
  roles: AppRole[]
}): Promise<string> {
  return new SignJWT({
    email: input.email,
    displayName: input.displayName,
    roles: input.roles,
    emailVerified: true,
    email_verified: true,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(input.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function createStubSession(input: {
  persona: 'mentor' | 'apprentice' | 'dual' | 'admin'
  displayName: string
}): Promise<AuthSession> {
  const roles: AppRole[] =
    input.persona === 'mentor'
      ? ['MENTOR']
      : input.persona === 'apprentice'
        ? ['APPRENTICE']
        : input.persona === 'admin'
          ? ['ADMIN']
          : ['MENTOR', 'APPRENTICE']

  const sub = `web-${input.persona}-${input.displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`

  const email = `${sub}@example.com`
  const token = await mintStubToken({
    sub,
    email,
    displayName: input.displayName,
    roles,
  })

  return {
    token,
    sub,
    email,
    displayName: input.displayName,
    roles,
    activeRole: roles[0]!,
  }
}
