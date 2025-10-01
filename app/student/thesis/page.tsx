"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TopicStatus } from "@/types/database"
import { Upload, FileText, Clock, CheckCircle, Calendar, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useSemester } from "@/lib/contexts/semester-context"
import { useTopicDetails } from "@/lib/hooks/use-topic-details"
import { StudentInfoCard } from "@/components/thesis/student-info-card"
import { TeamMembersCard } from "@/components/thesis/team-members-card"
import { GradesCard } from "@/components/thesis/grades-card"
import { CouncilInfoCard } from "@/components/thesis/council-info-card"

const statusConfig = {
  [TopicStatus.PENDING]: { label: "Chờ duyệt", color: "bg-yellow-500" },
  [TopicStatus.APPROVED]: { label: "Giữa kỳ", color: "bg-blue-500" },
  [TopicStatus.IN_PROGRESS]: { label: "Cuối kỳ", color: "bg-purple-500" },
  [TopicStatus.COMPLETED]: { label: "Chờ bảo vệ", color: "bg-green-500" },
  [TopicStatus.REJECTED]: { label: "Từ chối", color: "bg-red-500" },
}

export default function StudentThesisPage() {
  const { profile } = useAuth()
  const { currentSemester } = useSemester()
  const { topics, isLoading: loading } = useTopicDetails(profile?.id, currentSemester?.id)

  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0)
  const [submissionFile, setSubmissionFile] = useState<File | null>(null)
  const [submissionNote, setSubmissionNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const topic = topics.length > 0 ? topics[selectedTopicIndex] : null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSubmissionFile(e.target.files[0])
    }
  }

  const handleSubmit = async (type: "midterm" | "final") => {
    if (!submissionFile || !topic) return

    setIsSubmitting(true)
    setSubmitSuccess(false)

    // Fake API call
    setTimeout(() => {
      

      setSubmitSuccess(true)
      setSubmissionFile(null)
      setSubmissionNote("")
      setIsSubmitting(false)

      // Reset success message after 3s
      setTimeout(() => setSubmitSuccess(false), 3000)
    }, 1500)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (topics.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Bạn chưa được phân công luận văn. Vui lòng liên hệ giáo vụ.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  if (!topic) {
    return null
  }

  const canSubmitMidterm = topic.status === TopicStatus.APPROVED
  const canSubmitFinal = topic.status === TopicStatus.IN_PROGRESS

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Luận văn của tôi</h1>
          <p className="text-muted-foreground">Quản lý và nộp báo cáo luận văn</p>
        </div>

        {/* Topic Selector - Show only if multiple topics */}
        {topics.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Chọn luận văn</CardTitle>
              <CardDescription>Bạn có {topics.length} luận văn đang thực hiện</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {topics.map((t, index) => (
                  <Button
                    key={t.id}
                    variant={selectedTopicIndex === index ? "default" : "outline"}
                    onClick={() => setSelectedTopicIndex(index)}
                  >
                    {t.title.substring(0, 50)}...
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Topic Information */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{topic.title}</CardTitle>
                <CardDescription className="text-base">
                  <div className="space-y-1">
                    <p><strong>GVHD:</strong> {topic.teacher_supervisor_name}</p>
                    <p><strong>Chuyên ngành:</strong> {topic.major_name}</p>
                  </div>
                </CardDescription>
              </div>
              <Badge className={`${statusConfig[topic.status].color} text-white`}>
                {statusConfig[topic.status].label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {topic.time_start && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Bắt đầu:</strong> {topic.time_start.toLocaleDateString("vi-VN")}
                  </span>
                </div>
              )}
              {topic.time_end && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Kết thúc:</strong> {topic.time_end.toLocaleDateString("vi-VN")}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Student Info & Team Members */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {profile && (
            <StudentInfoCard
              username={profile.username}
              studentId={profile.id}
              email={profile.email}
            />
          )}
          <TeamMembersCard members={topic.team_members} />
        </div>

        {/* Grades & Council Info */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <GradesCard
            midtermGrade={topic.midterm_grade}
            finalGrade={topic.final_grade}
            defenseGrade={topic.defense_grade}
          />
          {topic.council_info && (
            <CouncilInfoCard
              title={topic.council_info.title}
              timeStart={topic.council_info.time_start}
              timeEnd={topic.council_info.time_end}
            />
          )}
        </div>

        {/* Status Guide */}
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {topic.status === TopicStatus.APPROVED && (
              <span><strong>Giai đoạn giữa kỳ:</strong> Bạn cần nộp báo cáo giữa kỳ. Có thể nộp nhiều lần.</span>
            )}
            {topic.status === TopicStatus.IN_PROGRESS && (
              <span><strong>Giai đoạn cuối kỳ:</strong> Bạn cần nộp báo cáo cuối kỳ. Có thể nộp nhiều lần.</span>
            )}
            {topic.status === TopicStatus.COMPLETED && (
              <span><strong>Chờ lên lịch bảo vệ:</strong> Báo cáo của bạn đã được chấp nhận. Vui lòng chờ thông báo lịch bảo vệ.</span>
            )}
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Midterm Submission */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Báo cáo giữa kỳ
              </CardTitle>
              <CardDescription>
                Nộp báo cáo tiến độ giữa kỳ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!canSubmitMidterm ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa đến giai đoạn nộp báo cáo giữa kỳ</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topic.midterm_submissions.length > 0 && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-900 dark:text-green-100">
                          Đã nộp {topic.midterm_submissions.length} lần
                        </span>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Lần nộp gần nhất: {topic.midterm_submissions[0].submitted_at.toLocaleDateString("vi-VN")}
                        {topic.midterm_submissions[0].grade && ` - Điểm: ${topic.midterm_submissions[0].grade}/10`}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="midterm-file">Chọn file báo cáo</Label>
                    <Input
                      id="midterm-file"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="midterm-note">Ghi chú (tùy chọn)</Label>
                    <Textarea
                      id="midterm-note"
                      placeholder="Nhập ghi chú về báo cáo..."
                      value={submissionNote}
                      onChange={(e) => setSubmissionNote(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  {submitSuccess && (
                    <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-900 dark:text-green-100">
                        Nộp báo cáo thành công!
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    className="w-full"
                    disabled={!submissionFile || isSubmitting}
                    onClick={() => handleSubmit("midterm")}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Đang nộp..." : "Nộp báo cáo giữa kỳ"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Final Submission */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Báo cáo cuối kỳ
              </CardTitle>
              <CardDescription>
                Nộp báo cáo hoàn chỉnh cuối kỳ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topic.status === TopicStatus.COMPLETED ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p className="font-medium text-green-700 dark:text-green-400">
                    Đã hoàn thành báo cáo cuối kỳ
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Chờ lên lịch bảo vệ
                  </p>
                </div>
              ) : !canSubmitFinal ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa đến giai đoạn nộp báo cáo cuối kỳ</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topic.final_submissions.length > 0 && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-900 dark:text-green-100">
                          Đã nộp {topic.final_submissions.length} lần
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="final-file">Chọn file báo cáo</Label>
                    <Input
                      id="final-file"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="final-note">Ghi chú (tùy chọn)</Label>
                    <Textarea
                      id="final-note"
                      placeholder="Nhập ghi chú về báo cáo..."
                      value={submissionNote}
                      onChange={(e) => setSubmissionNote(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  {submitSuccess && (
                    <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-900 dark:text-green-100">
                        Nộp báo cáo thành công!
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    className="w-full"
                    disabled={!submissionFile || isSubmitting}
                    onClick={() => handleSubmit("final")}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Đang nộp..." : "Nộp báo cáo cuối kỳ"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}