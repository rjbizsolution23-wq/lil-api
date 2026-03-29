"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  LayoutDashboard,
  Plug,
  Settings,
  Code2,
  Database,
  Terminal,
  ChevronLeft,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  User,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/integrations", icon: Plug, label: "Integrations" },
  { href: "/dashboard/endpoints", icon: Terminal, label: "Endpoints" },
  { href: "/dashboard/types", icon: Code2, label: "Types" },
  { href: "/dashboard/data", icon: Database, label: "Data" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-40 bg-slate-900 border-r border-slate-800 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-slate-950" />
            </div>
            {!collapsed && <span className="font-semibold text-white">Lil API</span>}
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-4 right-4 p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/50 backdrop-blur">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <Sun className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-white">Rick</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
