"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileText, Download, Save, User, BookOpen } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { getDocuments, updateDocument, createDocument, COLLECTIONS, query, where } from "@/lib/firebase/firestore"
import type { Topic, Enrollment, Midterm, Student } from "@/types/database"
import { Alert } from "@/components/ui/alert"

interface TopicWithDetails extends Topic {
  enrollment?: Enrollment | null
  student?: Student | null
  midterm?: Midterm | null
}

export default function MidtermGradingPage() {
  const { profile } = useAuth()
  const [topics, setTopics] = useState<TopicWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState<TopicWithDetails | null>(null)
  const [gradeData, setGradeData] = useState({
    grade: "",
    feedback: "",
  })
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadSupervisedTopics()
  }, [profile])

  const loadSupervisedTopics = async () => {
    if (!profile?.id) return

    try {
      setLoading(true)

      // Get topics where teacher is supervisor
      const supervisedTopics = await getDocuments<Topic>(COLLECTIONS.TOPICS, [
        where("teacher_supervisor_code", "==", profile.id),
        where("status", "==", "approved"),
      ])

      // Get enrollment and student details for each topic
      const topicsWithDetails = await Promise.all(
        supervisedTopics.map(async (topic) => {
          let enrollmentData = null
          let studentData = null
          let midtermData = null

          if (topic.enrollment_code) {
            const enrollments = await getDocuments<Enrollment>(COLLECTIONS.ENROLLMENTS, [
              where("__name__", "==", topic.enrollment_code),
            ])
            enrollmentData = enrollments[0] || null

            if (enrollmentData?.student_code) {
              const students = await getDocuments<Student>(COLLECTIONS.STUDENTS, [
                where("__name__", "==", enrollmentData.student_code),
              ])
              studentData = students[0] || null
            }

            if (enrollmentData?.midterm_code) {
              const midterms = await getDocuments<Midterm>(COLLECTIONS.MIDTERMS, [
                where("__name__", "==", enrollmentData.midterm_code),
              ])
              midtermData = midterms[0] || null
            }
          }

          return {
            ...topic,
            enrollment: enrollmentData,
            student: studentData,
            midterm: midtermData,
          }
        })
      )

      setTopics(topicsWithDetails)
    } catch (error) {
      console.error("Error loading topics:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitGrade = async () => {
    if (!selectedTopic || !profile?.id) return

    const grade = parseFloat(gradeData.grade)
    if (isNaN(grade) || grade < 0 || grade > 100) {
      alert("Vui lòng nhập điểm hợp lệ (0-100)")
      return
    }

    try {
      setActionLoading(true)

      if (selectedTopic.midterm?.id) {
        // Update existing midterm
        await updateDocument(
          COLLECTIONS.MIDTERMS,
          selectedTopic.midterm.id,
          {
            grade: grade,
            feedback: gradeData.feedback,
            status: "graded",
          },
          profile.id
        )
      } else {
        // Create new midterm
        const midtermId = await createDocument(
          COLLECTIONS.MIDTERMS,
          {
            title: `Báo cáo giữa kỳ - ${selectedTopic.title}`,
            grade: grade,
            status: "graded",
            feedback: gradeData.feedback,
            file_submit: null,
          },
          profile.id
        )

        // Update enrollment with midterm_code
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

      // Reload topics
      await loadSupervisedTopics()
      setSelectedTopic(null)
      setGradeData({ grade: "", feedback: "" })
    } catch (error) {
      console.error("Error submitting grade:", error)
      alert("Có lỗi xảy ra khi chấm điểm")
    } finally {
      setActionLoading(false)
    }
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
          <h1 className="text-3xl font-bold mb-2">Chấm điểm giữa kỳ</h1>
          <p className="text-muted-foreground">Đánh giá báo cáo giữa kỳ của sinh viên</p>
        </div>

        {topics.length === 0 ? (
          <Alert className="bg-blue-50 text-blue-900 border-blue-200">
            <BookOpen className="h-4 w-4" />
            <p>Chưa có đề tài nào để chấm điểm</p>
          </Alert>
        ) : (
          <div className="grid gap-6">
            {topics.map((topic) => (
              <Card key={topic.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{topic.title}</h3>
                      {topic.midterm?.status === "graded" ? (
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          Đã chấm: {topic.midterm.grade}/100
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Chưa chấm
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>
                          Sinh viên: {topic.student?.username || "Chưa có"} ({topic.student?.email || "N/A"})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>Mã ngành: {topic.major_code}</span>
                      </div>
                    </div>

                    {topic.midterm?.file_submit && (
                      <Button variant="outline" size="sm" className="mb-4">
                        <Download className="w-4 h-4 mr-2" />
                        Tải báo cáo giữa kỳ
                      </Button>
                    )}

                    {selectedTopic?.id === topic.id && (
                      <div className="mt-4 p-4 bg-secondary/30 rounded-lg space-y-4">
                        <div>
                          <Label htmlFor="grade">
                            Điểm (0-100) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="grade"
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={gradeData.grade}
                            onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
                            placeholder="Nhập điểm..."
                          />
                        </div>

                        <div>
                          <Label htmlFor="feedback">Nhận xét</Label>
                          <Textarea
                            id="feedback"
                            rows={4}
                            value={gradeData.feedback}
                            onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                            placeholder="Nhập nhận xét về báo cáo giữa kỳ..."
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={handleSubmitGrade} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
                            <Save className="w-4 h-4 mr-2" />
                            Lưu điểm
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedTopic(null)
                              setGradeData({ grade: "", feedback: "" })
                            }}
                            variant="outline"
                            disabled={actionLoading}
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedTopic?.id !== topic.id && (
                    <Button
                      onClick={() => {
                        setSelectedTopic(topic)
                        setGradeData({
                          grade: topic.midterm?.grade?.toString() || "",
                          feedback: topic.midterm?.feedback || "",
                        })
                      }}
                      variant="outline"
                    >
                      {topic.midterm?.status === "graded" ? "Sửa điểm" : "Chấm điểm"}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
