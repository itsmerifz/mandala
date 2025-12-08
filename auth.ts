/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { NextAuthConfig, Profile } from "next-auth"
import { Provider } from "next-auth/providers"
import { AdapterAccount, AdapterSession, AdapterUser, type Adapter } from "next-auth/adapters"
import { prisma } from "@/lib/prisma"
import { Prisma, AppRole, PrismaClient, RosterStatus } from "@root/prisma/generated"

const getStaffCIDList = async (): Promise<string[]> => {
  if (process.env.NODE_ENV === 'development') return ['10000007', '10000003']
  else {
    try {
      const response = await fetch('http://hq.vat-sea.com/api/vacc/IDN/staff', {
        next: { revalidate: 3600 }
      })

      if (!response.ok) throw new Error(`Failed to get data, Error: ${response.status}`)
      const staffData: { cid: number }[] = await response.json()
      if (Array.isArray(staffData)) {
        const cidList = staffData.map(staff => staff.cid.toString())
        return cidList
      }
      console.warn("API didn't get staff CID")
      return []
    } catch {
      return []
    }
  }
}

const CustomAdapter = (prisma: PrismaClient): Adapter => {
  return {
    createUser: async (user) => {
      // ⚠️ CASTING PENTING: Ubah user jadi 'any' untuk akses custom field
      const userData = user as any;
      console.log('✨ Creating User CID:', userData.cid);

      if (!userData.cid) throw new Error("Missing CID");

      const staffList = await getStaffCIDList()
      const isStaff = staffList.includes(userData.cid)

      console.log('isStaff: ', isStaff)

      try {
        const newUser = await prisma.user.create({
          data: {
            cid: userData.cid,
            name: userData.name,
            email: userData.email,
            emailVerified: new Date(), // Wajib Date object

            ratingId: userData.ratingId,
            ratingShort: userData.ratingShort,
            ratingLong: userData.ratingLong,
            region: userData.region,
            division: userData.division,
            subdivision: userData.subdivision,

            rosterStatus: userData.division === 'IDN' ? RosterStatus.ACTIVE : RosterStatus.VISITOR,
            role: isStaff ? AppRole.STAFF : AppRole.MEMBER

          }
        })

        return newUser as unknown as AdapterUser
      } catch (error) {
        console.error("Create User Error:", error)
        throw error
      }
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
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true }
      })
      return account?.user as any ?? null
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
      const data = vatsimProfile.data || vatsimProfile
      return {
        id: String(data.cid),
        name: data.personal.name_full,
        email: data.personal.email,

        // Data yang diteruskan ke createUser
        cid: String(data.cid),
        ratingId: Number(data.vatsim.rating.id),
        ratingShort: String(data.vatsim.rating.short),
        ratingLong: String(data.vatsim.rating.long),
        region: data.vatsim.region?.name as string,
        division: data.vatsim.division?.name as string,
        subdivision: data.vatsim.subdivision?.name as string,
        role: "MEMBER",
        rosterStatus: "VISITOR",
      }
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
      if (user) {
        const u = user as any
        token.userIdDb = u.id
        token.cid = u.cid
        token.ratingId = u.ratingId
        token.ratingShort = u.ratingShort
        token.ratingLong = u.ratingLong
        token.division = u.division
        token.role = u.role
        token.rosterStatus = u.rosterStatus
      }

      // Update session manual (jika perlu update data tanpa login ulang)
      if (trigger === "update" && session) {
        return { ...token, ...session }
      }
      return token;
    },
    async session({ session, token }) {

      if (token) {
        session.user.id = token.userIdDb as string
        session.user.cid = token.cid as string

        // Custom fields ke frontend
        session.user.ratingId = token.ratingId as number
        session.user.ratingShort = token.ratingShort as string
        session.user.ratingLong = token.ratingLong as string
        session.user.division = token.division as string
        session.user.role = token.role as string
        session.user.rosterStatus = token.rosterStatus as string
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