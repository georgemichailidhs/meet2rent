import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/database/config';
import { users, accounts, sessions, verificationTokens } from '@/lib/database/schema';

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'select_account',
        },
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow OAuth sign-ins
      if (account?.provider === 'google') {
        return true;
      }

      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      // Persist user info to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;

        // Get user type from database
        try {
          const dbUser = await db
            .select({ userType: users.userType, phone: users.phone })
            .from(users)
            .where({ id: user.id })
            .limit(1);

          if (dbUser[0]) {
            token.userType = dbUser[0].userType;
            token.phone = dbUser[0].phone;
          }
        } catch (error) {
          console.error('Error fetching user data in JWT callback:', error);
        }
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        return { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.image;
        session.user.userType = token.userType as string;
        session.user.phone = token.phone as string;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after sign in
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;

      // Default redirect after successful sign in
      return `${baseUrl}/dashboard`;
    },
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (isNewUser) {
        console.log(`New user registered: ${user.email}`);

        // TODO: Send welcome email
        // TODO: Create default user profile

        try {
          // Set default user type based on account creation
          await db
            .update(users)
            .set({
              userType: 'tenant', // Default to tenant, can be changed later
              updatedAt: new Date(),
            })
            .where({ id: user.id });
        } catch (error) {
          console.error('Error updating new user:', error);
        }
      }
    },

    async signOut({ token }) {
      console.log(`User signed out: ${token?.email}`);
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

export default authOptions;
