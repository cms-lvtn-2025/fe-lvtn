"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Upload, FileText, X, Calendar } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/lib/firebase/config"
import { createDocument, COLLECTIONS } from "@/lib/firebase/firestore"
import { Alert } from "@/components/ui/alert"

export default function SubmitTopicPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [formData, setFormData] = useState({
    title: "",
    major_code: "",
    description: "",
    time_start: "",
    time_end: "",
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "application/pdf",
      ]
      if (!validTypes.includes(file.type)) {
        setError("Chỉ chấp nhận file Word (.doc, .docx) hoặc PDF")
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Kích thước file không được vượt quá 10MB")
        return
      }

      setUploadedFile(file)
      setError("")
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setUploadProgress(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      if (!profile?.id) {
        throw new Error("Vui lòng đăng nhập lại")
      }

      if (!uploadedFile) {
        throw new Error("Vui lòng chọn file đề cương")
      }

      // Upload file to Firebase Storage
      const fileRef = ref(storage, `assignments/${Date.now()}_${uploadedFile.name}`)
      setUploadProgress(30)

      await uploadBytes(fileRef, uploadedFile)
      setUploadProgress(60)

      const fileUrl = await getDownloadURL(fileRef)
      setUploadProgress(80)

      // Create file document
      const fileId = await createDocument(
        COLLECTIONS.FILES,
        {
          title: `Đề cương - ${formData.title}`,
          file: fileUrl,
          status: "pending",
        },
        profile.id
      )

      // Create topic document
      await createDocument(
        COLLECTIONS.TOPICS,
        {
          title: formData.title,
          major_code: formData.major_code,
          assignment_code: fileId,
          enrollment_code: null,
          semester_code: profile.semester_code,
          teacher_supervisor_code: profile.id,
          status: "pending",
          time_start: new Date(formData.time_start),
          time_end: new Date(formData.time_end),
        },
        profile.id
      )

      setUploadProgress(100)
      setSuccess(true)

      // Reset form
      setFormData({
        title: "",
        major_code: "",
        description: "",
        time_start: "",
        time_end: "",
      })
      setUploadedFile(null)
      setUploadProgress(0)
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi gửi đề tài")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gửi đề tài mới</h1>
          <p className="text-muted-foreground">Đăng ký đề tài hướng dẫn cho sinh viên</p>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-50 text-red-900 border-red-200">
            <p>{error}</p>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 text-green-900 border-green-200">
            <p>Gửi đề tài thành công! Đề tài đang chờ duyệt.</p>
          </Alert>
        )}

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Topic Title */}
            <div>
              <Label htmlFor="title">
                Tên đề tài <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nhập tên đề tài..."
              />
            </div>

            {/* Major Code */}
            <div>
              <Label htmlFor="major_code">
                Mã ngành <span className="text-red-500">*</span>
              </Label>
              <Input
                id="major_code"
                required
                value={formData.major_code}
                onChange={(e) => setFormData({ ...formData, major_code: e.target.value })}
                placeholder="Ví dụ: maj-cs, maj-se..."
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Mô tả đề tài</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả ngắn gọn về đề tài..."
              />
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time_start">
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="time_start"
                  type="date"
                  required
                  value={formData.time_start}
                  onChange={(e) => setFormData({ ...formData, time_start: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="time_end">
                  Ngày kết thúc <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="time_end"
                  type="date"
                  required
                  value={formData.time_end}
                  onChange={(e) => setFormData({ ...formData, time_end: e.target.value })}
                />
              </div>
            </div>

            {/* File Upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>
                  File đề cương (Phiếu nhiệm vụ) <span className="text-red-500">*</span>
                </Label>
                <a
                  href="/template/0.1. Phieunhiemvu_mauTruong-CS-CE.docx"
                  download
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  Tải template mẫu
                </a>
              </div>
              <div className="mt-2">
                {!uploadedFile ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click để chọn file</span> hoặc kéo thả
                      </p>
                      <p className="text-xs text-muted-foreground">Word (.doc, .docx) hoặc PDF (max 10MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".doc,.docx,.pdf"
                      onChange={handleFileChange}
                      required
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoveFile}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Đang tải lên... {uploadProgress}%</p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Đang gửi..." : "Gửi đề tài"}
              </Button>
              <Button type="button" variant="outline" disabled={loading}>
                Lưu nháp
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
