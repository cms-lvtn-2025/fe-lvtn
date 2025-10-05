"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { collection, query, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { COLLECTIONS } from "@/lib/firebase/firestore"
import { Upload, Edit2, Trash2, FileSpreadsheet, Users, GraduationCap, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import * as XLSX from 'xlsx'
import type { Semester, Student, Teacher } from "@/types/database"

interface UploadResult {
  success: number
  errors: string[]
}

export default function SemestersPage() {
  const { profile, userRoles } = useAuth()
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(false)
  const [newSemesterTitle, setNewSemesterTitle] = useState("")
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  const studentFileRef = useRef<HTMLInputElement>(null)
  const teacherFileRef = useRef<HTMLInputElement>(null)

  // Only Academic_affairs_staff can manage semesters
  const canManageSemesters = userRoles.includes("Academic_affairs_staff")

  useEffect(() => {
    if (profile) {
      loadSemesters()
    }
  }, [profile])

  const loadSemesters = async () => {
    try {
      const semestersRef = collection(db, COLLECTIONS.SEMESTERS)
      const snapshot = await getDocs(semestersRef)
      const semestersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Semester[]

      // Sort by created_at descending
      semestersData.sort((a, b) => {
        const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at)
        const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at)
        return dateB.getTime() - dateA.getTime()
      })

      setSemesters(semestersData)
    } catch (error) {
      console.error("Error loading semesters:", error)
    }
  }

  const handleCreateSemester = async () => {
    if (!newSemesterTitle.trim()) {
      alert("Vui lòng nhập tên học kỳ")
      return
    }

    try {
      setLoading(true)
      await addDoc(collection(db, COLLECTIONS.SEMESTERS), {
        title: newSemesterTitle,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: profile?.id,
        updated_by: profile?.id
      })

      alert("Tạo học kỳ thành công!")
      setNewSemesterTitle("")
      loadSemesters()
    } catch (error) {
      console.error("Error creating semester:", error)
      alert("Có lỗi khi tạo học kỳ")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSemester = async (semesterId: string) => {
    if (!confirm("Bạn có chắc muốn xóa học kỳ này? Điều này sẽ ảnh hưởng đến dữ liệu liên quan.")) return

    try {
      await deleteDoc(doc(db, COLLECTIONS.SEMESTERS, semesterId))
      alert("Đã xóa học kỳ thành công!")
      loadSemesters()
    } catch (error) {
      console.error("Error deleting semester:", error)
      alert("Có lỗi khi xóa học kỳ")
    }
  }

  const downloadStudentTemplate = () => {
    const template = [
      {
        'x-student': 'x',
        'mssv': 'student-002',
        'email': 'lyvinhthai321@gmail.com',
        'phone': '366063879',
        'username': 'lyvinhthai',
        'gender': 'male',
        'major_code': 'maj-cs',
        'class_code': 'CC01'
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(template)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students')
    XLSX.writeFile(workbook, 'students_template.xlsx')
  }

  const downloadTeacherTemplate = () => {
    const template = [
      {
        'x-teacher': 'x',
        'msgv': 'teacher-002',
        'email': 'lyvinhthai321@gmail.com',
        'username': 'lyvinhthai',
        'gender': 'female',
        'major_code': 'maj-cs',
        'x-academic-affairs-staff': 'x',
        'x-supervisor-lecturer': 'x',
        'x-department-lecturer': 'x',
        'x-eviewer-lecturer': 'x',
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(template)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers')
    XLSX.writeFile(workbook, 'teachers_template.xlsx')
  }

  const parseExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = (error) => reject(error)
      reader.readAsBinaryString(file)
    })
  }

  const handleUploadStudents = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedSemester) {
      alert("Vui lòng chọn học kỳ trước")
      return
    }

    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      setUploadResult(null)

      const data = await parseExcelFile(file)
      const errors: string[] = []
      let success = 0

      for (let i = 0; i < data.length; i++) {
        const row = data[i]

        try {
          // Map Excel columns to database fields
          const studentData: any = {
            email: row['email'],
            phone: row['phone'],
            username: row['username'],
            gender: row['gender'],
            major_code: row['major_code'],
            class_code: row['class_code'],
            semester_code: selectedSemester.id,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: profile?.id,
            updated_by: profile?.id
          }

          // Validate required fields
          if (!studentData.email || !studentData.username) {
            errors.push(`Dòng ${i + 2}: Thiếu email hoặc username`)
            continue
          }

          await addDoc(collection(db, COLLECTIONS.STUDENTS), studentData)
          success++
        } catch (error: any) {
          errors.push(`Dòng ${i + 2}: ${error.message}`)
        }
      }

      setUploadResult({ success, errors })
      alert(`Upload thành công ${success}/${data.length} sinh viên`)

      // Reset file input
      if (studentFileRef.current) {
        studentFileRef.current.value = ""
      }
    } catch (error) {
      console.error("Error uploading students:", error)
      alert("Có lỗi khi upload file")
    } finally {
      setLoading(false)
    }
  }

  const handleUploadTeachers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedSemester) {
      alert("Vui lòng chọn học kỳ trước")
      return
    }

    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      setUploadResult(null)

      const data = await parseExcelFile(file)
      const errors: string[] = []
      let success = 0

      for (let i = 0; i < data.length; i++) {
        const row = data[i]

        try {
          // Map Excel columns to database fields
          const teacherData: any = {
            email: row['email'],
            username: row['username'],
            gender: row['gender'],
            major_code:  row['major_code'],
            semester_code: selectedSemester.id,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: profile?.id,
            updated_by: profile?.id
          }

          // Validate required fields
          if (!teacherData.email || !teacherData.username) {
            errors.push(`Dòng ${i + 2}: Thiếu email hoặc username`)
            continue
          }

          // Create teacher
          const teacherRef = await addDoc(collection(db, COLLECTIONS.TEACHERS), teacherData)

          // Create role_systems for each role marked with 'x'
          const roleMapping: { [key: string]: string } = {
            'x-academic-affairs-staff': 'Academic_affairs_staff',
            'x-department-lecturer': 'Department_Lecturer',
            'x-supervisor-lecturer': 'Supervisor_lecturer',
            'x-reviewer-lecturer': 'Reviewer_Lecturer'
          }

          for (const [excelColumn, roleValue] of Object.entries(roleMapping)) {
            if (row[excelColumn] === 'x') {
              await addDoc(collection(db, COLLECTIONS.ROLE_SYSTEMS), {
                title: `${roleValue} - ${teacherData.username}`,
                teacher_code: teacherRef.id,
                role: roleValue,
                semester_code: selectedSemester.id,
                activate: true,
                created_at: new Date(),
                updated_at: new Date(),
                created_by: profile?.id,
                updated_by: profile?.id
              })
            }
          }

          success++
        } catch (error: any) {
          errors.push(`Dòng ${i + 2}: ${error.message}`)
        }
      }

      setUploadResult({ success, errors })
      alert(`Upload thành công ${success}/${data.length} giáo viên`)

      // Reset file input
      if (teacherFileRef.current) {
        teacherFileRef.current.value = ""
      }
    } catch (error) {
      console.error("Error uploading teachers:", error)
      alert("Có lỗi khi upload file")
    } finally {
      setLoading(false)
    }
  }

  if (!canManageSemesters) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Alert variant="destructive">
            <AlertDescription>
              Bạn không có quyền quản lý học kỳ
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
          <h1 className="text-3xl font-bold mb-2">Quản lý học kỳ</h1>
          <p className="text-muted-foreground">
            Tạo học kỳ và upload danh sách sinh viên, giáo viên từ Excel
          </p>
        </div>

        {/* Create Semester */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Tạo học kỳ mới</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Tên học kỳ</Label>
                <Input
                  value={newSemesterTitle}
                  onChange={(e) => setNewSemesterTitle(e.target.value)}
                  placeholder="VD: Học kỳ 1 năm 2024-2025"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleCreateSemester} disabled={loading}>
                  {loading ? "Đang tạo..." : "Tạo học kỳ"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Semesters List */}
        <div className="grid gap-4">
          {semesters.length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">Chưa có học kỳ nào</p>
            </Card>
          ) : (
            semesters.map((semester) => (
              <Card key={semester.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{semester.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tạo: {semester.created_at instanceof Date
                        ? semester.created_at.toLocaleDateString('vi-VN')
                        : new Date(semester.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSemester(selectedSemester?.id === semester.id ? null : semester)}
                    >
                      {selectedSemester?.id === semester.id ? "Hủy chọn" : "Chọn"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSemester(semester.id!)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {selectedSemester?.id === semester.id && (
                  <div className="border-t pt-4 mt-4 space-y-4">
                    <Alert>
                      <AlertDescription>
                        Đang chọn học kỳ: <strong>{semester.title}</strong>
                      </AlertDescription>
                    </Alert>

                    {/* Upload Students */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Upload sinh viên
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              File Excel cần có các cột: email (chung), username (chung), gender (chung, enum),
                              major_code (chung), class_code(sv), phone (chung)
                            </p>
                            <Button
                              variant="outline"
                              onClick={downloadStudentTemplate}
                              className="w-full"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Tải file mẫu sinh viên
                            </Button>
                            <input
                              ref={studentFileRef}
                              type="file"
                              accept=".xlsx,.xls"
                              onChange={handleUploadStudents}
                              className="hidden"
                            />
                            <Button
                              onClick={() => studentFileRef.current?.click()}
                              disabled={loading}
                              className="w-full"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Chọn file Excel sinh viên
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Upload Teachers */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <GraduationCap className="w-5 h-5" />
                            Upload giáo viên
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              File Excel cần có các cột: email (chung), username (chung),
                              gender (chung, enum), major_code (chung)
                            </p>
                            <Button
                              variant="outline"
                              onClick={downloadTeacherTemplate}
                              className="w-full"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Tải file mẫu giáo viên
                            </Button>
                            <input
                              ref={teacherFileRef}
                              type="file"
                              accept=".xlsx,.xls"
                              onChange={handleUploadTeachers}
                              className="hidden"
                            />
                            <Button
                              onClick={() => teacherFileRef.current?.click()}
                              disabled={loading}
                              className="w-full"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Chọn file Excel giáo viên
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Upload Result */}
                    {uploadResult && (
                      <Alert>
                        <AlertDescription>
                          <p className="font-semibold mb-2">
                            Kết quả upload: {uploadResult.success} thành công
                          </p>
                          {uploadResult.errors.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium mb-1">Lỗi:</p>
                              <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                                {uploadResult.errors.map((error, idx) => (
                                  <li key={idx} className="text-red-600">{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
