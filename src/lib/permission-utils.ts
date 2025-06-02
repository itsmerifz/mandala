import { Session } from "next-auth"
import { Permission as PrismaPermissionEnum } from "@root/prisma/generated";

export const hasPermission = (session: Session | null, requiredPermission: PrismaPermissionEnum): boolean => {
  if (!session?.user?.appPermissions) {
    return false
  }
  return session.user.appPermissions.includes(requiredPermission);
}

export const hasAnyPermission = (session: Session | null, requiredPermissions: PrismaPermissionEnum[]): boolean => {
  if (!session?.user?.appPermissions) {
    return false
  }
  const userPermissions = session.user.appPermissions
  return requiredPermissions.some(rp => userPermissions.includes(rp))
};
