import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type QueryConstraint,
  writeBatch,
  runTransaction,
  arrayUnion,
  arrayRemove,
  increment,
  type DocumentSnapshot,
} from "firebase/firestore"
import { db } from "./config"
import { COLLECTIONS } from "./firestore"

// Batch operations
export class BatchOperations {
  private batch = writeBatch(db)
  private operationCount = 0
  private maxBatchSize = 500

  async create(collectionName: string, id: string, data: any) {
    if (this.operationCount >= this.maxBatchSize) {
      await this.commit()
    }
    const docRef = doc(db, collectionName, id)
    this.batch.set(docRef, data)
    this.operationCount++
    return this
  }

  async update(collectionName: string, id: string, data: any) {
    if (this.operationCount >= this.maxBatchSize) {
      await this.commit()
    }
    const docRef = doc(db, collectionName, id)
    this.batch.update(docRef, data)
    this.operationCount++
    return this
  }

  async delete(collectionName: string, id: string) {
    if (this.operationCount >= this.maxBatchSize) {
      await this.commit()
    }
    const docRef = doc(db, collectionName, id)
    this.batch.delete(docRef)
    this.operationCount++
    return this
  }

  async commit() {
    if (this.operationCount === 0) return
    await this.batch.commit()
    this.batch = writeBatch(db)
    this.operationCount = 0
  }
}

// Transaction operations
export async function runDocumentTransaction<T>(
  collectionName: string,
  id: string,
  updateFn: (data: any) => any
): Promise<T> {
  return runTransaction(db, async (transaction) => {
    const docRef = doc(db, collectionName, id)
    const docSnap = await transaction.get(docRef)

    if (!docSnap.exists()) {
      throw new Error("Document does not exist!")
    }

    const currentData = docSnap.data()
    const newData = updateFn(currentData)

    transaction.update(docRef, newData)
    return { id: docSnap.id, ...newData } as T
  })
}

// Pagination helper
export interface PaginationResult<T> {
  data: T[]
  lastDoc: DocumentSnapshot | null
  hasMore: boolean
}

export async function getPaginatedDocuments<T>(
  collectionName: string,
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot,
  constraints: QueryConstraint[] = []
): Promise<PaginationResult<T>> {
  const collectionRef = collection(db, collectionName)
  const queryConstraints = [...constraints, limit(pageSize + 1)]

  if (lastDoc) {
    queryConstraints.push(startAfter(lastDoc))
  }

  const q = query(collectionRef, ...queryConstraints)
  const snapshot = await getDocs(q)

  const hasMore = snapshot.docs.length > pageSize
  const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs

  return {
    data: docs.map((doc) => ({ id: doc.id, ...doc.data() } as T)),
    lastDoc: docs[docs.length - 1] || null,
    hasMore,
  }
}

// Array operations
export async function addToArray(
  collectionName: string,
  id: string,
  field: string,
  value: any
): Promise<void> {
  const docRef = doc(db, collectionName, id)
  await updateDoc(docRef, {
    [field]: arrayUnion(value),
  })
}

export async function removeFromArray(
  collectionName: string,
  id: string,
  field: string,
  value: any
): Promise<void> {
  const docRef = doc(db, collectionName, id)
  await updateDoc(docRef, {
    [field]: arrayRemove(value),
  })
}

// Increment/Decrement operations
export async function incrementField(
  collectionName: string,
  id: string,
  field: string,
  value: number = 1
): Promise<void> {
  const docRef = doc(db, collectionName, id)
  await updateDoc(docRef, {
    [field]: increment(value),
  })
}

// Upsert operation (update or insert)
export async function upsertDocument(
  collectionName: string,
  id: string,
  data: any,
  userId?: string
): Promise<void> {
  const docRef = doc(db, collectionName, id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    await updateDoc(docRef, {
      ...data,
      updated_at: new Date(),
      ...(userId && { updated_by: userId }),
    })
  } else {
    await setDoc(docRef, {
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
      ...(userId && { created_by: userId, updated_by: userId }),
    })
  }
}

// Bulk operations
export async function bulkCreate(
  collectionName: string,
  documents: Array<{ id?: string; data: any }>,
  userId?: string
): Promise<string[]> {
  const batchOps = new BatchOperations()
  const ids: string[] = []

  for (const doc of documents) {
    const id = doc.id || crypto.randomUUID()
    ids.push(id)
    await batchOps.create(collectionName, id, {
      ...doc.data,
      created_at: new Date(),
      updated_at: new Date(),
      ...(userId && { created_by: userId, updated_by: userId }),
    })
  }

  await batchOps.commit()
  return ids
}

export async function bulkUpdate(
  collectionName: string,
  updates: Array<{ id: string; data: any }>,
  userId?: string
): Promise<void> {
  const batchOps = new BatchOperations()

  for (const update of updates) {
    await batchOps.update(collectionName, update.id, {
      ...update.data,
      updated_at: new Date(),
      ...(userId && { updated_by: userId }),
    })
  }

  await batchOps.commit()
}

export async function bulkDelete(
  collectionName: string,
  ids: string[]
): Promise<void> {
  const batchOps = new BatchOperations()

  for (const id of ids) {
    await batchOps.delete(collectionName, id)
  }

  await batchOps.commit()
}

// Advanced query helpers
export async function countDocuments(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<number> {
  const collectionRef = collection(db, collectionName)
  const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef
  const snapshot = await getDocs(q)
  return snapshot.size
}

export async function documentExists(
  collectionName: string,
  id: string
): Promise<boolean> {
  const docRef = doc(db, collectionName, id)
  const docSnap = await getDoc(docRef)
  return docSnap.exists()
}

// Search operations
export async function searchDocuments<T>(
  collectionName: string,
  field: string,
  searchTerm: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  // Firestore doesn't support full-text search, so we use startAt/endAt for prefix matching
  const collectionRef = collection(db, collectionName)
  const q = query(
    collectionRef,
    where(field, ">=", searchTerm),
    where(field, "<=", searchTerm + "\uf8ff"),
    ...constraints
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T))
}

// Specific collection helpers based on your schema
export const advancedTopicService = {
  // Get topics with enrollment information
  getTopicsWithEnrollments: async (semester_code: string) => {
    const topics = await getDocs(
      query(
        collection(db, COLLECTIONS.TOPICS),
        where("semester_code", "==", semester_code)
      )
    )

    const topicsWithEnrollments = await Promise.all(
      topics.docs.map(async (topicDoc) => {
        const topicData = topicDoc.data()
        let enrollmentData = null

        if (topicData.enrollment_code) {
          const enrollmentDoc = await getDoc(
            doc(db, COLLECTIONS.ENROLLMENTS, topicData.enrollment_code)
          )
          if (enrollmentDoc.exists()) {
            enrollmentData = { id: enrollmentDoc.id, ...enrollmentDoc.data() }
          }
        }

        return {
          id: topicDoc.id,
          ...topicData,
          enrollment: enrollmentData,
        }
      })
    )

    return topicsWithEnrollments
  },

  // Get available topics (not enrolled yet)
  getAvailableTopics: async (semester_code: string, majorCode?: string) => {
    const constraints: QueryConstraint[] = [
      where("semester_code", "==", semester_code),
      where("status", "==", "approved"),
      where("enrollment_code", "==", null),
    ]

    if (majorCode) {
      constraints.push(where("major_code", "==", majorCode))
    }

    const snapshot = await getDocs(query(collection(db, COLLECTIONS.TOPICS), ...constraints))
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },
}

export const advancedStudentService = {
  // Get student with all related information
  getStudentFullProfile: async (studentId: string) => {
    const studentDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, studentId))
    if (!studentDoc.exists()) return null

    const studentData = studentDoc.data()

    // Get enrollments
    const enrollments = await getDocs(
      query(
        collection(db, COLLECTIONS.ENROLLMENTS),
        where("student_code", "==", studentId)
      )
    )

    // Get major and semester info
    const [majorDoc, semesterDoc] = await Promise.all([
      studentData.major_code ? getDoc(doc(db, COLLECTIONS.MAJORS, studentData.major_code)) : null,
      studentData.semester_code ? getDoc(doc(db, COLLECTIONS.SEMESTERS, studentData.semester_code)) : null,
    ])

    return {
      id: studentDoc.id,
      ...studentData,
      major: majorDoc?.exists() ? { id: majorDoc.id, ...majorDoc.data() } : null,
      semester: semesterDoc?.exists() ? { id: semesterDoc.id, ...semesterDoc.data() } : null,
      enrollments: enrollments.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    }
  },

  // Get students by class
  getStudentsByClass: async (classCode: string, semester_code: string) => {
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.STUDENTS),
        where("class_code", "==", classCode),
        where("semester_code", "==", semester_code)
      )
    )
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },
}

export const advancedTeacherService = {
  // Get teacher with roles
  getTeacherWithRoles: async (teacherId: string) => {
    const teacherDoc = await getDoc(doc(db, COLLECTIONS.TEACHERS, teacherId))
    if (!teacherDoc.exists()) return null

    const roles = await getDocs(
      query(
        collection(db, COLLECTIONS.ROLE_SYSTEMS),
        where("teacher_code", "==", teacherId)
      )
    )

    return {
      id: teacherDoc.id,
      ...teacherDoc.data(),
      roles: roles.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    }
  },

  // Get teachers by role
  getTeachersByRole: async (role: string, semester_code: string) => {
    const roleSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.ROLE_SYSTEMS),
        where("role", "==", role),
        where("semester_code", "==", semester_code),
        where("activate", "==", true)
      )
    )

    const teacherIds = roleSnapshot.docs.map((doc) => doc.data().teacher_code)
    const uniqueTeacherIds = Array.from(new Set(teacherIds));

    const teachers = await Promise.all(
      uniqueTeacherIds.map(async (id) => {
        const teacherDoc = await getDoc(doc(db, COLLECTIONS.TEACHERS, id))
        return teacherDoc.exists() ? { id: teacherDoc.id, ...teacherDoc.data() } : null
      })
    )

    return teachers.filter((t) => t !== null)
  },
}

export const advancedCouncilService = {
  // Get council with full details
  getCouncilFullDetails: async (councilId: string) => {
    const councilDoc = await getDoc(doc(db, COLLECTIONS.COUNCILS, councilId))
    if (!councilDoc.exists()) return null

    const councilData = councilDoc.data()

    // Get defences (council members)
    const defences = await getDocs(
      query(
        collection(db, COLLECTIONS.DEFENCES),
        where("council_code", "==", councilId)
      )
    )

    // Get teacher details for each defence
    const defencesWithTeachers = await Promise.all(
      defences.docs.map(async (defenceDoc) => {
        const defenceData = defenceDoc.data()
        const teacherDoc = await getDoc(doc(db, COLLECTIONS.TEACHERS, defenceData.teacher_code))
        return {
          id: defenceDoc.id,
          ...defenceData,
          teacher: teacherDoc.exists() ? { id: teacherDoc.id, ...teacherDoc.data() } : null,
        }
      })
    )

    // Get topic details
    let topicData = null
    if (councilData.topic_code) {
      const topicDoc = await getDoc(doc(db, COLLECTIONS.TOPICS, councilData.topic_code))
      if (topicDoc.exists()) {
        topicData = { id: topicDoc.id, ...topicDoc.data() }
      }
    }

    return {
      id: councilDoc.id,
      ...councilData,
      defences: defencesWithTeachers,
      topic: topicData,
    }
  },
}

// Export all helpers
export {
  query,
  where,
  orderBy,
  limit,
  startAfter,
}
