import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

export interface VATSIMData {
  cid: string,
  personal: {
    name_first: string,
    name_last: string,
    name_full: string,
    email: string,
  },
  vatsim: {
    rating: {
      id: number,
      long: string,
      short: string,
    },
    pilotrating: {
      id: number,
      long: string,
      short: string,
    },
    division: {
      id: string?,
      name: string?,
    },
    region: {
      id: string?,
      name: string?,
    },
    subdivision: {
      id: string?,
      name: string?,
    },
  },
  role: string[],
  oauth: {
    token_valid: "true"
  }
}

declare module "next-auth" {
  interface Profile extends DefaultProfile {
    data: VATSIMData
  }
  interface Session extends DefaultSession {
    user: VATSIMData
  }

  interface User extends Omit<DefaultUser, "id"> {
    id: UserType["id"]
    cid: string
    name: string
    email: string
    ratingId: number
    ratingShort: string
    ratingLong: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    data: VATSIMData
  }
}