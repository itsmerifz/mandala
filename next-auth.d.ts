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
  region: string | null
  division: string | null
  subdivision: string | null
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
    cid: string
    role: AppRole
    ratingId: number
    ratingShort: string
    ratingLong: string
    division: string | null
    region: string | null
    subdivision: string | null
    rosterStatus: string
    vatsimPersonal?: VATSIMData['personal']
    vatsimDetails?: VATSIMData['vatsim']
  }
  interface Session extends DefaultSession {
    user: User
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    cid: string
    role: AppRole
    ratingId: number
    ratingShort: string
    ratingLong: string
    division: string | null
    rosterStatus: string
  }
}