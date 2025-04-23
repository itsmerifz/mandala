import NextAuth, { NextAuthConfig } from "next-auth"
import { Provider } from "next-auth/providers";
import { PrismaClient } from "@prisma/client";
import { AdapterAccount, AdapterSession, AdapterUser, type Adapter } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import { VATSIMData } from "./next-auth";


const CustomAdapter = (prisma: PrismaClient): Adapter => {
  return {
    createUser: async (user: AdapterUser & VATSIMData & { email: string }) => {
      console.log('Creating user:', user);

      const createdUser = await prisma.user.create({
        data: {
          cid: user.cid,
          name: user.name || user.personal.name_full,
          email: user.email || user.personal.email,
          ratingId: user.vatsim.rating.id,
          ratingShort: user.vatsim.rating.short,
          ratingLong: user.vatsim.rating.long,
        }
      });
      console.log('User created:', createdUser);
      return createdUser as unknown as AdapterUser & VATSIMData;
    },
    updateUser: async ({ id, ...data }) => {
      console.log('Updating user with ID:', id, 'and data:', data);
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...data,
          name: data.name || ''
        }
      })
      console.log('User updated:', updatedUser);
      return updatedUser as unknown as AdapterUser
    },
    getUser: async id => {
      console.log('Getting user with ID:', id);
      const user = await prisma.user.findUnique({
        where: { id }
      })
      console.log('User found:', user);
      return user as unknown as AdapterUser
    },
    deleteUser: async id => {
      console.log('Deleting user with ID:', id);
      const deletedUser = await prisma.user.delete({
        where: { id }
      })
      console.log('User deleted:', deletedUser);
      return deletedUser as unknown as AdapterUser
    },
    getUserByAccount: async provider_providerAccountId => {
      console.log('Getting user by account with provider and providerAccountId:', provider_providerAccountId);
      const userData = await prisma.account.findUnique({
        where: {
          provider_providerAccountId
        },
        select: { user: true }
      })
      console.log('User data found:', userData);
      return (userData as unknown as AdapterUser) ?? null
    },
    getUserByEmail: async email => {
      console.log('Getting user by email:', email);
      const userData = await prisma.user.findUnique({
        where: {
          email: email
        }
      });
      console.log('User data found:', userData);
      return (userData as unknown as AdapterUser) ?? null;
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
      return account as unknown as AdapterAccount | null
    },
    linkAccount: async data => {
      console.log('Linking account with data:', data);

      return prisma.$transaction(async prisma => {
        const user = await prisma.user.findUnique({
          where: { id: data.userId }
        })
        if (!user) throw new Error(`User with ID ${data.userId} does not exist`)
        console.log('User found:', user);

        const account = await prisma.account.create({
          data: {
            refreshToken: data.refresh_token,
            accessToken: data.access_token,
            provider: data.provider,
            providerAccountId: data.providerAccountId,
            type: data.type,
            userId: data.userId
          }
        })
        console.log('Account linked:', account);
        return account as unknown as AdapterAccount
      })
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
        include: { user: true }
      })
      if (!userSession) return null
      const { user, ...session } = userSession
      console.log('Session and user found:', { user, session });
      return { user, session } as unknown as { user: AdapterUser, session: AdapterSession }
    },
    createSession: async data => {
      console.log('Creating session with data:', data);
      const session = await prisma.session.create({ data })
      console.log('Session created:', session);
      return session
    },
    updateSession: async data => {
      console.log('Updating session with data:', data);
      const session = prisma.session.update({
        where: { sessionToken: data.sessionToken },
        data
      })
      console.log('Session updated:', session);
      return session
    },
    deleteSession: async sessionToken => {
      console.log('Deleting session with sessionToken:', sessionToken);
      const session = await prisma.session.delete({
        where: { sessionToken }
      })
      console.log('Session deleted:', session);
      return session
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
    async profile(profile) {
      console.log('Profile data received from VATSIM:', profile);
      return {
        id: profile.data.cid,
        cid: profile.data.cid,
        name: profile.data.personal.name_full,
        user_details: profile.data.vatsim,
        email: profile.data.personal.email,
        emailVerified: true,
      }
    }
  }
]

export const authOptions: NextAuthConfig = {
  providers,
  adapter: CustomAdapter(prisma as unknown as PrismaClient),
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/",
    error: "/error",
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);