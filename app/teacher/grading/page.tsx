"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileText, Download, Save, User, BookOpen, Award, Search, Filter, ChevronLeft, ChevronRight, Users } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { updateDocument, createDocument, COLLECTIONS } from "@/lib/firebase/firestore"
import { collection, query, where, orderBy, limit, startAfter, getDocs, type DocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { Topic, Enrollment, Midterm, Final, Student } from "@/types/database"
import { Alert } from "@/components/ui/alert"

interface TopicWithDetails extends Topic {
  enrollment?: Enrollment | null
  student?: Student | null
  midterm?: Midterm | null
  final?: Final | null
}

interface StudentGrade {
  student: Student
  grade: string
  notes: string
}

type GradeType = "midterm" | "final"

export default function GradingPage() {
  const { profile } = useAuth()
  const [topics, setTopics] = useState<TopicWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState<TopicWithDetails | null>(null)
  const [gradeType, setGradeType] = useState<GradeType>("midterm")
  const [actionLoading, setActionLoading] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null)
  const [pageCache, setPageCache] = useState<Map<number, { topics: TopicWithDetails[], lastDoc: DocumentSnapshot | null }>>(new Map())
  const itemsPerPage = 5

  // Filter states
  const [filterType, setFilterType] = useState<"all" | "midterm" | "final">("all")
  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [searchField, setSearchField] = useState<"all" | "mssv" | "name" | "title">("all")

  // Grade data for midterm (whole topic)
  const [midtermData, setMidtermData] = useState({
    grade: "",
    feedback: "",
  })

  // Grade data for final (individual students)
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([])

  useEffect(() => {
    loadSupervisedTopics()
  }, [profile, currentPage, searchTerm, searchField, filterType])

  const handleSearch = () => {
    setSearchTerm(searchInput)
    setCurrentPage(1)
    setPageCache(new Map())
  }

  const handleClearSearch = () => {
    setSearchInput("")
    setSearchTerm("")
    setSearchField("all")
    setFilterType("all")
    setCurrentPage(1)
    setPageCache(new Map())
  }

  const loadSupervisedTopics = async () => {
    if (!profile?.id) return

    try {
      setLoading(true)

      // Check cache first
      const cached = pageCache.get(currentPage)
      if (cached && !searchTerm && filterType === "all") {
        setTopics(cached.topics)
        setLastDoc(cached.lastDoc)
        setLoading(false)
        return
      }

      // Build query
      const topicsRef = collection(db, COLLECTIONS.TOPICS)
      let constraints: any[] = [
        where("teacher_supervisor_code", "==", profile.id),
        where("status", "==", "approved"),
      ]

      // Add search filter for title
      if (searchTerm && searchField === "title") {
        constraints.push(
          where("title", ">=", searchTerm),
          where("title", "<=", searchTerm + "\uf8ff")
        )
      }

      // Add ordering and pagination
      constraints.push(orderBy("created_at", "desc"))

      if (currentPage > 1 && lastDoc) {
        constraints.push(startAfter(lastDoc))
      }

      constraints.push(limit(itemsPerPage))

      const q = query(topicsRef, ...constraints)
      const snapshot = await getDocs(q)

      const docs = snapshot.docs
      const newLastDoc = docs[docs.length - 1] || null

      const supervisedTopics = docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Topic))

      // Get total count (only on first load)
      if (currentPage === 1 && !searchTerm) {
        const countQuery = query(topicsRef,
          where("teacher_supervisor_code", "==", profile.id),
          where("status", "==", "approved")
        )
        const countSnapshot = await getDocs(countQuery)
        setTotalCount(countSnapshot.size)
      }

      // Get enrollments and students for current page only
      const enrollmentIds = supervisedTopics
        .map(t => t.enrollment_code)
        .filter(Boolean)

      let allEnrollments: Enrollment[] = []
      let allStudents: Student[] = []
      let allMidterms: Midterm[] = []
      let allFinals: Final[] = []

      if (enrollmentIds.length > 0) {
        const enrollmentsRef = collection(db, COLLECTIONS.ENROLLMENTS)
        const enrollmentsSnapshot = await getDocs(enrollmentsRef)
        allEnrollments = enrollmentsSnapshot.docs
          .filter(doc => enrollmentIds.includes(doc.id))
          .map(doc => ({ id: doc.id, ...doc.data() } as Enrollment))

        const studentIds = allEnrollments.map(e => e.student_code).filter(Boolean)
        if (studentIds.length > 0) {
          const studentsRef = collection(db, COLLECTIONS.STUDENTS)
          const studentsSnapshot = await getDocs(studentsRef)
          allStudents = studentsSnapshot.docs
            .filter(doc => studentIds.includes(doc.id))
            .map(doc => ({ id: doc.id, ...doc.data() } as Student))
        }

        const midtermIds = allEnrollments.map(e => e.midterm_code).filter(Boolean)
        if (midtermIds.length > 0) {
          const midtermsRef = collection(db, COLLECTIONS.MIDTERMS)
          const midtermsSnapshot = await getDocs(midtermsRef)
          allMidterms = midtermsSnapshot.docs
            .filter(doc => midtermIds.includes(doc.id))
            .map(doc => ({ id: doc.id, ...doc.data() } as Midterm))
        }

        const finalIds = allEnrollments.map(e => e.final_code).filter(Boolean)
        if (finalIds.length > 0) {
          const finalsRef = collection(db, COLLECTIONS.FINALS)
          const finalsSnapshot = await getDocs(finalsRef)
          allFinals = finalsSnapshot.docs
            .filter(doc => finalIds.includes(doc.id))
            .map(doc => ({ id: doc.id, ...doc.data() } as Final))
        }
      }

      // Map topics with details
      let topicsWithDetails = supervisedTopics.map((topic) => {
        let enrollmentData = allEnrollments.find(e => e.id === topic.enrollment_code) || null
        let studentData = enrollmentData ? allStudents.find(s => s.id === enrollmentData.student_code) || null : null
        let midtermData = enrollmentData ? allMidterms.find(m => m.id === enrollmentData.midterm_code) || null : null
        let finalData = enrollmentData ? allFinals.find(f => f.id === enrollmentData.final_code) || null : null

        return {
          ...topic,
          enrollment: enrollmentData,
          student: studentData,
          midterm: midtermData,
          final: finalData,
        }
      })

      // Client-side filters
      if (searchTerm && (searchField === "mssv" || searchField === "name" || searchField === "all")) {
        const term = searchTerm.toLowerCase()
        topicsWithDetails = topicsWithDetails.filter(topic => {
          if (searchField === "mssv") {
            return topic.student?.id?.toLowerCase().includes(term)
          } else if (searchField === "name") {
            return topic.student?.username?.toLowerCase().includes(term)
          } else {
            return (
              topic.student?.id?.toLowerCase().includes(term) ||
              topic.student?.username?.toLowerCase().includes(term) ||
              topic.student?.email?.toLowerCase().includes(term)
            )
          }
        })
      }

      if (filterType === "midterm") {
        topicsWithDetails = topicsWithDetails.filter(t => t.enrollment_code)
      } else if (filterType === "final") {
        topicsWithDetails = topicsWithDetails.filter(t => t.enrollment_code)
      }

      setTopics(topicsWithDetails)
      setLastDoc(newLastDoc)

      // Cache the page
      if (!searchTerm && filterType === "all") {
        setPageCache(prev => new Map(prev).set(currentPage, {
          topics: topicsWithDetails,
          lastDoc: newLastDoc
        }))
      }

    } catch (error) {
      console.error("Error loading topics:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitMidtermGrade = async () => {
    if (!selectedTopic || !profile?.id) return

    const grade = parseFloat(midtermData.grade)
    if (isNaN(grade) || grade < 0 || grade > 100) {
      alert("Vui lòng nhập điểm hợp lệ (0-100)")
      return
    }

    try {
      setActionLoading(true)

      if (selectedTopic.midterm?.id) {
        await updateDocument(
          COLLECTIONS.MIDTERMS,
          selectedTopic.midterm.id,
          {
            grade: grade,
            feedback: midtermData.feedback,
            status: "graded",
          },
          profile.id
        )
      } else {
        const midtermId = await createDocument(
          COLLECTIONS.MIDTERMS,
          {
            title: `Báo cáo giữa kỳ - ${selectedTopic.title}`,
            grade: grade,
            status: "graded",
            feedback: midtermData.feedback,
            file_submit: null,
          },
          profile.id
        )

        if (selectedTopic.enrollment?.id) {
          await updateDocument(
            COLLECTIONS.ENROLLMENTS,
            selectedTopic.enrollment.id,
            {
              midterm_code: midtermId,
            },
            profile.id
          )
        }
      }

      await loadSupervisedTopics()
      setSelectedTopic(null)
      setMidtermData({ grade: "", feedback: "" })
    } catch (error) {
      console.error("Error submitting midterm grade:", error)
      alert("Có lỗi xảy ra khi chấm điểm")
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmitFinalGrade = async () => {
    if (!selectedTopic || !profile?.id || !selectedTopic.student) return

    const studentGrade = studentGrades.find(sg => sg.student.id === selectedTopic.student?.id)
    if (!studentGrade) {
      alert("Vui lòng nhập điểm cho sinh viên")
      return
    }

    const grade = parseFloat(studentGrade.grade)
    if (isNaN(grade) || grade < 0 || grade > 100) {
      alert("Vui lòng nhập điểm hợp lệ (0-100)")
      return
    }

    try {
      setActionLoading(true)

      if (selectedTopic.final?.id) {
        await updateDocument(
          COLLECTIONS.FINALS,
          selectedTopic.final.id,
          {
            supervisor_grade: grade,
            notes: studentGrade.notes,
            status: selectedTopic.final.reviewer_grade && selectedTopic.final.defense_grade ? "completed" : "in_progress",
          },
          profile.id
        )
      } else {
        const finalId = await createDocument(
          COLLECTIONS.FINALS,
          {
            title: `Báo cáo cuối kỳ - ${selectedTopic.title}`,
            file_code: null,
            supervisor_grade: grade,
            reviewer_grade: null,
            defense_grade: null,
            final_grade: null,
            status: "in_progress",
            notes: studentGrade.notes,
            completion_date: null,
          },
          profile.id
        )

        if (selectedTopic.enrollment?.id) {
          await updateDocument(
            COLLECTIONS.ENROLLMENTS,
            selectedTopic.enrollment.id,
            {
              final_code: finalId,
            },
            profile.id
          )
        }
      }

      await loadSupervisedTopics()
      setSelectedTopic(null)
      setStudentGrades([])
    } catch (error) {
      console.error("Error submitting final grade:", error)
      alert("Có lỗi xảy ra khi chấm điểm")
    } finally {
      setActionLoading(false)
    }
  }

  const calculateFinalGrade = (final: Final | null) => {
    if (!final?.supervisor_grade || !final?.reviewer_grade || !final?.defense_grade) {
      return null
    }
    return (final.supervisor_grade * 0.4 + final.reviewer_grade * 0.3 + final.defense_grade * 0.3).toFixed(2)
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
    setPageCache(new Map())
  }, [searchTerm, searchField, filterType])

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
          <h1 className="text-3xl font-bold mb-2">Chấm điểm sinh viên</h1>
          <p className="text-muted-foreground">Quản lý và chấm điểm giữa kỳ, cuối kỳ cho sinh viên</p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold">Bộ lọc</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Filter by grade type */}
            <div>
              <Label>Loại điểm</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("all")}
                >
                  Tất cả
                </Button>
                <Button
                  variant={filterType === "midterm" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("midterm")}
                >
                  Giữa kỳ
                </Button>
                <Button
                  variant={filterType === "final" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("final")}
                >
                  Cuối kỳ
                </Button>
              </div>
            </div>

            {/* Search field selector */}
            <div>
              <Label>Tìm kiếm theo</Label>
              <select
                className="w-full mt-2 px-3 py-2 border border-border rounded-md bg-background"
                value={searchField}
                onChange={(e) => setSearchField(e.target.value as any)}
              >
                <option value="all">Tất cả</option>
                <option value="mssv">MSSV</option>
                <option value="name">Tên sinh viên</option>
                <option value="title">Tên đề tài</option>
              </select>
            </div>

            {/* Search input */}
            <div>
              <Label>Từ khóa</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nhập từ khóa tìm kiếm..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Hiển thị <strong>{topics.length}</strong> đề tài
              {!searchTerm && filterType === "all" && totalCount > 0 && ` (Tổng: ${totalCount})`}
            </p>
            <div className="flex gap-2">
              <Button onClick={handleSearch} size="sm">
                <Search className="w-4 h-4 mr-2" />
                Tìm
              </Button>
              {(searchTerm || filterType !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Topics List */}
        {topics.length === 0 ? (
          <Alert className="bg-blue-50 text-blue-900 border-blue-200">
            <BookOpen className="h-4 w-4" />
            <p>Không tìm thấy đề tài phù hợp với bộ lọc</p>
          </Alert>
        ) : (
          <>
            <div className="grid gap-6">
              {topics.map((topic) => {
                const finalGrade = calculateFinalGrade(topic.final || null)
                const isGrading = selectedTopic?.id === topic.id

                return (
                  <Card key={topic.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{topic.title}</h3>
                          <div className="flex gap-2">
                            {topic.midterm?.status === "graded" && (
                              <Badge className="bg-green-50 text-green-700 border-green-200">
                                Giữa kỳ: {topic.midterm.grade}/100
                              </Badge>
                            )}
                            {topic.final?.supervisor_grade && (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                                GVHD: {topic.final.supervisor_grade}/100
                              </Badge>
                            )}
                            {topic.final?.status === "completed" && finalGrade && (
                              <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                                <Award className="w-3 h-3 mr-1" />
                                Tổng: {finalGrade}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Student Info */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>
                              MSSV: <strong>{topic.student?.id || "N/A"}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>
                              Tên: <strong>{topic.student?.username || "Chưa có"}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Email: {topic.student?.email || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span>Ngành: {topic.major_code}</span>
                          </div>
                        </div>

                        {/* Final Grade Details */}
                        {topic.final && (
                          <div className="mb-4 p-3 bg-secondary/30 rounded-lg">
                            <p className="text-sm font-medium mb-2">Chi tiết điểm cuối kỳ:</p>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">GVHD (40%)</p>
                                <p className="text-lg font-semibold">{topic.final.supervisor_grade || "-"}/100</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">GVPB (30%)</p>
                                <p className="text-lg font-semibold">{topic.final.reviewer_grade || "-"}/100</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Bảo vệ (30%)</p>
                                <p className="text-lg font-semibold">{topic.final.defense_grade || "-"}/100</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Download buttons */}
                        <div className="flex gap-2 mb-4">
                          {topic.midterm?.file_submit && (
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Báo cáo giữa kỳ
                            </Button>
                          )}
                          {topic.final?.file_code && (
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Báo cáo cuối kỳ
                            </Button>
                          )}
                        </div>

                        {/* Grading Form */}
                        {isGrading && (
                          <div className="mt-4 p-4 bg-secondary/30 rounded-lg space-y-4">
                            {/* Grade Type Selector */}
                            <div className="flex gap-2">
                              <Button
                                variant={gradeType === "midterm" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setGradeType("midterm")}
                              >
                                Chấm giữa kỳ (Đề tài)
                              </Button>
                              <Button
                                variant={gradeType === "final" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setGradeType("final")}
                              >
                                Chấm cuối kỳ (Sinh viên)
                              </Button>
                            </div>

                            {/* Midterm Grading - For whole topic */}
                            {gradeType === "midterm" && (
                              <>
                                <Alert className="bg-blue-50 text-blue-900 border-blue-200">
                                  <Users className="h-4 w-4" />
                                  <p>Chấm điểm cho toàn bộ đề tài</p>
                                </Alert>
                                <div>
                                  <Label htmlFor="midterm_grade">
                                    Điểm giữa kỳ (0-100) <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    id="midterm_grade"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    value={midtermData.grade}
                                    onChange={(e) => setMidtermData({ ...midtermData, grade: e.target.value })}
                                    placeholder="Nhập điểm..."
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="midterm_feedback">Nhận xét</Label>
                                  <Textarea
                                    id="midterm_feedback"
                                    rows={3}
                                    value={midtermData.feedback}
                                    onChange={(e) => setMidtermData({ ...midtermData, feedback: e.target.value })}
                                    placeholder="Nhận xét về báo cáo giữa kỳ..."
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button onClick={handleSubmitMidtermGrade} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
                                    <Save className="w-4 h-4 mr-2" />
                                    Lưu điểm giữa kỳ
                                  </Button>
                                </div>
                              </>
                            )}

                            {/* Final Grading - For individual student */}
                            {gradeType === "final" && topic.student && (
                              <>
                                <Alert className="bg-blue-50 text-blue-900 border-blue-200">
                                  <User className="h-4 w-4" />
                                  <p>Chấm điểm cho sinh viên: {topic.student.username} ({topic.student.id})</p>
                                </Alert>
                                <div>
                                  <Label htmlFor="final_grade">
                                    Điểm hướng dẫn (0-100) <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    id="final_grade"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    value={studentGrades.find(sg => sg.student.id === topic.student?.id)?.grade || ""}
                                    onChange={(e) => {
                                      const existing = studentGrades.find(sg => sg.student.id === topic.student?.id)
                                      if (existing) {
                                        setStudentGrades(prev => prev.map(sg =>
                                          sg.student.id === topic.student?.id
                                            ? { ...sg, grade: e.target.value }
                                            : sg
                                        ))
                                      } else {
                                        setStudentGrades(prev => [...prev, {
                                          student: topic.student!,
                                          grade: e.target.value,
                                          notes: ""
                                        }])
                                      }
                                    }}
                                    placeholder="Nhập điểm hướng dẫn..."
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">Điểm này chiếm 40% tổng điểm</p>
                                </div>
                                <div>
                                  <Label htmlFor="final_notes">Nhận xét</Label>
                                  <Textarea
                                    id="final_notes"
                                    rows={3}
                                    value={studentGrades.find(sg => sg.student.id === topic.student?.id)?.notes || ""}
                                    onChange={(e) => {
                                      const existing = studentGrades.find(sg => sg.student.id === topic.student?.id)
                                      if (existing) {
                                        setStudentGrades(prev => prev.map(sg =>
                                          sg.student.id === topic.student?.id
                                            ? { ...sg, notes: e.target.value }
                                            : sg
                                        ))
                                      } else {
                                        setStudentGrades(prev => [...prev, {
                                          student: topic.student!,
                                          grade: "",
                                          notes: e.target.value
                                        }])
                                      }
                                    }}
                                    placeholder="Nhận xét về quá trình làm việc..."
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button onClick={handleSubmitFinalGrade} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
                                    <Save className="w-4 h-4 mr-2" />
                                    Lưu điểm cuối kỳ
                                  </Button>
                                </div>
                              </>
                            )}

                            <Button
                              onClick={() => {
                                setSelectedTopic(null)
                                setMidtermData({ grade: "", feedback: "" })
                                setStudentGrades([])
                              }}
                              variant="outline"
                              disabled={actionLoading}
                            >
                              Hủy
                            </Button>
                          </div>
                        )}
                      </div>

                      {!isGrading && (
                        <Button
                          onClick={() => {
                            setSelectedTopic(topic)
                            setMidtermData({
                              grade: topic.midterm?.grade?.toString() || "",
                              feedback: topic.midterm?.feedback || "",
                            })
                            if (topic.student) {
                              setStudentGrades([{
                                student: topic.student,
                                grade: topic.final?.supervisor_grade?.toString() || "",
                                notes: topic.final?.notes || "",
                              }])
                            }
                          }}
                          variant="outline"
                        >
                          Chấm điểm
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Trang {currentPage} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Trước
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        )
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2 py-1">...</span>
                      }
                      return null
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sau
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
