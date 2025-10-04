import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type { Council, Topic, Defence, Teacher, Enrollment, Grade_defences } from "@/types/database";

export interface CouncilWithDetails extends Council {
  topic?: Topic | null;
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

  // Assign topic states
  const [showAssignTopic, setShowAssignTopic] = useState<string | null>(null);
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Permissions
  const canAssignTopic = userRoles.includes("Academic_affairs_staff") || userRoles.includes("Department_Lecturer");
  const canGrade = !canAssignTopic;

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

      const councilsRef = collection(db, COLLECTIONS.COUNCILS);
      let allCouncils: Council[] = [];

      // Permission-based council loading
      if (userRoles.includes("Academic_affairs_staff")) {
        const councilsSnapshot = await getDocs(
          query(councilsRef, where("semester_code", "==", profile.semester_code))
        );
        allCouncils = councilsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Council));
      } else if (userRoles.includes("Department_Lecturer")) {
        const councilsSnapshot = await getDocs(
          query(
            councilsRef,
            where("major_code", "==", profile.major_code),
            where("semester_code", "==", profile.semester_code)
          )
        );
        allCouncils = councilsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Council));
      } else {
        const defencesRef = collection(db, COLLECTIONS.DEFENCES);
        const defencesQuery = query(
          defencesRef,
          where("teacher_code", "==", profile.id)
        );
        const defencesSnapshot = await getDocs(defencesQuery);
        const councilIds = Array.from(
          new Set(defencesSnapshot.docs.map((doc) => doc.data().council_code))
        );

        if (councilIds.length === 0) {
          setCouncils([]);
          setLoading(false);
          return;
        }

        const councilsSnapshot = await getDocs(councilsRef);
        allCouncils = councilsSnapshot.docs
          .filter((doc) => councilIds.includes(doc.id))
          .map((doc) => ({ id: doc.id, ...doc.data() } as Council));
      }

      // Get topics
      const topicIds = allCouncils.map((c) => c.topic_code).filter(Boolean);
      const topicsRef = collection(db, COLLECTIONS.TOPICS);
      const topicsSnapshot = await getDocs(topicsRef);
      const allTopics = topicsSnapshot.docs
        .filter((doc) => topicIds.includes(doc.id))
        .map((doc) => ({ id: doc.id, ...doc.data() } as Topic));

      // Get all defences for these councils
      const councilIds = allCouncils.map(c => c.id);
      const defencesRef = collection(db, COLLECTIONS.DEFENCES);
      const allDefencesSnapshot = await getDocs(defencesRef);
      const allDefences = allDefencesSnapshot.docs
        .filter((doc) => councilIds.includes(doc.data().council_code))
        .map((doc) => ({ id: doc.id, ...doc.data() } as Defence));

      // Get teachers
      const teacherIds = allDefences.map((d) => d.teacher_code).filter(Boolean);
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
        const topic = allTopics.find((t) => t.id === council.topic_code) || null;
        const councilDefences = allDefences
          .filter((d) => d.council_code === council.id)
          .map((defence) => ({
            ...defence,
            teacher: allTeachers.find((t) => t.id === defence.teacher_code) || null,
          }));

        const userDefence = councilDefences.find(d => d.teacher_code === profile.id);
        const userPosition = userDefence?.position || "";

        const enrollments = topic ? topicEnrollments.filter(e => {
          const enrollmentTopic = allTopics.find(t => t.enrollment_code === e.id);
          return enrollmentTopic?.id === topic.id;
        }) : [];

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
          topic,
          defences: councilDefences,
          userPosition,
          enrollments: enrollmentsWithGrades,
        };
      }));

      // Sort by date
      councilsWithDetails.sort((a, b) => {
        const aDate = a.time_start ? formatTimestamp(a.time_start).getTime() : 0;
        const bDate = b.time_start ? formatTimestamp(b.time_start).getTime() : 0;
        return aDate - bDate;
      });

      setCouncils(councilsWithDetails);
    } catch (error) {
      console.error("Error loading councils:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAssignTopic = async (councilId: string, majorCode: string) => {
    setShowAssignTopic(councilId);
    setAssignLoading(true);

    try {
      const topicsRef = collection(db, COLLECTIONS.TOPICS);
      const q = query(
        topicsRef,
        where("major_code", "==", majorCode),
        where("semester_code", "==", profile?.semester_code),
        where("status", "==", "completed")
      );
      const snapshot = await getDocs(q);
      const topics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic));
      setAvailableTopics(topics);
    } catch (error) {
      console.error("Error loading topics:", error);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignTopic = async (councilId: string, topicId: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.COUNCILS, councilId), {
        topic_code: topicId,
        updated_at: new Date(),
        updated_by: profile?.id
      });

      alert("Đã gán đề tài vào hội đồng thành công!");
      setShowAssignTopic(null);
      loadCouncils();
    } catch (error) {
      console.error("Error assigning topic:", error);
      alert("Có lỗi khi gán đề tài");
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
    showAssignTopic,
    setShowAssignTopic,
    availableTopics,
    assignLoading,
    canAssignTopic,
    canGrade,
    formatTimestamp,
    handleShowAssignTopic,
    handleAssignTopic,
    handleGradeSubmit,
    loadCouncils,
  };
}
