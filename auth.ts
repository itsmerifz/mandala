/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { NextAuthConfig, Profile } from "next-auth"
import { Provider } from "next-auth/providers"
import { AdapterAccount, AdapterSession, AdapterUser, type Adapter } from "next-auth/adapters"
import { prisma } from "@/lib/prisma"
import { ProviderUserProfile } from "./next-auth"
import { Prisma } from "@root/prisma/generated"

// const getStaffCIDList = async (): Promise<string[]> => {
//   if (process.env.NODE_ENV === 'development') return ['10000007', '10000003']
//   else {
//     try {
//       const response = await fetch('http://hq.vat-sea.com/api/vacc/IDN/staff', {
//         next: { revalidate: 3600 }
//       })

//       if (!response.ok) throw new Error(`Failed to get data, Error: ${response.status}`)
//       const staffData: { cid: number }[] = await response.json()
//       if (Array.isArray(staffData)) {
//         const cidList = staffData.map(staff => staff.cid.toString())
//         return cidList
//       }
//       console.warn("API didn't get staff CID")
//       return []
//     } catch {
//       return []
//     }
//   }
// }

const CustomAdapter = (prisma: any): Adapter => {
  return {
    createUser: async (dataFromProviderProfile: AdapterUser) => {
      const profile = dataFromProviderProfile as ProviderUserProfile
      console.log('Creating user:', JSON.stringify(profile, null, 2));
      // 
      if (!profile.cid || !profile.name || !profile.email) {
        throw new Error("Adapter: Missing required fields (cid, name, or email) for creating user.");
      }

      if (profile.ratingId == null || profile.ratingShort == null || profile.ratingLong == null) {
        throw new Error("Adapter: Missing required rating fields for creating user.");
      }

      const newUserInput = {
        cid: profile.cid,
        name: profile.name,
        email: profile.email,
        emailVerified: new Date(),
        ratingId: profile.ratingId,
        ratingShort: profile.ratingShort,
        ratingLong: profile.ratingLong,
        region: profile.region,
        division: profile.division,
        subdivision: profile.subdivision,
        rosterStatus: 'ACTIVE'
      };

      // try {
      //   const createdUser = await prisma.$transaction(async (tx: any) => {
      //     const newUser = await tx.user.create({
      //       data: newUserInput
      //     })

      //     const staffList = await getStaffCIDList()
      //     if (staffList.includes(newUser.cid)) {
      //       const adminRole = await tx.role.findFirst({
      //         where: { permissions: { some: { permission: 'ADMINISTRATOR' } } }
      //       })

      //       if (adminRole) {
      //         await tx.user.update({
      //           where: { id: newUser.id },
      //           data: {
      //             roles: { connect: { id: adminRole.id } },
      //             permissionsLastUpdatedAt: new Date(),
      //           }
      //         })
      //         console.log(`Adapter: Assigned role '${adminRole.name}' to user ${newUser.id}`);
      //       }
      //     } else {
      //       const memberRole = await tx.role.findUnique({
      //         where: { name: 'Member' }
      //       })

      //       if (memberRole) {
      //         await tx.user.update({
      //           where: { id: newUser.id },
      //           data: {
      //             roles: { connect: { id: memberRole.id } },
      //             permissionsLastUpdatedAt: new Date(),
      //           }
      //         })
      //       }
      //     }
      //     return newUser
      //   })
      //   console.log('Adapter: User created in DB:', JSON.stringify(createdUser, null, 2));
      //   return {
      //     ...createdUser,
      //     emailVerified: true,
      //   } as any;
      // } catch (error) {
      //   throw error
      // }
      const newUser = await prisma.user.create({
        data: newUserInput
      })
      return newUser
    },
    updateUser: async ({ id, ...data }) => {
      console.log('Updating user with ID:', id, 'and data:', data);
      const updatedUser = await prisma.user.update({
        where: { id },
        data: data as any
      })
      console.log('User updated:', updatedUser);
      return { ...updatedUser, emailVerified: true } as any
    },
    getUser: async id => {
      console.log('Getting user with ID:', id);
      const user = await prisma.user.findUnique({
        where: { id }
      })
      if (!user) return null;
      console.log('User found:', user);
      return { ...user, emailVerified: true } as any;
    },
    deleteUser: async id => {
      console.log('Deleting user with ID:', id);
      const deletedUser = await prisma.user.delete({
        where: { id }
      })
      console.log('User deleted:', deletedUser);
      return deletedUser as unknown as AdapterUser
    },
    getUserByAccount: async ({ providerAccountId, provider }) => {
      console.log('Getting user by account with provider and providerAccountId:', provider, providerAccountId);
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: { provider, providerAccountId }
        },
        include: { user: true },
      })
      if (!account) return null;
      const { user } = account;
      console.log('User data found:', user);
      return { ...user, emailVerified: true } as any
    },
    getUserByEmail: async email => {
      console.log('Getting user by email:', email);
      const user = await prisma.user.findUnique({
        where: {
          email: email
        }
      });
      if (!user) return null;
      console.log('User data found:', user);
      return { ...user, emailVerified: true } as any
    },
    getAccount: async (provider, providerAccountId) => {
      console.log('Getting account with provider:', provider, 'and providerAccountId:', providerAccountId);
      const account = await prisma.account.findFirst({
        where: {
          provider,
          providerAccountId
        }
      })
      console.log('Account found:', account);
      return account as unknown as AdapterAccount
    },
    linkAccount: async (data: AdapterAccount) => {
      console.log('Linking account with data:', JSON.stringify(data, null, 2));
      const dataForPrisma: Prisma.AccountCreateInput = {
        user: { connect: { id: data.userId as string } },
        type: data.type,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        access_token: data.access_token as string ?? data.access_token,
        refresh_token: data.refresh_token as string ?? data.refresh_token
      };

      Object.keys(dataForPrisma).forEach(key => {
        if (dataForPrisma[key as keyof Prisma.AccountCreateInput] === undefined) {
          delete dataForPrisma[key as keyof Prisma.AccountCreateInput];
        }
      });
      const createdAccount = await prisma.account.create({
        data: dataForPrisma,
      });
      console.log('Account linked:', createdAccount);
      return createdAccount as unknown as AdapterAccount
    },
    unlinkAccount: async provider_providerAccountId => {
      console.log('Unlinking account with provider and providerAccountId:', provider_providerAccountId);
      const account = await prisma.account.delete({
        where: {
          provider_providerAccountId
        }
      })
      console.log('Account unlinked:', account);
      return account as unknown as AdapterAccount
    },
    getSessionAndUser: async sessionToken => {
      console.log('Getting session and user with sessionToken:', sessionToken);
      const userSession = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      if (!userSession) return null
      const { user, ...session } = userSession
      console.log('Session and user found:', { user, session });
      return {
        session: session as AdapterSession,
        user: { ...user, emailVerified: true } as any,
      }
    },
    createSession: async data => {
      console.log('Creating session with data:', data);
      return await prisma.session.create({ data: data }) as AdapterSession
    },
    updateSession: async data => {
      console.log('Updating session with data:', data);
      return await prisma.session.update({ data: data, where: { sessionToken: data.sessionToken } }) as AdapterSession;
    },
    deleteSession: async sessionToken => {
      console.log('Deleting session with sessionToken:', sessionToken);
      return await prisma.session.delete({ where: { sessionToken } }) as AdapterSession
    },
  }
}

const providers: Provider[] = [
  {
    id: 'vatsim',
    name: 'VATSIM Connect SSO',
    type: 'oauth',
    issuer: 'https://vatsim.net',
    clientId: process.env.NODE_ENV === 'development' ? process.env.AUTH_CLIENT_ID_DEV : process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.NODE_ENV === 'development' ? process.env.AUTH_CLIENT_SECRET_DEV : process.env.AUTH_CLIENT_SECRET,
    authorization: {
      url: process.env.NODE_ENV === 'development' ? `${process.env.AUTH_OAUTH_URL_DEV}/oauth/authorize` : `${process.env.AUTH_OAUTH_URL}/oauth/authorize`,
      params: {
        scope: 'full_name vatsim_details email',
        response_type: 'code'
      }
    },
    token: {
      url: process.env.NODE_ENV === 'development' ? `${process.env.AUTH_OAUTH_URL_DEV}/oauth/token` : `${process.env.AUTH_OAUTH_URL}/oauth/token`,
      params: {
        grant_type: 'authorization_code',
      }
    },
    userinfo: process.env.NODE_ENV === 'development' ? `${process.env.AUTH_OAUTH_URL_DEV}/api/user` : `${process.env.AUTH_OAUTH_URL}/api/user`,
    profile(vatsimProfile: Profile) {
      const rawData = vatsimProfile.data
      console.log("VATSIM Profile Raw:", JSON.stringify(rawData, null, 2));

      if (!rawData || !rawData.cid || !rawData.personal || !rawData.vatsim || !rawData.vatsim.rating) {
        throw new Error("VATSIM profile data is incomplete or not in the expected format.");
      }

      return {
        id: rawData.cid,
        email: rawData.personal.email,
        name: rawData.personal.name_full,
        emailVerified: null,

        cid: rawData.cid,
        ratingId: rawData.vatsim.rating.id,
        ratingShort: rawData.vatsim.rating.short,
        ratingLong: rawData.vatsim.rating.long,
        region: rawData.vatsim.region?.name as string,
        division: rawData.vatsim.division?.name as string,
        subdivision: rawData.vatsim.subdivision?.name as string,
      };
    }
  }
]

export const authOptions: NextAuthConfig = {
  providers,
  adapter: CustomAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // if (account && user) {
      //   token.userIdDb = user.id
      //   token.cid = (user as any).cid

      //   if (profile?.data) {
      //     token.rawVatsimProfileData = profile.data as VATSIMData;
      //   }
      // }

      if (user) {
        const u = user as any
        token.userIdDb = u.id
        token.cid = u.cid
        token.ratingId = u.ratingId
        token.ratingShort = u.ratingShort
        token.ratingLong = u.ratingLong
        token.division = u.division
      }

      // Update session manual (jika perlu update data tanpa login ulang)
      if (trigger === "update" && session) {
        return { ...token, ...session }
      }

      // if (token.userIdDb) {
      // let shouldReFetchPermissions = !token.appPermissions

      // if (!shouldReFetchPermissions) {
      //   const dbUser = await prisma.user.findUnique({
      //     where: { id: token.userIdDb as string },
      //     select: { permissionsLastUpdatedAt: true }
      //   });
      //   const dbTimestamp = dbUser?.permissionsLastUpdatedAt;
      //   const tokenTimestamp = token.permissionsLastUpdatedAt ? new Date(token.permissionsLastUpdatedAt as string) : null;
      //   if (dbTimestamp && (!tokenTimestamp || dbTimestamp.getTime() > tokenTimestamp.getTime())) {
      //     shouldReFetchPermissions = true;
      //   }
      // }

      // if (shouldReFetchPermissions) {
      //   const userWithRolesAndPermissions = await prisma.user.findUnique({
      //     where: { id: token.userIdDb as string },
      //     include: {
      //       roles: { include: { permissions: true } },
      //     },
      //   });

      //   if (userWithRolesAndPermissions) {
      //     const appPermissionsSet = new Set<PrismaPermissionEnum>();
      //     userWithRolesAndPermissions.roles.forEach(role => {
      //       role.permissions.forEach(p => appPermissionsSet.add(p.permission));
      //     });
      //     token.appPermissions = Array.from(appPermissionsSet);
      //     token.permissionsLastUpdatedAt = userWithRolesAndPermissions.permissionsLastUpdatedAt?.toISOString() ?? null;
      //   }
      // }
      // }
      return token;
    },
    async session({ session, token }) {
      // if (token.userIdDb && session.user) {
      //   session.user.id = token.userIdDb as string
      //   session.user.cid = token.cid as string
      //   session.user.appPermissions = token.appPermissions

      //   if (token.rawVatsimProfileData) {
      //     const vData = token.rawVatsimProfileData
      //     session.user.name = vData.personal.name_full
      //     session.user.email = vData.personal.email
      //     session.user.vatsimPersonal = vData.personal
      //     session.user.vatsimDetails = vData.vatsim
      //     session.user.ratingId = vData.vatsim.rating.id
      //     session.user.ratingShort = vData.vatsim.rating.short
      //     session.user.ratingLong = vData.vatsim.rating.long
      //   } else {
      //     const dbUser = await prisma.user.findUnique({
      //       where: { id: token.userIdDb as string }
      //     })

      //     if (dbUser) {
      //       session.user.name = dbUser.name as string;
      //       session.user.email = dbUser.email as string;
      //       session.user.ratingId = dbUser.ratingId;
      //       session.user.ratingShort = dbUser.ratingShort as string;
      //       session.user.ratingLong = dbUser.ratingLong as string;
      //     }
      //   }
      if (token) {
        session.user.id = token.userIdDb as string
        session.user.cid = token.cid as string

        // Custom fields ke frontend
        session.user.ratingId = token.ratingId as number
        session.user.ratingShort = token.ratingShort as string
        session.user.ratingLong = token.ratingLong as string
        session.user.division = token.division as string
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 60
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);