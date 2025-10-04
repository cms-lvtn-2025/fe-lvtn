"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { collection, query, where, orderBy, limit, startAfter, DocumentSnapshot, getDocs, doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Search, ChevronLeft, ChevronRight, Users, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface TopicWithDetails {
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
  students?: {
    id: string
    username: string
    final_id?: string
    final?: any
    reviewer_grade?: number
  }[]
  file_url?: string
}

export default function ReviewerGradingPage() {
  const { user, profile, userRoles } = useAuth()
  const [topics, setTopics] = useState<TopicWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [pageCache, setPageCache] = useState<Map<number, { topics: TopicWithDetails[], lastDoc: DocumentSnapshot | null }>>(new Map())
  const [gradingData, setGradingData] = useState<{ [key: string]: { grade: number, notes: string } }>({})
  const [showGradeForm, setShowGradeForm] = useState<{ [key: string]: boolean }>({})

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

      // Get completed topics from same major
      const constraints: any[] = [
        where("major_code", "==", profile.major_code),
        where("semester_code", "==", profile.semester_code),
        where("status", "==", "completed"),
      ]

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
      })) as TopicWithDetails[]

      // Load supervisor and student info with finals
      const topicsWithDetails = await Promise.all(
        topicsData.map(async (topic) => {
          const supervisorDoc = await getDoc(doc(db, "profiles", topic.teacher_supervisor_code))
          const supervisor = supervisorDoc.exists() ? supervisorDoc.data() : null

          const enrollmentIds = topic.enrollment_ids || []
          const students: any[] = []

          for (const enrollmentId of enrollmentIds) {
            const enrollmentDoc = await getDoc(doc(db, "enrollments", enrollmentId))
            if (enrollmentDoc.exists()) {
              const enrollment = enrollmentDoc.data()
              const studentDoc = await getDoc(doc(db, "profiles", enrollment.student_code))

              if (studentDoc.exists()) {
                const studentData = studentDoc.data()

                // Get final record if exists
                let finalData = null
                let reviewerGrade = null
                if (enrollment.final_code) {
                  const finalDoc = await getDoc(doc(db, "finals", enrollment.final_code))
                  if (finalDoc.exists()) {
                    finalData = finalDoc.data()
                    reviewerGrade = finalData.reviewer_grade
                  }
                }

                students.push({
                  id: studentDoc.id,
                  username: studentData.username,
                  final_id: enrollment.final_code,
                  final: finalData,
                  reviewer_grade: reviewerGrade,
                  ...studentData
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
      let filteredTopics = topicsWithDetails
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        filteredTopics = topicsWithDetails.filter(topic =>
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

  const handleGradeSubmit = async (finalId: string, studentName: string) => {
    const data = gradingData[finalId]
    if (!data || data.grade === undefined || data.grade < 0 || data.grade > 10) {
      alert("Vui lòng nhập điểm hợp lệ (0-10)")
      return
    }

    try {
      await updateDoc(doc(db, "finals", finalId), {
        reviewer_grade: data.grade,
        notes: data.notes || "",
        graded_at: new Date(),
        graded_by: profile?.id
      })

      alert(`Đã chấm điểm phản biện cho sinh viên ${studentName}`)

      // Reset form
      setShowGradeForm({ ...showGradeForm, [finalId]: false })
      setGradingData({ ...gradingData, [finalId]: { grade: 0, notes: "" } })

      // Refresh
      setPageCache(new Map())
      loadTopics()
    } catch (error) {
      console.error("Error submitting grade:", error)
      alert("Có lỗi khi chấm điểm")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Chờ duyệt", variant: "secondary" },
      approved: { label: "Đã duyệt", variant: "default" },
      completed: { label: "Hoàn thành", variant: "default" },
      rejected: { label: "Đã từ chối", variant: "destructive" },
    }

    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  if (!profile || !userRoles.includes("Reviewer_Lecturer")) {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Chấm điểm phản biện</h1>
        <p className="text-muted-foreground">
          Chấm điểm phản biện cho các đề tài đã hoàn thành - Bộ môn: <strong>{profile.major_code}</strong>
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
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground">Đang tải...</p>
          </CardContent>
        </Card>
      ) : topics.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {searchTerm ? "Không tìm thấy đề tài phù hợp" : "Chưa có đề tài nào hoàn thành"}
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
                      Sinh viên ({topic.students.length})
                    </p>
                    <div className="space-y-3">
                      {topic.students.map((student) => (
                        <div key={student.id} className="bg-muted/50 p-3 rounded space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">{student.id}</span>
                              <span>-</span>
                              <span>{student.username}</span>
                            </div>
                            {student.reviewer_grade !== null && student.reviewer_grade !== undefined ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Đã chấm: {student.reviewer_grade}/10
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Chưa chấm</Badge>
                            )}
                          </div>

                          {student.final_id && (
                            <>
                              {student.reviewer_grade === null || student.reviewer_grade === undefined ? (
                                <>
                                  {!showGradeForm[student.final_id] ? (
                                    <Button
                                      size="sm"
                                      onClick={() => student.final_id && setShowGradeForm({ ...showGradeForm, [student.final_id]: true })}
                                    >
                                      Chấm điểm phản biện
                                    </Button>
                                  ) : (
                                    <div className="space-y-2 border-t pt-2">
                                      <div>
                                        <Label>Điểm phản biện (0-10)</Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          max="10"
                                          step="0.1"
                                          value={student.final_id ? (gradingData[student.final_id]?.grade || "") : ""}
                                          onChange={(e) => student.final_id && setGradingData({
                                            ...gradingData,
                                            [student.final_id]: {
                                              ...gradingData[student.final_id],
                                              grade: parseFloat(e.target.value)
                                            }
                                          })}
                                        />
                                      </div>
                                      <div>
                                        <Label>Ghi chú</Label>
                                        <Textarea
                                          placeholder="Nhận xét của phản biện..."
                                          value={student.final_id ? (gradingData[student.final_id]?.notes || "") : ""}
                                          onChange={(e) => student.final_id && setGradingData({
                                            ...gradingData,
                                            [student.final_id]: {
                                              ...gradingData[student.final_id],
                                              notes: e.target.value
                                            }
                                          })}
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => student.final_id && handleGradeSubmit(student.final_id, student.username)}
                                        >
                                          Xác nhận chấm điểm
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            if (student.final_id) {
                                              setShowGradeForm({ ...showGradeForm, [student.final_id]: false })
                                              setGradingData({ ...gradingData, [student.final_id]: { grade: 0, notes: "" } })
                                            }
                                          }}
                                        >
                                          Hủy
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  <p>Ghi chú: {student.final?.notes || "Không có"}</p>
                                </div>
                              )}
                            </>
                          )}
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
