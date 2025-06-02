/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { NextAuthConfig, Profile } from "next-auth"
import { Provider } from "next-auth/providers";
import { AdapterAccount, AdapterSession, AdapterUser, type Adapter } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { AppRoleInSession, ProviderUserProfile, VATSIMData } from "./next-auth";
import { Permission as PrismaPermissionEnum } from "@root/prisma/generated";


const CustomAdapter = (prisma: PrismaClient): Adapter => {
  return {
    createUser: async (dataFromProviderProfile: AdapterUser) => {
      const profile = dataFromProviderProfile as ProviderUserProfile
      console.log('Creating user:', JSON.stringify(profile, null, 2));

      if (!profile.cid || !profile.name || !profile.email) {
        throw new Error("Adapter: Missing required fields (cid, name, or email) for creating user.");
      }

      if (profile.ratingId == null || profile.ratingShort == null || profile.ratingLong == null) {
        // ratingId bisa 0 (OBS), jadi cek null/undefined saja
        throw new Error("Adapter: Missing required rating fields for creating user.");
      }

      const newUserInput = {
        id: profile.id,
        cid: profile.cid,
        name: profile.name,
        email: profile.email,
        emailVerified: profile.emailVerified, // Biarkan null jika tidak ada
        ratingId: profile.ratingId,
        ratingShort: profile.ratingShort,
        ratingLong: profile.ratingLong,
      };

      console.log('Adapter: Data for prisma.user.create:', JSON.stringify(newUserInput, null, 2));

      const createdUser = await prisma.user.create({
        data: newUserInput
      });

      console.log('Adapter: User created in DB:', JSON.stringify(createdUser, null, 2));
      return {
        ...createdUser,
        emailVerified: true,
      } as any;
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
    linkAccount: async data => {
      console.log('Linking account with data:', JSON.stringify(data, null, 2));
      const createdAccount = await prisma.account.create({ data: data });
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
    profile(vatsimProfile: Profile): Promise<ProviderUserProfile> {
      const rawData = vatsimProfile.data
      console.log('Profile data received from VATSIM:', JSON.stringify(rawData, null, 2));

      if (!rawData || !rawData.cid || !rawData.personal || !rawData.vatsim || !rawData.vatsim.rating) {
        console.error("VATSIM profile data is incomplete:", rawData);
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
        rawVatsimPayload: rawData,
      };
    }
  }
]

export const authOptions: NextAuthConfig = {
  providers,
  adapter: CustomAdapter(prisma as unknown as PrismaClient),
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user, account, profile: vatsimProfileFromProvider, trigger }) {
      let shouldReFetchPermissions = false
      let userForPermissionFetchId: string | undefined = token.userIdDb as string | undefined

      if (user?.id) {
        token.userIdDb = user.id
        userForPermissionFetchId = user.id
        token.cid = (user as any).cid

        if (account || trigger === "update" || trigger === "signIn" || trigger === "signUp") {
          shouldReFetchPermissions = true;
        }


        const prismaUserWithDetails = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            roles: { include: { permissions: true } },
          },
        });

        if (prismaUserWithDetails) {
          const appPermissionsSet = new Set<PrismaPermissionEnum>();
          const appRolesData: AppRoleInSession[] = prismaUserWithDetails.roles.map(role => {
            role.permissions.forEach(p => appPermissionsSet.add(p.permission));
            return {
              id: role.id,
              name: role.name,
              color: role.color,
              permissions: role.permissions.map(p => p.permission)
            };
          });
          token.appRoles = appRolesData;
          token.appPermissions = Array.from(appPermissionsSet);
        }
      }

      if (userForPermissionFetchId && !shouldReFetchPermissions) {
        console.log("JWT: Validating existing token for user DB ID:", userForPermissionFetchId)
        const dbUser = await prisma.user.findUnique({
          where: { id: userForPermissionFetchId },
          select: { permissionsLastUpdatedAt: true }
        })

        const dbTimestamp = dbUser?.permissionsLastUpdatedAt
        const tokenTimestampString = token.permissionsLastUpdatedAt
        const tokenTimestamp = tokenTimestampString ? new Date(tokenTimestampString) : null

        if (dbTimestamp && (!tokenTimestamp || dbTimestamp.getTime() > tokenTimestamp.getTime())) {
          console.log("JWT: Permissions timestamp in DB is newer. Re-fetching permissions.")
          shouldReFetchPermissions = true
        } else if (!dbTimestamp && tokenTimestamp) {
          console.log("JWT: DB timestamp is null, token has one. Re-fetching to sync.")
          shouldReFetchPermissions = true
        }
      } else if (userForPermissionFetchId && !token.appPermissions && !shouldReFetchPermissions) {
        console.log("JWT: Token exists but appPermissions missing. Forcing re-fetch for user:", userForPermissionFetchId)
        shouldReFetchPermissions = true
      }

      if (shouldReFetchPermissions && userForPermissionFetchId) {
        console.log("JWT: Fetching/Re-fetching appRoles, appPermissions, and timestamp for user:", userForPermissionFetchId);
        const prismaUserWithDetails = await prisma.user.findUnique({
          where: { id: userForPermissionFetchId },
          include: { // Pastikan `include` atau `select` sesuai dengan apa yang Anda butuhkan
            roles: {
              include: { permissions: true }
            },
          }
        });

        if (prismaUserWithDetails) {
          token.cid = prismaUserWithDetails.cid; // Ambil CID dari DB jika belum ada di token
          const appPermissionsSet = new Set<PrismaPermissionEnum>();
          const appRolesData: AppRoleInSession[] = prismaUserWithDetails.roles.map(role => {
            role.permissions.forEach(p => appPermissionsSet.add(p.permission));
            return {
              id: role.id,
              name: role.name,
              color: role.color ?? null, // Pastikan null jika opsional
              permissions: role.permissions.map(p => p.permission)
            };
          });
          token.appRoles = appRolesData;
          token.appPermissions = Array.from(appPermissionsSet);
          token.permissionsLastUpdatedAt = prismaUserWithDetails.permissionsLastUpdatedAt?.toISOString() ?? null;
        } else {
          console.warn("JWT: User not found in DB during permission fetch for ID:", userForPermissionFetchId);
          token.appRoles = [];
          token.appPermissions = [];
          token.permissionsLastUpdatedAt = null; // Reset jika pengguna tidak ditemukan
        }
      }


      if (account && vatsimProfileFromProvider?.data) {
        token.rawVatsimProfileData = vatsimProfileFromProvider.data as VATSIMData; // Casting
        if (!token.cid && vatsimProfileFromProvider.data.cid) {
          token.cid = vatsimProfileFromProvider.data.cid;
        }
      }
      console.log("JWT Callback: returning token:", JSON.stringify(token, null, 2));
      return token;
    },
    async session({ session, token }) {
      console.log("Session Callback: received token:", JSON.stringify(token, null, 2));
      if (token.userIdDb && session.user) {
        session.user.id = token.userIdDb
        session.user.appRoles = token.appRoles
        session.user.appPermissions = token.appPermissions
        session.user.cid = token.cid || ""

        // Isi detail user dari data VATSIM mentah yang disimpan di token
        if (token.rawVatsimProfileData) {
          const vData = token.rawVatsimProfileData;
          session.user.name = vData.personal.name_full;
          session.user.email = vData.personal.email;
          session.user.vatsimPersonal = vData.personal;
          session.user.vatsimDetails = vData.vatsim;
          session.user.ratingId = vData.vatsim.rating.id;
          session.user.ratingShort = vData.vatsim.rating.short;
          session.user.ratingLong = vData.vatsim.rating.long;
        } else if (token.userIdDb && (!session.user.name || !session.user.email || !session.user.cid)) {
          console.log("Session: rawVatsimProfileData missing, attempting to fill some user details from DB for user:", token.userIdDb)
          const dbUser = await prisma.user.findUnique({
            where: { id: token.userIdDb },
            select: { name: true, email: true, cid: true, ratingId: true, ratingShort: true, ratingLong: true }
          });
          if (dbUser) {
            session.user.name = session.user.name || dbUser.name;
            session.user.email = session.user.email || dbUser.email;
            session.user.cid = session.user.cid || dbUser.cid;
            session.user.ratingId = session.user.ratingId ?? dbUser.ratingId;
            session.user.ratingShort = session.user.ratingShort || dbUser.ratingShort;
            session.user.ratingLong = session.user.ratingLong || dbUser.ratingLong;
          }
        }
      }
      console.log("Session Callback: returning session.user:", JSON.stringify(session.user, null, 2));
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 60
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);