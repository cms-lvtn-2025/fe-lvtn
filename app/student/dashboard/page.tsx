"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { TopicListCard } from "@/components/dashboard/topic-list-card"
import { UpcomingDefenseCard } from "@/components/dashboard/upcoming-defense-card"
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card"
import {
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  Award,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useSemester } from "@/lib/contexts/semester-context"
import { useTopicDetails } from "@/lib/hooks/use-topic-details"
import { TopicStatus } from "@/types/database"

const statusConfig = {
  [TopicStatus.PENDING]: { label: "Chờ duyệt", color: "bg-yellow-500", icon: Clock },
  [TopicStatus.APPROVED]: { label: "Giữa kỳ", color: "bg-blue-500", icon: FileText },
  [TopicStatus.IN_PROGRESS]: { label: "Cuối kỳ", color: "bg-purple-500", icon: TrendingUp },
  [TopicStatus.COMPLETED]: { label: "Chờ bảo vệ", color: "bg-green-500", icon: CheckCircle },
  [TopicStatus.REJECTED]: { label: "Từ chối", color: "bg-red-500", icon: AlertCircle },
}

export default function StudentDashboardPage() {
  const { profile } = useAuth()
  const { currentSemester } = useSemester()
  const { topics, isLoading } = useTopicDetails(profile?.id, currentSemester?.id)

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  // Calculate statistics
  const totalTopics = topics.length
  const completedTopics = topics.filter((t) => t.status === TopicStatus.COMPLETED).length
  const inProgressTopics = topics.filter(
    (t) => t.status === TopicStatus.APPROVED || t.status === TopicStatus.IN_PROGRESS
  ).length
  const averageGrade =
    topics.filter((t) => t.final_grade).reduce((acc, t) => acc + (t.final_grade || 0), 0) /
      topics.filter((t) => t.final_grade).length || 0

  const upcomingDefense = topics
    .filter((t) => t.council_info?.time_start)
    .sort((a, b) => {
      const timeA = a.council_info?.time_start ? new Date(a.council_info.time_start).getTime() : 0
      const timeB = b.council_info?.time_start ? new Date(b.council_info.time_start).getTime() : 0
      return timeA - timeB
    })[0]

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tổng quan</h1>
          <p className="text-muted-foreground">
            Xin chào, <span className="font-semibold">{profile?.username}</span>! Đây là tổng quan về luận
            văn của bạn.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Tổng luận văn"
            value={totalTopics}
            description="Trong học kỳ này"
            icon={BookOpen}
            index={0}
          />
          <StatsCard
            title="Đang thực hiện"
            value={inProgressTopics}
            description="Luận văn đang làm"
            icon={TrendingUp}
            index={1}
          />
          <StatsCard
            title="Hoàn thành"
            value={completedTopics}
            description="Chờ bảo vệ/Đã xong"
            icon={CheckCircle}
            index={2}
          />
          <StatsCard
            title="Điểm TB"
            value={averageGrade > 0 ? averageGrade.toFixed(1) : "--"}
            description="Điểm trung bình"
            icon={Award}
            index={3}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <TopicListCard topics={topics} statusConfig={statusConfig} />
          <UpcomingDefenseCard upcomingDefense={upcomingDefense} />
        </div>

        <QuickActionsCard />
      </div>
    </DashboardLayout>
  )
}
