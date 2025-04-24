import { Session } from "next-auth";

export const hasRole = (session: Session | null, role: string): boolean => {
  return session?.user?.role?.includes(role) ?? false;
}

export const hasAnyRole = (session: Session | null, roles: string[]): boolean => {
  if (!session || !session.user || !session.user?.role) return false;
  return roles.some(role => session.user.role.includes(role));
}