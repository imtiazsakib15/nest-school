import { Role } from '../../generated/prisma/enums.js';

export interface AuthenticatedUser {
  userId: string;
  role: Role;
}
