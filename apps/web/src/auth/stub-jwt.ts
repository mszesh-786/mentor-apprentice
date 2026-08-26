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
  emailVerified?: boolean
}): Promise<string> {
  const emailVerified = input.emailVerified ?? true
  return new SignJWT({
    email: input.email,
    displayName: input.displayName,
    roles: input.roles,
    emailVerified,
    email_verified: emailVerified,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(input.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

function rolesForPersona(
  persona: 'mentor' | 'apprentice' | 'dual' | 'admin',
): AppRole[] {
  if (persona === 'mentor') return ['MENTOR']
  if (persona === 'apprentice') return ['APPRENTICE']
  if (persona === 'admin') return ['ADMIN']
  return ['MENTOR', 'APPRENTICE']
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function createStubSession(input: {
  persona: 'mentor' | 'apprentice' | 'dual' | 'admin'
  displayName: string
}): Promise<AuthSession> {
  const roles = rolesForPersona(input.persona)
  const sub = `web-${input.persona}-${slugify(input.displayName)}`
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

/** Stub registration: stable sub from email so repeat signup = same account. */
export async function createStubRegistration(input: {
  email: string
  displayName: string
  persona: 'mentor' | 'apprentice' | 'dual'
}): Promise<AuthSession> {
  const email = input.email.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    throw new Error('Enter a valid email address')
  }
  const displayName = input.displayName.trim()
  if (!displayName) {
    throw new Error('Enter a display name')
  }

  const roles = rolesForPersona(input.persona)
  const sub = `web-reg-${slugify(email)}`
  const token = await mintStubToken({
    sub,
    email,
    displayName,
    roles,
    emailVerified: true,
  })

  return {
    token,
    sub,
    email,
    displayName,
    roles,
    activeRole: roles[0]!,
  }
}
