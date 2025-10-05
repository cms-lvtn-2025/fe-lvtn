"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/contexts/auth-context"
import { collection, query, where, getDocs, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { COLLECTIONS } from "@/lib/firebase/firestore"
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Teacher {
  id: string
  username: string
  email: string
  major_code: string
}

interface Major {
  id: string
  title: string
  faculty_code: string
  // code: string
}

type DefensePosition = "president" | "chairman" | "secretary" | "reviewer" | "member"

interface DefenceMember {
  position: DefensePosition
  teacher_code: string
  teacher?: Teacher
}

export default function CreateCouncilPage() {
  const { profile, userRoles } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Council details
  const [councilTitle, setCouncilTitle] = useState("")
  const [majorCode, setMajorCode] = useState("")
  const [majors, setMajors] = useState<Major[]>([])

  // Step 2-5: Select teachers for each position
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [defenceMembers, setDefenceMembers] = useState<DefenceMember[]>([])

  const positions: DefensePosition[] = ["president", "secretary", "reviewer", "member"]
  const positionLabels = {
    president: "Chủ tịch",
    chairman: "Chủ tịch",
    secretary: "Thư ký",
    reviewer: "Phản biện",
    member: "Ủy viên"
  }

  // Check permissions
  const canCreateCouncil = userRoles.includes("Academic_affairs_staff") || userRoles.includes("Department_Lecturer")

  useEffect(() => {
    if (profile) {
      loadMajors()
      if (userRoles.includes("Department_Lecturer")) {
        setMajorCode(profile.major_code)
      }
    }
  }, [profile])

  useEffect(() => {
    if (majorCode) {
      loadTeachers()
    }
  }, [majorCode])

  const loadMajors = async () => {
    try {
      const majorsRef = collection(db, COLLECTIONS.MAJORS)
      const snapshot = await getDocs(majorsRef)
      const majorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Major[]
      setMajors(majorsData)
    } catch (error) {
      console.error("Error loading majors:", error)
    }
  }

  const loadTeachers = async () => {
    if (!profile || !majorCode) return

    try {
      const teachersRef = collection(db, COLLECTIONS.TEACHERS)
      const q = query(
        teachersRef,
        where("major_code", "==", majorCode),
        where("semester_code", "==", profile.semester_code)
      )

      const snapshot = await getDocs(q)
      const teachersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Teacher[]

      setTeachers(teachersData)
    } catch (error) {
      console.error("Error loading teachers:", error)
    }
  }

  const getCurrentPosition = (): DefensePosition | null => {
    const positionIndex = step - 2 // step 2 = president (index 0)
    return positions[positionIndex] || null
  }

  const handleSelectTeacher = (teacher: Teacher) => {
    const position = getCurrentPosition()
    if (!position) return

    // Check if teacher already assigned
    const alreadyAssigned = defenceMembers.some(m => m.teacher_code === teacher.id)
    if (alreadyAssigned) {
      alert("Giáo viên này đã được chọn cho vị trí khác")
      return
    }

    // Update or add member
    const existingIndex = defenceMembers.findIndex(m => m.position === position)
    if (existingIndex >= 0) {
      const updated = [...defenceMembers]
      updated[existingIndex] = { position, teacher_code: teacher.id, teacher }
      setDefenceMembers(updated)
    } else {
      setDefenceMembers([...defenceMembers, { position, teacher_code: teacher.id, teacher }])
    }

    // Auto advance to next step
    if (step < 5) {
      setStep(step + 1)
    } else {
      setStep(6)
    }
  }

  const handleCreateCouncil = async () => {

    if (defenceMembers.length < 2) {
      alert("Hội đồng phải có ít nhất Chủ tịch và Thư ký")
      return
    }

    try {
      setLoading(true)

      // Create council without topic
      const councilData = {
        title: councilTitle,
        major_code: majorCode,
        semester_code: profile?.semester_code,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: profile?.id,
        updated_by: profile?.id
      }

      const councilRef = await addDoc(collection(db, COLLECTIONS.COUNCILS), councilData)

      // Create defences for each member
      for (const member of defenceMembers) {
        await addDoc(collection(db, COLLECTIONS.DEFENCES), {
          title: `${positionLabels[member.position]} - ${councilTitle}`,
          council_code: councilRef.id,
          teacher_code: member.teacher_code,
          position: member.position
        })
      }

      alert("Tạo hội đồng thành công! Bây giờ bạn có thể gán hội đồng vào đề tài.")
      router.push("/teacher/councils")
    } catch (error) {
      console.error("Error creating council:", error)
      alert("Có lỗi khi tạo hội đồng")
    } finally {
      setLoading(false)
    }
  }

  if (!canCreateCouncil) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Alert variant="destructive">
            <AlertDescription>
              Bạn không có quyền tạo hội đồng
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  const getSelectedTeacher = (position: DefensePosition) => {
    return defenceMembers.find(m => m.position === position)?.teacher
  }
  
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tạo hội đồng bảo vệ</h1>
          <p className="text-muted-foreground">
            Tạo hội đồng trước, sau đó gán vào đề tài
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {["Thông tin HĐ", "Chủ tịch", "Thư ký", "Phản biện", "Ủy viên", "Xác nhận"].map((label, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step > index + 1 ? "bg-green-500 text-white" :
                  step === index + 1 ? "bg-primary text-white" :
                  "bg-gray-200 text-gray-500"
                }`}>
                  {step > index + 1 ? <CheckCircle className="w-5 h-5" /> : index + 1}
                </div>
                <div className="ml-2 text-sm font-medium hidden md:block">{label}</div>
                {index < 5 && <div className="w-12 h-0.5 bg-gray-300 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Bước 1: Thông tin hội đồng"}
              {step >= 2 && step <= 5 && `Bước ${step}: Chọn ${positionLabels[getCurrentPosition()!]}`}
              {step === 6 && "Bước 6: Xác nhận thông tin"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: Council Details */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Tên hội đồng *</Label>
                  <Input
                    value={councilTitle}
                    onChange={(e) => setCouncilTitle(e.target.value)}
                    placeholder="VD: Hội đồng bảo vệ kỳ 1 năm 2024"
                  />
                </div>

                <div>
                  <Label>Bộ môn *</Label>
                  {userRoles.includes("Academic_affairs_staff") ? (
                    <select
                      value={majorCode}
                      onChange={(e) => {
                        console.log(e.target)
                        setMajorCode(e.target.value)
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Chọn bộ môn</option>
                      {majors.map(major => (
                        <option key={major.id} value={major.id}>
                          {major.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input value={profile?.major_code} disabled />
                  )}
                </div>
              </div>
            )}

            {/* Step 2-5: Select Teachers */}
            {step >= 2 && step <= 5 && (
              <div className="space-y-4">
                {getSelectedTeacher(getCurrentPosition()!) && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                    <p className="text-sm font-medium text-green-900">Đã chọn:</p>
                    <p className="text-green-700">{getSelectedTeacher(getCurrentPosition()!)?.username}</p>
                  </div>
                )}

                <div className="grid gap-3">
                  {teachers.map(teacher => {
                    const isAssigned = defenceMembers.some(m => m.teacher_code === teacher.id)
                    const isSelected = getSelectedTeacher(getCurrentPosition()!)?.id === teacher.id

                    return (
                      <div
                        key={teacher.id}
                        className={`p-3 border rounded-lg cursor-pointer transition ${
                          isSelected ? "border-primary bg-primary/5" :
                          isAssigned ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed" :
                          "hover:border-gray-400"
                        }`}
                        onClick={() => !isAssigned && handleSelectTeacher(teacher)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{teacher.username}</p>
                            <p className="text-sm text-muted-foreground">{teacher.email}</p>
                          </div>
                          {isAssigned && !isSelected && (
                            <Badge variant="secondary">Đã chọn</Badge>
                          )}
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 6: Confirmation */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Tên hội đồng:</h3>
                  <p className="text-muted-foreground">{councilTitle}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Bộ môn:</h3>
                  <p className="text-muted-foreground">{majorCode}</p>
                </div>


                <div>
                  <h3 className="font-medium mb-4">Thành viên hội đồng:</h3>
                  <div className="space-y-2">
                    {defenceMembers.map(member => (
                      <div key={member.position} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Badge>{positionLabels[member.position]}</Badge>
                        <span>{member.teacher?.username}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>

              {step < 6 ? (
                <Button
                  onClick={() => {
                    setStep(step + 1)
                  }}
                >
                  Tiếp theo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreateCouncil}
                  disabled={loading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {loading ? "Đang tạo..." : "Tạo hội đồng"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
