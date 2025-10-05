import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Council, Topic, Defence, Teacher, Enrollment, Grade_defences, councils_schedule } from "@/types/database";

export interface CouncilWithDetails extends Council {
  topics?: Array<Topic & { schedule?: councils_schedule }>;
  defences?: Array<Defence & { teacher?: Teacher | null }>;
  enrollments?: Array<Enrollment & { student?: any; gradeDefence?: Grade_defences | null }>;
  userPosition?: string;
}

interface UseCouncilsProps {
  profile: any;
  userRoles: string[];
}

export function useCouncils({ profile, userRoles }: UseCouncilsProps) {
  const [councils, setCouncils] = useState<CouncilWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCouncil, setSelectedCouncil] = useState<CouncilWithDetails | null>(null);
  const [gradingStudents, setGradingStudents] = useState<{[key: string]: number}>({});

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    if (typeof timestamp === "number") return new Date(timestamp * 1000);
    return new Date(timestamp);
  };

  const loadCouncils = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      // Start from councils_schedule (only show councils with assigned topics)
      const schedulesRef = collection(db, COLLECTIONS.COUNCILS_SCHEDULE);
      const schedulesSnapshot = await getDocs(schedulesRef);
      const allSchedules = schedulesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as councils_schedule));
      console.log(allSchedules)
      if (allSchedules.length === 0) {
        setCouncils([]);
        setLoading(false);
        return;
      }

      // Get unique council IDs from schedules
      const councilIdsFromSchedules = Array.from(new Set(allSchedules.map(s => s.councils_code).filter(Boolean)));

      // Load all councils
      const councilsRef = collection(db, COLLECTIONS.COUNCILS);
      const councilsSnapshot = await getDocs(councilsRef);
      const allCouncilsMap = new Map<string, Council>();
      councilsSnapshot.docs
        .filter(doc => councilIdsFromSchedules.includes(doc.id))
        .forEach(doc => {
          allCouncilsMap.set(doc.id, { id: doc.id, ...doc.data() } as Council);
        });

      console.log(allCouncilsMap)
      // Load defences
      const defencesRef = collection(db, COLLECTIONS.DEFENCES);
      const defencesSnapshot = await getDocs(defencesRef);
      const allDefences = defencesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Defence));

      // Filter councils based on user roles
      const councilsSet = new Map<string, Council>();

      if (userRoles.includes("Academic_affairs_staff")) {
        // Academic staff sees all councils in semester
        allCouncilsMap.forEach((council, id) => {
          if (council.semester_code === profile.semester_code) {
            councilsSet.set(id, council);
          }
        });
      }

      if (userRoles.includes("Department_Lecturer")) {
        // Department lecturer sees councils for their major
        allCouncilsMap.forEach((council, id) => {
          if (council.major_code === profile.major_code && council.semester_code === profile.semester_code) {
            councilsSet.set(id, council);
          }
        });
      }

      // Add councils where user is a member
      const userDefences = allDefences.filter(d => d.teacher_code === profile.id);
      userDefences.forEach(defence => {
        const council = allCouncilsMap.get(defence.council_code);
        if (council) {
          councilsSet.set(defence.council_code, council);
        }
      });

      const allCouncils = Array.from(councilsSet.values());

      if (allCouncils.length === 0) {
        setCouncils([]);
        setLoading(false);
        return;
      }

      // Filter schedules for these councils only
      const councilIds = allCouncils.map(c => c.id);
      const filteredSchedules = allSchedules.filter(s => councilIds.includes(s.councils_code || ''));

      // Get topics from schedules
      const topicIds = filteredSchedules.map((s) => s.topic_code).filter(Boolean);
      const topicsRef = collection(db, COLLECTIONS.TOPICS);
      const topicsSnapshot = await getDocs(topicsRef);
      const allTopics = topicsSnapshot.docs
        .filter((doc) => topicIds.includes(doc.id))
        .map((doc) => ({ id: doc.id, ...doc.data() } as Topic));

      // Filter defences for these councils only
      const councilDefences = allDefences.filter((d) => councilIds.includes(d.council_code));

      // Get teachers
      const teacherIds = councilDefences.map((d) => d.teacher_code).filter(Boolean);
      const teachersRef = collection(db, COLLECTIONS.TEACHERS);
      const teachersSnapshot = await getDocs(teachersRef);
      const allTeachers = teachersSnapshot.docs
        .filter((doc) => teacherIds.includes(doc.id))
        .map((doc) => ({ id: doc.id, ...doc.data() } as Teacher));

      // Get enrollments for topics
      const enrollmentsRef = collection(db, COLLECTIONS.ENROLLMENTS);
      const enrollmentsSnapshot = await getDocs(enrollmentsRef);
      const topicEnrollments = enrollmentsSnapshot.docs
        .filter((doc) => {
          const data = doc.data();
          return topicIds.some(topicId => {
            const topic = allTopics.find(t => t.id === topicId);
            return topic?.enrollment_code === doc.id;
          });
        })
        .map((doc) => ({ id: doc.id, ...doc.data() } as Enrollment));

      // Get students
      const studentIds = topicEnrollments.map(e => e.student_code).filter(Boolean);
      const studentsRef = collection(db, COLLECTIONS.STUDENTS);
      const studentsSnapshot = await getDocs(studentsRef);
      const allStudents = studentsSnapshot.docs
        .filter((doc) => studentIds.includes(doc.id))
        .map((doc) => ({ id: doc.id, ...doc.data() }));

      // Map councils with details
      const councilsWithDetails = await Promise.all(allCouncils.map(async (council) => {
        // Get topics for this council from schedules
        const councilSchedules = filteredSchedules.filter(s => s.councils_code === council.id);
        const councilTopics = councilSchedules.map(schedule => {
          const topic = allTopics.find(t => t.id === schedule.topic_code);
          return topic ? { ...topic, schedule } : null;
        }).filter(Boolean);

        const defences = councilDefences
          .filter((d) => d.council_code === council.id)
          .map((defence) => ({
            ...defence,
            teacher: allTeachers.find((t) => t.id === defence.teacher_code) || null,
          }));

        const userDefence = defences.find(d => d.teacher_code === profile.id);
        const userPosition = userDefence?.position || "";

        // Get all enrollments for all topics in this council
        const enrollments = topicEnrollments.filter(e => {
          const enrollmentTopic = allTopics.find(t => t.enrollment_code === e.id);
          return councilTopics.some(ct => ct?.id === enrollmentTopic?.id);
        });

        const enrollmentsWithGrades = await Promise.all(enrollments.map(async (enrollment) => {
          const student = allStudents.find(s => s.id === enrollment.student_code);
          let gradeDefence = null;

          if (enrollment.grade_code) {
            const gradeDoc = await getDoc(doc(db, "grade_defences", enrollment.grade_code));
            if (gradeDoc.exists()) {
              gradeDefence = { id: gradeDoc.id, ...gradeDoc.data() } as Grade_defences;
            }
          }

          return {
            ...enrollment,
            student,
            gradeDefence
          };
        }));

        return {
          ...council,
          topics: councilTopics as Array<Topic & { schedule?: councils_schedule }>,
          defences,
          userPosition,
          enrollments: enrollmentsWithGrades,
        };
      }));

      // Sort by date (use earliest schedule time)
      councilsWithDetails.sort((a, b) => {
        const aDate = a.topics?.[0]?.schedule?.time_start
          ? formatTimestamp(a.topics[0].schedule.time_start).getTime()
          : 0;
        const bDate = b.topics?.[0]?.schedule?.time_start
          ? formatTimestamp(b.topics[0].schedule.time_start).getTime()
          : 0;
        return aDate - bDate;
      });

      setCouncils(councilsWithDetails);
    } catch (error) {
      console.error("Error loading councils:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmit = async (enrollmentId: string, gradeCode: string | undefined, studentCode: string) => {
    const grade = gradingStudents[enrollmentId];
    if (grade === undefined || grade < 0 || grade > 10) {
      alert("Vui lòng nhập điểm hợp lệ (0-10)");
      return;
    }

    try {
      const gradeField = selectedCouncil?.userPosition === "chairman" || selectedCouncil?.userPosition === "president"
        ? "council"
        : "secretary";

      if (gradeCode) {
        await updateDoc(doc(db, "grade_defences", gradeCode), {
          [gradeField]: grade,
          updated_at: new Date()
        });
      } else {
        const newGradeRef = doc(collection(db, "grade_defences"));
        await setDoc(newGradeRef, {
          [gradeField]: grade,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: profile?.id,
          updated_by: profile?.id
        });

        await updateDoc(doc(db, COLLECTIONS.ENROLLMENTS, enrollmentId), {
          grade_code: newGradeRef.id
        });
      }

      alert(`Đã chấm điểm ${gradeField === "council" ? "chủ tịch" : "thư ký"} thành công`);
      loadCouncils();
      setSelectedCouncil(null);
      setGradingStudents({});
    } catch (error) {
      console.error("Error saving grade:", error);
      alert("Có lỗi khi lưu điểm");
    }
  };

  useEffect(() => {
    loadCouncils();
  }, [profile]);

  return {
    councils,
    loading,
    selectedCouncil,
    setSelectedCouncil,
    gradingStudents,
    setGradingStudents,
    formatTimestamp,
    handleGradeSubmit,
    loadCouncils,
  };
}
