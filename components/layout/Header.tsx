'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LogOut,
  Building2,
  User as UserIcon,
  Menu,
  X,
  MessageSquareQuote,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getVisibleNavItems } from '@/lib/navigation'

export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const user = session?.user

  // Role-aware navigation items
  const visibleItems = getVisibleNavItems(user?.role)

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const roleVariant =
    user?.role === 'ADMIN' ? 'admin' : user?.role === 'ANALYST' ? 'analyst' : 'viewer'

  return (
    <>
      <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
        {/* Left Side: Mobile Menu Toggle & Workspace Info */}
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shrink-0"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block truncate">Workspace</span>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate">
                Demo Company
              </p>
            </div>
          </div>

          {/* Top Navigation Links for Desktop / Large Screen Quick Access */}
          <nav className="hidden xl:flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-4">
            {visibleItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Side: User Profile & Actions */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {user && (
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-semibold text-xs border border-indigo-200 dark:border-indigo-800 shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="hidden md:block text-right">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
                    {user.name || user.email}
                  </span>
                  <Badge variant={roleVariant} size="sm">
                    {user.role}
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-500 truncate max-w-[180px]">{user.email}</p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/login' })}
            icon={<LogOut className="w-4 h-4 text-zinc-500" />}
            className="text-zinc-600 dark:text-zinc-400 hover:text-rose-600 px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Mobile Drawer Navigation (lg:hidden) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[80vw] bg-zinc-900 text-zinc-100 flex flex-col justify-between h-full z-50 shadow-2xl border-r border-zinc-800 animate-in slide-in-from-left duration-200">
            <div>
              {/* Brand Header */}
              <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                    <MessageSquareQuote className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold tracking-tight text-sm text-white">Project LOOP</h2>
                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">AI Intelligence</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile in Drawer */}
              {user && (
                <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-900/60 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-700/50">
                      {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {user.name || user.email}
                        </span>
                        <Badge variant={roleVariant} size="sm">
                          {user.role}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              <nav className="p-3 space-y-1">
                <div className="px-3 py-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Menu Navigation
                </div>
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600/20 text-indigo-400 font-semibold shadow-xs border border-indigo-500/30'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-zinc-800/80 text-xs text-zinc-500 space-y-3">
              <div className="flex items-center justify-between">
                <span>Version 1.0</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-800/80 hover:bg-rose-950/40 text-zinc-300 hover:text-rose-400 border border-zinc-700/50 hover:border-rose-900/50 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
