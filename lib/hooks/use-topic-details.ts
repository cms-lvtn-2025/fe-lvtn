import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import {
  Topic,
  Teacher,
  Major,
  Midterm,
  Final,
  Council,
  Student,
  Defence,
  DefensePosition,
} from "@/types/database"
import {
  topicService,
  teacherService,
  majorService,
  midtermService,
  finalService,
  councilService,
  studentService,
  enrollmentService,
  defenceService,
} from "@/lib/firebase/firestore"

export interface TeamMember {
  id: string
  username: string
  email: string
  student_id: string
}

export interface CouncilMember {
  id: string
  name: string
  position: string
  position_title: string
}

export interface TopicDetails extends Topic {
  teacher_supervisor_name?: string
  major_name?: string
  team_members: TeamMember[]
  midterm_grade?: number
  final_grade?: number
  defense_grade?: number
  council_info?: {
    title: string
    time_start?: Date
    time_end?: Date
    council_id?: string
    members?: CouncilMember[]
  }
  midterm_submissions: Array<{
    id: string
    submitted_at: Date
    status: string
    grade?: number
  }>
  final_submissions: Array<{
    id: string
    submitted_at: Date
  }>
}

export function useTopicDetails(studentId: string | undefined, currentSemesterId: string | undefined) {
  const [topics, setTopics] = useState<TopicDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  useEffect(() => {
    async function fetchTopicDetails() {
      if (!studentId || !currentSemesterId) {
        setTopics([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // 1. Lấy tất cả enrollments của student
        const enrollments = await enrollmentService.getByStudent(studentId)

        if (!enrollments || enrollments.length === 0) {
          setTopics([])
          setIsLoading(false)
          return
        }

        // 2. Lấy tất cả topics trong semester hiện tại
        const allTopics = await topicService.getAll()
        const semesterTopics = allTopics.filter((t) => t.semester_code === currentSemesterId)

        // 3. Tìm tất cả topics thuộc về student (match với enrollments)
        const studentTopicsWithEnrollments: Array<{ topic: Topic; enrollment: any }> = []
        for (const enrollment of enrollments) {
          const foundTopic = semesterTopics.find((t) => t.enrollment_code === enrollment.id)
          if (foundTopic) {
            studentTopicsWithEnrollments.push({ topic: foundTopic, enrollment })
          }
        }

        if (studentTopicsWithEnrollments.length === 0) {
          setTopics([])
          setIsLoading(false)
          return
        }

        // 4. Process each topic to get full details
        const topicsWithDetails: TopicDetails[] = []

        for (const { topic: studentTopic, enrollment } of studentTopicsWithEnrollments) {
          // Lấy thông tin teacher
          let teacherName = "Chưa phân công"
          if (studentTopic.teacher_supervisor_code) {
            const teacher = await teacherService.getById(studentTopic.teacher_supervisor_code)
            if (teacher) {
              teacherName = teacher.username
            }
          }

          // Lấy thông tin major
          let majorName = "Chưa xác định"
          if (studentTopic.major_code) {
            const major = await majorService.getById(studentTopic.major_code)
            if (major) {
              majorName = major.title
            }
          }

          // Lấy danh sách thành viên nhóm
          let teamMembers: TeamMember[] = []
          try {
            const enrollmentsRef = collection(db, "enrollments")
            const sameTopicEnrollments = await getDocs(
              query(enrollmentsRef, where("id", "==", enrollment.id))
            )

            for (const enrollDoc of sameTopicEnrollments.docs) {
              const studentIdFromEnroll = enrollDoc.data().student_code
              if (studentIdFromEnroll && studentIdFromEnroll !== studentId) {
                const student = await studentService.getById(studentIdFromEnroll)
                if (student) {
                  teamMembers.push({
                    id: student.id,
                    username: student.username,
                    email: student.email,
                    student_id: student.id,
                  })
                }
              }
            }
          } catch (err) {
            console.error("Error fetching team members:", err)
          }

          // Lấy midterm submissions và điểm
          let midtermSubmissions: any[] = []
          let midtermGrade: number | undefined
          if (enrollment.midterm_code) {
            const midterm = await midtermService.getById(enrollment.midterm_code)
            if (midterm) {
              midtermGrade = midterm.grade
              if (midterm.file_submit) {
                midtermSubmissions = [
                  {
                    id: midterm.id,
                    submitted_at: midterm.updated_at,
                    status: midterm.status,
                    grade: midterm.grade,
                  },
                ]
              }
            }
          }

          // Lấy final submissions và điểm
          let finalSubmissions: any[] = []
          let finalGrade: number | undefined
          let defenseGrade: number | undefined
          let councilInfo: {
            title: string
            time_start?: Date
            time_end?: Date
            council_id?: string
            members?: CouncilMember[]
          } | undefined

          if (enrollment.final_code) {
            const final = await finalService.getById(enrollment.final_code)
            if (final) {
              finalGrade = final.final_grade
              defenseGrade = final.defense_grade

              try {
                // Get councils_schedule for this topic
                const schedulesRef = collection(db, "councils_schedule")
                const schedulesQuery = query(schedulesRef, where("topic_code", "==", studentTopic.id))
                const schedulesSnapshot = await getDocs(schedulesQuery)

                if (!schedulesSnapshot.empty) {
                  const schedule = schedulesSnapshot.docs[0].data()
                  const councilId = schedule.councils_code

                  if (councilId) {
                    const council = await councilService.getById(councilId)
                    if (council) {
                      // Fetch defence members (thành viên hội đồng)
                      const councilMembers: CouncilMember[] = []
                      try {
                        const defences = await defenceService.getByCouncil(council.id)

                        // Position labels
                        const positionLabels: Record<string, string> = {
                          president: "Chủ tịch",
                          secretary: "Thư ký",
                          reviewer: "Phản biện",
                          member: "Ủy viên",
                          chairman: "Chủ tịch",
                        }

                        for (const defence of defences) {
                          const teacher = await teacherService.getById(defence.teacher_code)
                          if (teacher) {
                            councilMembers.push({
                              id: defence.id,
                              name: teacher.username,
                              position: defence.position,
                              position_title: positionLabels[defence.position] || defence.title,
                            })
                          }
                        }
                      } catch (err) {
                        console.error("Error fetching defence members:", err)
                      }

                      councilInfo = {
                        title: council.title,
                        time_start: schedule.time_start,
                        time_end: schedule.time_end,
                        council_id: council.id,
                        members: councilMembers,
                      }
                    }
                  }
                }
              } catch (err) {
                console.error("Error fetching council:", err)
              }
            }
          }

          // Add to array
          topicsWithDetails.push({
            ...studentTopic,
            teacher_supervisor_name: teacherName,
            major_name: majorName,
            team_members: teamMembers,
            midterm_grade: midtermGrade,
            final_grade: finalGrade,
            defense_grade: defenseGrade,
            council_info: councilInfo,
            midterm_submissions: midtermSubmissions,
            final_submissions: finalSubmissions,
          })
        }

        setTopics(topicsWithDetails)
      } catch (err) {
        console.error("Error fetching topic details:", err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTopicDetails()
  }, [studentId, currentSemesterId])

  return { topics, isLoading, error }
}
