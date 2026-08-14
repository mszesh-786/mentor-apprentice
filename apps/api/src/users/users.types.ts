import { Role, UserStatus } from '@prisma/client';

export type EnsureUserInput = {
  authProviderId: string;
  email: string;
  displayName?: string;
  emailVerified?: boolean;
  roles?: Role[];
};

export type UserRecord = {
  id: string;
  authProviderId: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
  status: UserStatus;
  roles: Role[];
};
