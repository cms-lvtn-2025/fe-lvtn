"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getPaginatedDocuments } from "@/lib/firebase/crud"
import { collection, query, where, orderBy, limit, startAfter, DocumentSnapshot, getDocs, getDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { COLLECTIONS } from "@/lib/firebase/firestore"
import { CheckCircle, XCircle, Search, ChevronLeft, ChevronRight, Users, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

interface Topic {
  id: string
  title: string
  description: string
  teacher_supervisor_code: string
  major_code: string
  status: string
  created_at: any
  semester_code: string
  enrollment_ids?: string[]
  supervisor?: any
  students?: any[]
  file_url?: string
}

export default function DepartmentApproveTopicsPage() {
  const { user, profile, userRoles } = useAuth()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [pageCache, setPageCache] = useState<Map<number, { topics: Topic[], lastDoc: DocumentSnapshot | null }>>(new Map())
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({})
  const [showRejectForm, setShowRejectForm] = useState<{ [key: string]: boolean }>({})

  const itemsPerPage = 10

  useEffect(() => {
    if (profile) {
      loadTopics()
    }
  }, [profile, currentPage, searchTerm])

  const loadTopics = async () => {
    if (!profile || !profile.major_code) return

    setLoading(true)
    try {
      // Check cache first
      if (pageCache.has(currentPage)) {
        const cached = pageCache.get(currentPage)!
        setTopics(cached.topics)
        setLastDoc(cached.lastDoc)
        setHasMore(cached.topics.length === itemsPerPage)
        setLoading(false)
        return
      }

      // Build Firestore query - get topics from same major
      const constraints: any[] = [
        where("major_code", "==", profile.major_code),
        where("semester_code", "==", profile.semester_code),
      ]

      // If search term exists, we'll filter on client side for flexibility
      constraints.push(orderBy("created_at", "desc"))
      constraints.push(limit(itemsPerPage))

      if (currentPage > 1 && lastDoc) {
        constraints.push(startAfter(lastDoc))
      }

      const topicsRef = collection(db, "topics")
      const q = query(topicsRef, ...constraints)
      const snapshot = await getDocs(q)

      let topicsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Topic[]

      // Load supervisor info
      const topicsWithSupervisor = await Promise.all(
        topicsData.map(async (topic) => {
          const supervisorDoc = await getDoc(doc(db, COLLECTIONS.TEACHERS, topic.teacher_supervisor_code))
          const supervisor = supervisorDoc.exists() ? supervisorDoc.data() : null

          // Load enrollments
          const enrollmentIds = topic.enrollment_ids || []
          const students: any[] = []

          for (const enrollmentId of enrollmentIds) {
            const enrollmentDoc = await getDoc(doc(db, COLLECTIONS.ENROLLMENTS, enrollmentId))
            if (enrollmentDoc.exists()) {
              const enrollment = enrollmentDoc.data()
              const studentDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, enrollment.student_code))
              if (studentDoc.exists()) {
                students.push({
                  id: studentDoc.id,
                  ...studentDoc.data()
                })
              }
            }
          }

          return {
            ...topic,
            supervisor,
            students
          }
        })
      )

      // Client-side search filter
      let filteredTopics = topicsWithSupervisor
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        filteredTopics = topicsWithSupervisor.filter(topic =>
          topic.title.toLowerCase().includes(term) ||
          topic.supervisor?.username?.toLowerCase().includes(term) ||
          topic.students?.some(s =>
            s.username?.toLowerCase().includes(term) ||
            s.id?.toLowerCase().includes(term)
          )
        )
      }

      setTopics(filteredTopics)

      const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null
      setLastDoc(newLastDoc)
      setHasMore(snapshot.docs.length === itemsPerPage)

      // Cache the page
      setPageCache(prev => new Map(prev).set(currentPage, {
        topics: filteredTopics,
        lastDoc: newLastDoc
      }))

    } catch (error) {
      console.error("Error loading topics:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setSearchTerm(searchInput)
    setCurrentPage(1)
    setPageCache(new Map())
    setLastDoc(null)
  }

  const handleApprove = async (topicId: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.TOPICS, topicId), {
        status: "approved",
        approved_at: new Date(),
        approved_by: profile?.id,
        updated_at: new Date()
      })

      // Refresh
      setPageCache(new Map())
      loadTopics()
    } catch (error) {
      console.error("Error approving topic:", error)
      alert("Có lỗi khi duyệt đề tài")
    }
  }

  const handleReject = async (topicId: string) => {
    if (!rejectReason[topicId] || !rejectReason[topicId].trim()) {
      alert("Vui lòng nhập lý do từ chối")
      return
    }

    try {
      await updateDoc(doc(db, COLLECTIONS.TOPICS, topicId), {
        status: "rejected",
        rejected_at: new Date(),
        rejected_by: profile?.id,
        reject_reason: rejectReason[topicId],
        updated_at: new Date()
      })

      // Reset form
      setShowRejectForm({ ...showRejectForm, [topicId]: false })
      setRejectReason({ ...rejectReason, [topicId]: "" })

      // Refresh
      setPageCache(new Map())
      loadTopics()
    } catch (error) {
      console.error("Error rejecting topic:", error)
      alert("Có lỗi khi từ chối đề tài")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Chờ duyệt", variant: "secondary" },
      approved: { label: "Đã duyệt", variant: "default" },
      rejected: { label: "Đã từ chối", variant: "destructive" },
    }

    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  if (!profile || !userRoles.includes("Department_Lecturer")) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Bạn không có quyền truy cập trang này
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Duyệt đề tài - Giáo viên bộ môn</h1>
        <p className="text-muted-foreground">
          Duyệt đề tài của bộ môn: <strong>{profile.major_code}</strong>
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Tìm theo tên đề tài, giáo viên, sinh viên..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Tìm
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : topics.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {searchTerm ? "Không tìm thấy đề tài phù hợp" : "Chưa có đề tài nào"}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {topics.map((topic) => (
            <Card key={topic.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="mb-2">{topic.title}</CardTitle>
                    <CardDescription>{topic.description}</CardDescription>
                  </div>
                  {getStatusBadge(topic.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Giáo viên hướng dẫn</p>
                    <p className="font-medium">{topic.supervisor?.username || topic.teacher_supervisor_code}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Bộ môn</p>
                    <p className="font-medium">{topic.major_code}</p>
                  </div>
                </div>

                {topic.students && topic.students.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Sinh viên đăng ký ({topic.students.length})
                    </p>
                    <div className="space-y-2">
                      {topic.students.map((student) => (
                        <div key={student.id} className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                          <span className="font-medium">{student.id}</span>
                          <span>-</span>
                          <span>{student.username}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {topic.file_url && (
                  <div>
                    <a
                      href={topic.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      📎 Xem file đính kèm
                    </a>
                  </div>
                )}

                {topic.status === "pending" && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleApprove(topic.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Duyệt
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectForm({ ...showRejectForm, [topic.id]: !showRejectForm[topic.id] })}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Từ chối
                    </Button>
                  </div>
                )}

                {showRejectForm[topic.id] && (
                  <div className="space-y-2 pt-2 border-t">
                    <Textarea
                      placeholder="Nhập lý do từ chối..."
                      value={rejectReason[topic.id] || ""}
                      onChange={(e) => setRejectReason({ ...rejectReason, [topic.id]: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(topic.id)}
                      >
                        Xác nhận từ chối
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRejectForm({ ...showRejectForm, [topic.id]: false })
                          setRejectReason({ ...rejectReason, [topic.id]: "" })
                        }}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && topics.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-muted-foreground">
            Trang {currentPage}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentPage(prev => prev - 1)
              }}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Trước
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCurrentPage(prev => prev + 1)
              }}
              disabled={!hasMore}
            >
              Sau
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  )
}
