import { Session } from "next-auth";

export const hasAppRole = (session: Session | null, roleName: string): boolean => {
  if (!session?.user?.appRoles) {
    return false;
  }
  return session.user.appRoles.some(appRole => appRole.name === roleName);
};

export const hasAnyAppRole = (session: Session | null, roleNames: string[]): boolean => {
  if (!session?.user?.appRoles) {
    return false;
  }
  return roleNames.some(roleName =>
    session.user.appRoles!.some(appRole => appRole.name === roleName)
  );
};