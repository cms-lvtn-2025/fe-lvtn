"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, FileText, Calendar, CheckCircle, Clock, Award, ArrowRight, TrendingUp } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { COLLECTIONS } from "@/lib/firebase/firestore"
import type { Topic, Council, Midterm, Final } from "@/types/database"
import Link from "next/link"

interface DashboardStats {
  totalStudents: number
  totalTopics: number
  upcomingCouncils: number
  gradedCount: number
  pendingMidterm: number
  pendingFinal: number
}

export default function TeacherDashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTopics: 0,
    upcomingCouncils: 0,
    gradedCount: 0,
    pendingMidterm: 0,
    pendingFinal: 0
  })
  const [recentTopics, setRecentTopics] = useState<Topic[]>([])
  const [upcomingCouncils, setUpcomingCouncils] = useState<Council[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [profile])

  const loadDashboardData = async () => {
    if (!profile?.id) return

    try {
      setLoading(true)

      // Load topics supervised by teacher
      const topicsRef = collection(db, COLLECTIONS.TOPICS)
      const topicsQuery = query(
        topicsRef,
        where("teacher_supervisor_code", "==", profile.id),
        where("status", "==", "approved")
      )
      const topicsSnapshot = await getDocs(topicsQuery)
      const topics = topicsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic))

      // Get unique students
      const enrollmentIds = topics.map(t => t.enrollment_code).filter(Boolean)
      const uniqueStudents = new Set()

      for (const enrollmentId of enrollmentIds) {
        const enrollmentsRef = collection(db, COLLECTIONS.ENROLLMENTS)
        const enrollmentSnapshot = await getDocs(enrollmentsRef)
        const enrollment = enrollmentSnapshot.docs.find(doc => doc.id === enrollmentId)
        if (enrollment?.data().student_code) {
          uniqueStudents.add(enrollment.data().student_code)
        }
      }

      // Count graded midterms and finals
      const midtermsRef = collection(db, COLLECTIONS.MIDTERMS)
      const midtermsSnapshot = await getDocs(midtermsRef)
      const allMidterms = midtermsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Midterm))

      const finalsRef = collection(db, COLLECTIONS.FINALS)
      const finalsSnapshot = await getDocs(finalsRef)
      const allFinals = finalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Final))

      const gradedMidterms = allMidterms.filter(m => m.status === "graded").length
      const gradedFinals = allFinals.filter(f => f.supervisor_grade !== null && f.supervisor_grade !== undefined).length

      // Pending grading
      const pendingMidterm = topics.length - gradedMidterms
      const pendingFinal = topics.length - gradedFinals

      // Get councils
      const defencesRef = collection(db, COLLECTIONS.DEFENCES)
      const defencesQuery = query(defencesRef, where("teacher_code", "==", profile.id))
      const defencesSnapshot = await getDocs(defencesQuery)
      const councilIds = [...new Set(defencesSnapshot.docs.map(doc => doc.data().council_code))]

      const councilsRef = collection(db, COLLECTIONS.COUNCILS)
      const councilsSnapshot = await getDocs(councilsRef)
      const allCouncils = councilsSnapshot.docs
        .filter(doc => councilIds.includes(doc.id))
        .map(doc => ({ id: doc.id, ...doc.data() } as Council))

      // Filter upcoming councils (future dates)
      const now = new Date()
      const upcoming = allCouncils.filter(c => {
        if (!c.time_start) return false
        const councilDate = typeof c.time_start === 'number'
          ? new Date(c.time_start * 1000)
          : new Date(c.time_start)
        return councilDate > now
      })

      // Sort upcoming councils by date
      upcoming.sort((a, b) => {
        const aDate = a.time_start ? (typeof a.time_start === 'number' ? a.time_start * 1000 : new Date(a.time_start).getTime()) : 0
        const bDate = b.time_start ? (typeof b.time_start === 'number' ? b.time_start * 1000 : new Date(b.time_start).getTime()) : 0
        return aDate - bDate
      })

      // Get recent topics (last 5)
      const sortedTopics = [...topics].sort((a, b) => {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
        return bDate - aDate
      })

      setStats({
        totalStudents: uniqueStudents.size,
        totalTopics: topics.length,
        upcomingCouncils: upcoming.length,
        gradedCount: gradedMidterms + gradedFinals,
        pendingMidterm: Math.max(0, pendingMidterm),
        pendingFinal: Math.max(0, pendingFinal)
      })

      setRecentTopics(sortedTopics.slice(0, 5))
      setUpcomingCouncils(upcoming.slice(0, 3))

    } catch (error) {
      console.error("Error loading dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ""
    const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return ""
    const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp)
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <p>Đang tải...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tổng quan</h1>
          <p className="text-muted-foreground">Chào mừng trở lại, {profile?.username}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.totalStudents}</p>
            <p className="text-sm text-muted-foreground">Sinh viên hướng dẫn</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.totalTopics}</p>
            <p className="text-sm text-muted-foreground">Đề tài đang dẫn</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">{stats.upcomingCouncils}</p>
            <p className="text-sm text-muted-foreground">Hội đồng sắp tới</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">{stats.gradedCount}</p>
            <p className="text-sm text-muted-foreground">Đã chấm điểm</p>
          </Card>
        </div>

        {/* Pending Tasks */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Cần xử lý</h2>
              <Link href="/teacher/grading">
                <Button variant="ghost" size="sm">
                  Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-900">Chấm giữa kỳ</p>
                    <p className="text-sm text-orange-700">{stats.pendingMidterm} đề tài chưa chấm</p>
                  </div>
                </div>
                <Badge className="bg-orange-600 text-white">{stats.pendingMidterm}</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-900">Chấm cuối kỳ</p>
                    <p className="text-sm text-purple-700">{stats.pendingFinal} sinh viên chưa chấm</p>
                  </div>
                </div>
                <Badge className="bg-purple-600 text-white">{stats.pendingFinal}</Badge>
              </div>
            </div>
          </Card>

          {/* Upcoming Councils */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Hội đồng sắp tới</h2>
              <Link href="/teacher/councils">
                <Button variant="ghost" size="sm">
                  Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            {upcomingCouncils.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có hội đồng nào</p>
            ) : (
              <div className="space-y-3">
                {upcomingCouncils.map(council => (
                  <div key={council.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{council.title}</p>
                      <p className="text-sm text-muted-foreground">{formatDateTime(council.time_start)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Topics */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Đề tài gần đây</h2>
            <Link href="/teacher/grading">
              <Button variant="ghost" size="sm">
                Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          {recentTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có đề tài nào</p>
          ) : (
            <div className="space-y-3">
              {recentTopics.map(topic => (
                <div key={topic.id} className="flex items-start justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium mb-1">{topic.title}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Mã ngành: {topic.major_code}</span>
                      <span>•</span>
                      <span>{formatDate(topic.created_at)}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {topic.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
