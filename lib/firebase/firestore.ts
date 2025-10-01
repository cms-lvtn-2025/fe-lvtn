import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  type QueryConstraint,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "./config"
import type {
  Semester,
  Student,
  Teacher,
  Faculty,
  Major,
  RoleSystem,
  File,
  Midterm,
  Enrollment,
  Topic,
  Council,
  Defence,
  Final,
  CreateSemesterInput,
  CreateStudentInput,
  CreateTeacherInput,
  CreateFacultyInput,
  CreateMajorInput,
  CreateRoleSystemInput,
  CreateFileInput,
  CreateMidtermInput,
  CreateEnrollmentInput,
  CreateTopicInput,
  CreateCouncilInput,
  CreateDefenceInput,
  CreateFinalInput,
  UpdateSemesterInput,
  UpdateStudentInput,
  UpdateTeacherInput,
  UpdateFacultyInput,
  UpdateMajorInput,
  UpdateRoleSystemInput,
  UpdateFileInput,
  UpdateMidtermInput,
  UpdateEnrollmentInput,
  UpdateTopicInput,
  UpdateCouncilInput,
  UpdateDefenceInput,
  UpdateFinalInput,
} from "@/types/database"

// Collection names
export const COLLECTIONS = {
  SEMESTERS: "semesters",
  STUDENTS: "students",
  TEACHERS: "teachers",
  FACULTIES: "faculties",
  MAJORS: "majors",
  ROLE_SYSTEMS: "rolesystems",
  FILES: "files",
  MIDTERMS: "midterms",
  ENROLLMENTS: "enrollments",
  TOPICS: "topics",
  COUNCILS: "councils",
  DEFENCES: "defences",
  FINALS: "finals",
} as const

// Helper function to convert Firestore timestamps to Date
function convertTimestamps<T>(data: any): T {
  const converted = { ...data }
  Object.keys(converted).forEach((key) => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate()
    }
  })
  return converted as T
}

// Generic CRUD operations
export async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return convertTimestamps<T>({ id: docSnap.id, ...docSnap.data() })
    }
    return null
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error)
    throw error
  }
}

export async function getDocuments<T>(collectionName: string, constraints: QueryConstraint[] = []): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName)
    const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => convertTimestamps<T>({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error)
    throw error
  }
}

export async function createDocument<T>(collectionName: string, data: any, userId?: string): Promise<string> {
  try {
    const collectionRef = collection(db, collectionName)
    const docData = {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      ...(userId && { created_by: userId, updated_by: userId }),
    }

    const docRef = await addDoc(collectionRef, docData)
    return docRef.id
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error)
    throw error
  }
}

export async function updateDocument(collectionName: string, id: string, data: any, userId?: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id)
    const updateData = {
      ...data,
      updated_at: serverTimestamp(),
      ...(userId && { updated_by: userId }),
    }

    await updateDoc(docRef, updateData)
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error)
    throw error
  }
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error)
    throw error
  }
}

// Semesters
export const semesterService = {
  getAll: () => getDocuments<Semester>(COLLECTIONS.SEMESTERS),
  getById: (id: string) => getDocument<Semester>(COLLECTIONS.SEMESTERS, id),
  create: (data: CreateSemesterInput, userId?: string) => createDocument(COLLECTIONS.SEMESTERS, data, userId),
  update: (id: string, data: UpdateSemesterInput, userId?: string) =>
    updateDocument(COLLECTIONS.SEMESTERS, id, data, userId),
  delete: (id: string) => deleteDocument(COLLECTIONS.SEMESTERS, id),
}

// Students
export const studentService = {
  getAll: () => getDocuments<Student>(COLLECTIONS.STUDENTS),
  getById: (id: string) => getDocument<Student>(COLLECTIONS.STUDENTS, id),
  getByEmail: async (email: string) => {
    const students = await getDocuments<Student>(COLLECTIONS.STUDENTS, [where("email", "==", email), limit(1)])
    return students[0] || null
  },
  getByMajor: (majorCode: string) =>
    getDocuments<Student>(COLLECTIONS.STUDENTS, [where("major_code", "==", majorCode)]),
  getBySemester: (semesterCode: string) =>
    getDocuments<Student>(COLLECTIONS.STUDENTS, [where("semester_code", "==", semesterCode)]),
  create: (data: CreateStudentInput, userId?: string) => createDocument(COLLECTIONS.STUDENTS, data, userId),
  update: (id: string, data: UpdateStudentInput, userId?: string) =>
    updateDocument(COLLECTIONS.STUDENTS, id, data, userId),
  delete: (id: string) => deleteDocument(COLLECTIONS.STUDENTS, id),
}

// Teachers
export const teacherService = {
  getAll: () => getDocuments<Teacher>(COLLECTIONS.TEACHERS),
  getById: (id: string) => getDocument<Teacher>(COLLECTIONS.TEACHERS, id),
  getByEmail: async (email: string) => {
    const teachers = await getDocuments<Teacher>(COLLECTIONS.TEACHERS, [where("email", "==", email), limit(1)])
    return teachers[0] || null
  },
  getByMajor: (majorCode: string) =>
    getDocuments<Teacher>(COLLECTIONS.TEACHERS, [where("major_code", "==", majorCode)]),
  getBySemester: (semesterCode: string) =>
    getDocuments<Teacher>(COLLECTIONS.TEACHERS, [where("semester_code", "==", semesterCode)]),
  create: (data: CreateTeacherInput, userId?: string) => createDocument(COLLECTIONS.TEACHERS, data, userId),
  update: (id: string, data: UpdateTeacherInput, userId?: string) =>
    updateDocument(COLLECTIONS.TEACHERS, id, data, userId),
  delete: (id: string) => deleteDocument(COLLECTIONS.TEACHERS, id),
}

// Faculties
export const facultyService = {
  getAll: () => getDocuments<Faculty>(COLLECTIONS.FACULTIES),
  getById: (id: string) => getDocument<Faculty>(COLLECTIONS.FACULTIES, id),
  create: (data: CreateFacultyInput, userId?: string) => createDocument(COLLECTIONS.FACULTIES, data, userId),
  update: (id: string, data: UpdateFacultyInput, userId?: string) =>
    updateDocument(COLLECTIONS.FACULTIES, id, data, userId),
  delete: (id: string) => deleteDocument(COLLECTIONS.FACULTIES, id),
}

// Majors
export const majorService = {
  getAll: () => getDocuments<Major>(COLLECTIONS.MAJORS),
  getById: (id: string) => getDocument<Major>(COLLECTIONS.MAJORS, id),
  getByFaculty: (facultyCode: string) =>
    getDocuments<Major>(COLLECTIONS.MAJORS, [where("faculty_code", "==", facultyCode)]),
  create: (data: CreateMajorInput, userId?: string) => createDocument(COLLECTIONS.MAJORS, data, userId),
  update: (id: string, data: UpdateMajorInput, userId?: string) => updateDocument(COLLECTIONS.MAJORS, id, data, userId),
  delete: (id: string) => deleteDocument(COLLECTIONS.MAJORS, id),
}

// Role Systems
export const roleSystemService = {
  getAll: () => getDocuments<RoleSystem>(COLLECTIONS.ROLE_SYSTEMS),
  getById: (id: string) => getDocument<RoleSystem>(COLLECTIONS.ROLE_SYSTEMS, id),
  getByTeacher: (teacherCode: string) =>
    getDocuments<RoleSystem>(COLLECTIONS.ROLE_SYSTEMS, [where("teacher_code", "==", teacherCode)]),
  getBySemester: (semesterCode: string) =>
    getDocuments<RoleSystem>(COLLECTIONS.ROLE_SYSTEMS, [where("semester_code", "==", semesterCode)]),
  getActiveByTeacher: (teacherCode: string) =>
    getDocuments<RoleSystem>(COLLECTIONS.ROLE_SYSTEMS, [
      where("teacher_code", "==", teacherCode),
      where("activate", "==", true),
    ]),
  create: (data: CreateRoleSystemInput, userId?: string) => createDocument(COLLECTIONS.ROLE_SYSTEMS, data, userId),
  update: (id: string, data: UpdateRoleSystemInput, userId?: string) =>
    updateDocument(COLLECTIONS.ROLE_SYSTEMS, id, data, userId),
  delete: (id: string) => deleteDocument(COLLECTIONS.ROLE_SYSTEMS, id),
}

// Files
export const fileService = {
  getAll: () => getDocuments<File>(COLLECTIONS.FILES),
  getById: (id: string) => getDocument<File>(COLLECTIONS.FILES, id),
  getByStatus: (status: string) => getDocuments<File>(COLLECTIONS.FILES, [where("status", "==", status)]),
  create: (data: CreateFileInput, userId?: string) => createDocument(COLLECTIONS.FILES, data, userId),
  update: (id: string, data: UpdateFileInput, userId?: string) => updateDocument(COLLECTIONS.FILES, id, data, userId),
  delete: (id: string) => deleteDocument(COLLECTIONS.FILES, id),
}

// Midterms
export const midtermService = {
  getAll: () => getDocuments<Midterm>(COLLECTIONS.MIDTERMS),
  getById: (id: string) => getDocument<Midterm>(COLLECTIONS.MIDTERMS, id),
  getByStatus: (status: string) => getDocuments<Midterm>(COLLECTIONS.MIDTERMS, [where("status", "==", status)]),
  create: (data: CreateMidtermInput, userId?: string) => createDocument(COLLECTIONS.MIDTERMS, data, userId),
  update: (id: string, data: UpdateMidtermInput, userId?: string) =>
    updateDocument(COLLECTIONS.MIDTERMS, id, data, userId),
  delete: (id: string) => deleteDocument(COLLECTIONS.MIDTERMS, id),
}

// Enrollments
export const enrollmentService = {
  getAll: () => getDocuments<Enrollment>(COLLECTIONS.ENROLLMENTS),
  getById: (id: string) => getDocument<Enrollment>(COLLECTIONS.ENROLLMENTS, id),
  getByStudent: (studentCode: string) =>
    getDocuments<Enrollment>(COLLECTIONS.ENROLLMENTS, [where("student_code", "==", studentCode)]),
  create: (data: CreateEnrollmentInput, userId?: string) => createDocument(COLLECTIONS.ENROLLMENTS, data, userId),
  update: (id: string, data: UpdateEnrollmentInput, userId?: string) =>
    updateDocument(COLLECTIONS.ENROLLMENTS, id, data, userId),
  delete: (id: string) => deleteDocument(COLLECTIONS.ENROLLMENTS, id),
}

// Topics
export const topicService = {
  getAll: () => getDocuments<Topic>(COLLECTIONS.TOPICS),
  getById: (id: string) => getDocument<Topic>(COLLECTIONS.TOPICS, id),
  getByMajor: (majorCode: string) => getDocuments<Topic>(COLLECTIONS.TOPICS, [where("major_code", "==", majorCode)]),
  getBySemester: (semesterCode: string) =>
    getDocuments<Topic>(COLLECTIONS.TOPICS, [where("semester_code", "==", semesterCode)]),
  getBySupervisor: (teacherCode: string) =>
    getDocuments<Topic>(COLLECTIONS.TOPICS, [where("teacher_supervisor_code", "==", teacherCode)]),
  getByStatus: (status: string) => getDocuments<Topic>(COLLECTIONS.TOPICS, [where("status", "==", status)]),
  create: (data: CreateTopicInput, userId?: string) => createDocument(COLLECTIONS.TOPICS, data, userId),
  update: (id: string, data: UpdateTopicInput, userId?: string) => updateDocument(COLLECTIONS.TOPICS, id, data, userId),
  delete: (id: string) => deleteDocument(COLLECTIONS.TOPICS, id),
}

// Councils
export const councilService = {
  getAll: () => getDocuments<Council>(COLLECTIONS.COUNCILS),
  getById: (id: string) => getDocument<Council>(COLLECTIONS.COUNCILS, id),
  getByMajor: (majorCode: string) =>
    getDocuments<Council>(COLLECTIONS.COUNCILS, [where("major_code", "==", majorCode)]),
  getByTopic: (topicCode: string) =>
    getDocuments<Council>(COLLECTIONS.COUNCILS, [where("topic_code", "==", topicCode)]),
  create: (data: CreateCouncilInput, userId?: string) => createDocument(COLLECTIONS.COUNCILS, data, userId),
  update: (id: string, data: UpdateCouncilInput, userId?: string) =>
    updateDocument(COLLECTIONS.COUNCILS, id, data, userId),
  delete: (id: string) => deleteDocument(COLLECTIONS.COUNCILS, id),
}

// Defences
export const defenceService = {
  getAll: () => getDocuments<Defence>(COLLECTIONS.DEFENCES),
  getById: (id: string) => getDocument<Defence>(COLLECTIONS.DEFENCES, id),
  getByCouncil: (councilCode: string) =>
    getDocuments<Defence>(COLLECTIONS.DEFENCES, [where("council_code", "==", councilCode)]),
  getByTeacher: (teacherCode: string) =>
    getDocuments<Defence>(COLLECTIONS.DEFENCES, [where("teacher_code", "==", teacherCode)]),
  create: (data: CreateDefenceInput) => createDocument(COLLECTIONS.DEFENCES, data),
  update: (id: string, data: UpdateDefenceInput) => updateDocument(COLLECTIONS.DEFENCES, id, data),
  delete: (id: string) => deleteDocument(COLLECTIONS.DEFENCES, id),
}

// Finals
export const finalService = {
  getAll: () => getDocuments<Final>(COLLECTIONS.FINALS),
  getById: (id: string) => getDocument<Final>(COLLECTIONS.FINALS, id),
  getByStatus: (status: string) => getDocuments<Final>(COLLECTIONS.FINALS, [where("status", "==", status)]),
  create: (data: CreateFinalInput, userId?: string) => createDocument(COLLECTIONS.FINALS, data, userId),
  update: (id: string, data: UpdateFinalInput, userId?: string) => updateDocument(COLLECTIONS.FINALS, id, data, userId),
  delete: (id: string) => deleteDocument(COLLECTIONS.FINALS, id),
}

// Export query helpers for custom queries
export { query, where, orderBy, limit }
