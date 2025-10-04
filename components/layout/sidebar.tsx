"use client"

import React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { GraduationCap, LayoutDashboard, FileText, Users, Calendar, Settings, LogOut, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/contexts/auth-context"
import { signOut } from "@/lib/firebase/auth"
import { useRouter } from "next/navigation"
import { SemesterSelector } from "@/components/semester-selector"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const studentNavItems: NavItem[] = [
  { title: "Tổng quan", href: "/student/dashboard", icon: LayoutDashboard },
  { title: "Luận văn của tôi", href: "/student/thesis", icon: FileText },
  { title: "Lịch hẹn", href: "/student/schedule", icon: Calendar },
  { title: "Cài đặt", href: "/student/settings", icon: Settings },
]

// Role-specific menu items
const roleMenuItems: Record<string, NavItem[]> = {
  "Supervisor_lecturer": [
    { title: "Gửi đề tài", href: "/teacher/topics/submit", icon: FileText },
    { title: "Duyệt đề tài", href: "/teacher/topics/approve", icon: CheckCircle },
    { title: "Chấm điểm", href: "/teacher/grading", icon: FileText },
    { title: "Sinh viên hướng dẫn", href: "/teacher/students", icon: Users },
  ],
  "Department_Lecturer": [
    { title: "Duyệt đề tài bộ môn", href: "/teacher/department/approve", icon: CheckCircle },
  ],
  "Reviewer_Lecturer": [
    { title: "Chấm điểm phản biện", href: "/teacher/reviewer/grading", icon: FileText },
  ],
}

// Common items for all teachers
const commonTeacherItems: NavItem[] = [
  { title: "Tổng quan", href: "/teacher/dashboard", icon: LayoutDashboard },
]

const commonBottomItems: NavItem[] = [
  { title: "Hội đồng", href: "/teacher/councils", icon: Users },
  { title: "Cài đặt", href: "/teacher/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, userRoles } = useAuth()
  console.log(userRoles)
  // Merge navigation items based on all user roles
  const navItems = React.useMemo(() => {
    // If student or no roles, return student items
    if (userRoles.length === 0 || profile?.role === "student") {
      return studentNavItems
    }

    // For teachers, merge all role-specific items
    const mergedItems: NavItem[] = [...commonTeacherItems]
    const addedHrefs = new Set<string>(mergedItems.map(item => item.href))

    // Add items from each role
    userRoles.forEach(role => {
      const roleItems = roleMenuItems[role] || []
      roleItems.forEach(item => {
        if (!addedHrefs.has(item.href)) {
          mergedItems.push(item)
          addedHrefs.add(item.href)
        }
      })
    })

    // Add common bottom items
    commonBottomItems.forEach(item => {
      if (!addedHrefs.has(item.href)) {
        mergedItems.push(item)
        addedHrefs.add(item.href)
      }
    })

    return mergedItems
  }, [userRoles, profile?.role])

  async function handleSignOut() {
    await signOut()
    router.push("/")
  }

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-semibold text-sm">Quản lý Luận văn</h1>
            <p className="text-xs text-muted-foreground">ĐH Bách Khoa</p>
          </div>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-border space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {profile?.username?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.username || "User"}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile?.role || "user"}</p>
          </div>
        </div>

        {/* Semester Selector */}
        <SemesterSelector />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Đăng xuất
        </Button>
      </div>
    </div>
  )
}
