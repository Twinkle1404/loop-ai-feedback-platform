import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Inbox,
  TrendingUp,
  Sparkles,
  FileText,
} from 'lucide-react'
import type { Role } from '@/generated/prisma/enums'

/* ==========================================================================
   Permissions & Role Matrix (Client-Safe & Server-Safe)
   ========================================================================== */

export const Permission = {
  VIEW_FEEDBACK: 'VIEW_FEEDBACK',
  CREATE_FEEDBACK: 'CREATE_FEEDBACK',
  IMPORT_FEEDBACK: 'IMPORT_FEEDBACK',
  UPDATE_FEEDBACK: 'UPDATE_FEEDBACK',
  DELETE_FEEDBACK: 'DELETE_FEEDBACK',
  VIEW_THEMES: 'VIEW_THEMES',
  MANAGE_THEMES: 'MANAGE_THEMES',
  VIEW_REPORTS: 'VIEW_REPORTS',
  CREATE_REPORT: 'CREATE_REPORT',
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_WORKSPACE: 'MANAGE_WORKSPACE',
} as const

export type Permission = (typeof Permission)[keyof typeof Permission]

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: [
    Permission.VIEW_FEEDBACK,
    Permission.CREATE_FEEDBACK,
    Permission.IMPORT_FEEDBACK,
    Permission.UPDATE_FEEDBACK,
    Permission.DELETE_FEEDBACK,
    Permission.VIEW_THEMES,
    Permission.MANAGE_THEMES,
    Permission.VIEW_REPORTS,
    Permission.CREATE_REPORT,
    Permission.MANAGE_USERS,
    Permission.MANAGE_WORKSPACE,
  ],
  ANALYST: [
    Permission.VIEW_FEEDBACK,
    Permission.CREATE_FEEDBACK,
    Permission.IMPORT_FEEDBACK,
    Permission.UPDATE_FEEDBACK,
    Permission.VIEW_THEMES,
    Permission.MANAGE_THEMES,
    Permission.VIEW_REPORTS,
    Permission.CREATE_REPORT,
  ],
  VIEWER: [
    Permission.VIEW_FEEDBACK,
    Permission.VIEW_THEMES,
    Permission.VIEW_REPORTS,
  ],
}

/**
 * Checks if a given role possesses the requested permission.
 */
export function hasPermission(
  role: Role | undefined | null,
  permission: Permission
): boolean {
  if (!role) return false
  const permissions = ROLE_PERMISSIONS[role]
  return permissions ? permissions.includes(permission) : false
}

/* ==========================================================================
   Centralized Navigation Items Configuration
   ========================================================================== */

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  requiredPermission?: Permission
  allowedRoles?: readonly Role[]
  description?: string
}

export const NAVIGATION_ITEMS: readonly NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    requiredPermission: Permission.VIEW_FEEDBACK,
    description: 'Executive overview & KPI metrics',
  },
  {
    label: 'Feedback Inbox',
    href: '/inbox',
    icon: Inbox,
    requiredPermission: Permission.VIEW_FEEDBACK,
    description: 'Multi-channel feedback records',
  },
  {
    label: 'Theme Trends',
    href: '/trends',
    icon: TrendingUp,
    requiredPermission: Permission.VIEW_THEMES,
    description: 'Trend analysis & spike detection',
  },
  {
    label: 'Ask LOOP (Q&A)',
    href: '/ask',
    icon: Sparkles,
    requiredPermission: Permission.VIEW_FEEDBACK,
    description: 'Semantic conversational intelligence',
  },
  {
    label: 'VoC Reports',
    href: '/reports',
    icon: FileText,
    requiredPermission: Permission.VIEW_REPORTS,
    description: 'Voice of Customer executive digests',
  },
] as const

/**
 * Returns the filtered list of navigation items visible to a specific role.
 * Fallback to all items if role is still resolving, or empty if explicitly unauthenticated.
 */
export function getVisibleNavItems(role: Role | undefined | null): NavItem[] {
  if (!role) {
    return [...NAVIGATION_ITEMS]
  }

  return NAVIGATION_ITEMS.filter((item) => {
    // Check role restriction if explicitly specified
    if (item.allowedRoles && !item.allowedRoles.includes(role)) {
      return false
    }

    // Check permission restriction if specified
    if (item.requiredPermission && !hasPermission(role, item.requiredPermission)) {
      return false
    }

    return true
  })
}
