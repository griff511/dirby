import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      image: string | null
      role: UserRole
    }
  }

  interface User {
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    // Development credentials provider
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null

        // For development, allow any email to sign in
        if (process.env.NODE_ENV === 'development') {
          let user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: credentials.email,
                name: credentials.email.split('@')[0],
                role: credentials.email.includes('admin')
                  ? UserRole.ADMIN
                  : UserRole.EDITOR,
              },
            })
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Allow all sign-ins for now
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Permission helpers
export function canManageUsers(role: UserRole): boolean {
  return role === UserRole.ADMIN
}

export function canEditTentpoles(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.BRAND_LEAD
}

export function canSuggestReposts(role: UserRole): boolean {
  return [UserRole.ADMIN, UserRole.BRAND_LEAD, UserRole.EDITOR].includes(role)
}

export function canExportData(role: UserRole): boolean {
  return [UserRole.ADMIN, UserRole.BRAND_LEAD, UserRole.EDITOR].includes(role)
}
