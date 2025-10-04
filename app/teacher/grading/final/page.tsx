"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileText, Download, Save, User, BookOpen, Award } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { getDocuments, updateDocument, createDocument, COLLECTIONS, query, where } from "@/lib/firebase/firestore"
import type { Topic, Enrollment, Final, Student } from "@/types/database"
import { Alert } from "@/components/ui/alert"

interface TopicWithDetails extends Topic {
  enrollment?: Enrollment | null
  student?: Student | null
  final?: Final | null
}

export default function FinalGradingPage() {
  const { profile } = useAuth()
  const [topics, setTopics] = useState<TopicWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState<TopicWithDetails | null>(null)
  const [gradeData, setGradeData] = useState({
    supervisor_grade: "",
    notes: "",
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
          let finalData = null

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

            if (enrollmentData?.final_code) {
              const finals = await getDocuments<Final>(COLLECTIONS.FINALS, [
                where("__name__", "==", enrollmentData.final_code),
              ])
              finalData = finals[0] || null
            }
          }

          return {
            ...topic,
            enrollment: enrollmentData,
            student: studentData,
            final: finalData,
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

    const grade = parseFloat(gradeData.supervisor_grade)
    if (isNaN(grade) || grade < 0 || grade > 100) {
      alert("Vui lòng nhập điểm hợp lệ (0-100)")
      return
    }

    try {
      setActionLoading(true)

      if (selectedTopic.final?.id) {
        // Update existing final
        await updateDocument(
          COLLECTIONS.FINALS,
          selectedTopic.final.id,
          {
            supervisor_grade: grade,
            notes: gradeData.notes,
            status: selectedTopic.final.reviewer_grade && selectedTopic.final.defense_grade ? "completed" : "in_progress",
          },
          profile.id
        )
      } else {
        // Create new final
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
            notes: gradeData.notes,
            completion_date: null,
          },
          profile.id
        )

        // Update enrollment with final_code
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

      // Reload topics
      await loadSupervisedTopics()
      setSelectedTopic(null)
      setGradeData({ supervisor_grade: "", notes: "" })
    } catch (error) {
      console.error("Error submitting grade:", error)
      alert("Có lỗi xảy ra khi chấm điểm")
    } finally {
      setActionLoading(false)
    }
  }

  const calculateFinalGrade = (final: Final | null) => {
    if (!final?.supervisor_grade || !final?.reviewer_grade || !final?.defense_grade) {
      return null
    }
    // Formula: 40% supervisor + 30% reviewer + 30% defense
    return (final.supervisor_grade * 0.4 + final.reviewer_grade * 0.3 + final.defense_grade * 0.3).toFixed(2)
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
          <h1 className="text-3xl font-bold mb-2">Chấm điểm cuối kỳ</h1>
          <p className="text-muted-foreground">Đánh giá điểm hướng dẫn cho luận văn cuối kỳ</p>
        </div>

        {topics.length === 0 ? (
          <Alert className="bg-blue-50 text-blue-900 border-blue-200">
            <BookOpen className="h-4 w-4" />
            <p>Chưa có đề tài nào để chấm điểm</p>
          </Alert>
        ) : (
          <div className="grid gap-6">
            {topics.map((topic) => {
              const finalGrade = calculateFinalGrade(topic.final || null)

              return (
                <Card key={topic.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{topic.title}</h3>
                        {topic.final?.supervisor_grade ? (
                          <Badge className="bg-green-50 text-green-700 border-green-200">
                            Điểm GVHD: {topic.final.supervisor_grade}/100
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Chưa chấm
                          </Badge>
                        )}
                        {topic.final?.status === "completed" && finalGrade && (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                            <Award className="w-3 h-3 mr-1" />
                            Tổng kết: {finalGrade}
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

                      {/* Grade Details */}
                      {topic.final && (
                        <div className="mb-4 p-3 bg-secondary/30 rounded-lg">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Điểm GVHD (40%)</p>
                              <p className="text-lg font-semibold">
                                {topic.final.supervisor_grade || "-"}/100
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Điểm GVPB (30%)</p>
                              <p className="text-lg font-semibold">
                                {topic.final.reviewer_grade || "-"}/100
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Điểm bảo vệ (30%)</p>
                              <p className="text-lg font-semibold">
                                {topic.final.defense_grade || "-"}/100
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {topic.final?.file_code && (
                        <Button variant="outline" size="sm" className="mb-4">
                          <Download className="w-4 h-4 mr-2" />
                          Tải báo cáo cuối kỳ
                        </Button>
                      )}

                      {selectedTopic?.id === topic.id && (
                        <div className="mt-4 p-4 bg-secondary/30 rounded-lg space-y-4">
                          <div>
                            <Label htmlFor="supervisor_grade">
                              Điểm hướng dẫn (0-100) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="supervisor_grade"
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={gradeData.supervisor_grade}
                              onChange={(e) => setGradeData({ ...gradeData, supervisor_grade: e.target.value })}
                              placeholder="Nhập điểm hướng dẫn..."
                            />
                            <p className="text-xs text-muted-foreground mt-1">Điểm này chiếm 40% tổng điểm</p>
                          </div>

                          <div>
                            <Label htmlFor="notes">Nhận xét</Label>
                            <Textarea
                              id="notes"
                              rows={4}
                              value={gradeData.notes}
                              onChange={(e) => setGradeData({ ...gradeData, notes: e.target.value })}
                              placeholder="Nhận xét về quá trình làm việc và kết quả của sinh viên..."
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
                                setGradeData({ supervisor_grade: "", notes: "" })
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
                            supervisor_grade: topic.final?.supervisor_grade?.toString() || "",
                            notes: topic.final?.notes || "",
                          })
                        }}
                        variant="outline"
                      >
                        {topic.final?.supervisor_grade ? "Sửa điểm" : "Chấm điểm"}
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
