"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, Award, LucideIcon } from "lucide-react"
import Link from "next/link"

interface QuickAction {
  href: string
  icon: LucideIcon
  label: string
}

const quickActions: QuickAction[] = [
  {
    href: "/student/thesis",
    icon: FileText,
    label: "Nộp báo cáo",
  },
  {
    href: "/student/schedule",
    icon: Calendar,
    label: "Xem lịch hẹn",
  },
  {
    href: "/student/thesis",
    icon: Award,
    label: "Xem điểm số",
  },
]

export function QuickActionsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
          <CardDescription>Các chức năng thường dùng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.href + action.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="outline" className="h-auto py-4 w-full" asChild>
                  <Link href={action.href} className="flex flex-col items-center gap-2">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <action.icon className="h-6 w-6" />
                    </motion.div>
                    <span>{action.label}</span>
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
