import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import { Permission as PrismaPermissionEnum } from "./prisma/generated";

export interface VATSIMData {
  cid: string;
  personal: {
    name_first: string;
    name_last: string;
    name_full: string;
    email: string;
  };
  vatsim: {
    rating: { id: number; long: string; short: string; };
    pilotrating?: { id: number; long: string; short: string; };
    division?: { id: string; name: string; };
    region?: { id: string; name: string; };
    subdivision?: { id: string; name: string; };
  };
  oauth?: { token_valid: "true"; };
}

interface ProviderUserProfile {
  id: string
  email: string
  name: string
  emailVerified?: Date | null

  cid: string
  ratingId: number | null
  ratingShort: string | null
  ratingLong: string | null
}

interface AppRoleInSession {
  id: string;
  name: string;
  color: string | null;
  permissions: PrismaPermissionEnum[];
}

declare module "next-auth" {
  interface Profile extends DefaultProfile {
    data: VATSIMData
  }
  interface User extends DefaultUser {
    id: string
    cid: string
    name: string
    email: string
    emailVerified?: Date | null
    ratingId: number
    ratingShort: string
    ratingLong: string

    appRoles?: AppRoleInSession[]
    appPermissions?: PrismaPermissionEnum[]
    vatsimPersonal?: VATSIMData['personal']
    vatsimDetails?: VATSIMData['vatsim']
  }
  interface Session extends DefaultSession {
    user: User
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userIdDb?: string
    cid?: string
    appRoles?: AppRoleInSession[]
    appPermissions?: PrismaPermissionEnum[]
    rawVatsimProfileData?: VATSIMData
  }
}