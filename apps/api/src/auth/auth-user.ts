import { Role, UserStatus } from '@prisma/client';

export interface AuthUser {
  id: string;
  authProviderId: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
  status: UserStatus;
  roles: Role[];
}
