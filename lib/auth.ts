import type { NextAuthOptions } from 'next-auth'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import type { Role } from '@/generated/prisma/enums'

/* ==========================================================================
   NextAuth Options & Configuration
   ========================================================================== */

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email.toLowerCase().trim()
        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isValidPassword) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          workspaceId: user.workspaceId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.workspaceId = user.workspaceId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.workspaceId = token.workspaceId as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'loop-ai-feedback-platform-local-jwt-secret-dev-2026',
}

/* ==========================================================================
   Authenticated User Context & RBAC Definitions
   ========================================================================== */

export interface AuthUser {
  id: string
  name?: string | null
  email: string
  role: Role
  workspaceId: string
}

export type AuthResult =
  | { success: true; user: AuthUser; response?: never }
  | { success: false; user?: never; response: NextResponse }

import {
  Permission,
  ROLE_PERMISSIONS,
  hasPermission,
} from '@/lib/navigation'

export { Permission, ROLE_PERMISSIONS, hasPermission }
export type { Permission as PermissionType } from '@/lib/navigation'

/**
 * Retrieves the authenticated user context from the active NextAuth session.
 * Returns null if no valid session exists or if required fields are missing.
 */
export async function getAuthSession(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions)
  if (
    !session?.user?.id ||
    !session?.user?.email ||
    !session?.user?.role ||
    !session?.user?.workspaceId
  ) {
    return null
  }

  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email,
    role: session.user.role,
    workspaceId: session.user.workspaceId,
  }
}

/**
 * Enforces that a valid authenticated session exists.
 * Returns { success: true, user: AuthUser } or a 401 Unauthorized NextResponse.
 */
export async function requireAuth(): Promise<AuthResult> {
  const user = await getAuthSession()
  if (!user) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return {
    success: true,
    user,
  }
}

/**
 * Enforces that the user is authenticated AND possesses the specified permission.
 * Returns 401 if unauthenticated, or 403 Forbidden if the role lacks permission.
 */
export async function requirePermission(
  permission: Permission
): Promise<AuthResult> {
  const auth = await requireAuth()
  if (!auth.success) {
    return auth
  }

  if (!hasPermission(auth.user.role, permission)) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return auth
}

/**
 * Enforces that the user is authenticated AND has one of the allowed roles.
 * Returns 401 if unauthenticated, or 403 Forbidden if role does not match.
 */
export async function requireRole(
  allowedRoles: Role | Role[]
): Promise<AuthResult> {
  const auth = await requireAuth()
  if (!auth.success) {
    return auth
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  if (!roles.includes(auth.user.role)) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return auth
}
