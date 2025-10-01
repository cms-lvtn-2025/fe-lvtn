import { useEffect, useState } from "react"
import { useSemester } from "@/lib/contexts/semester-context"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, QueryConstraint } from "firebase/firestore"

export function useSemesterData<T>(collectionName: string, additionalFilters?: QueryConstraint[]) {
  const { currentSemester } = useSemester()
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!currentSemester) {
        setData([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const collectionRef = collection(db, collectionName)
        const constraints: QueryConstraint[] = [where("semester_code", "==", currentSemester.id)]

        if (additionalFilters) {
          constraints.push(...additionalFilters)
        }

        const q = query(collectionRef, ...constraints)
        const snapshot = await getDocs(q)

        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[]

        setData(results)
      } catch (err) {
        console.error(`Error fetching ${collectionName}:`, err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentSemester, collectionName, additionalFilters])

  return { data, isLoading, error, refetch: () => {} }
}

// Hook specifically for students
export function useStudents() {
  return useSemesterData<any>("students")
}

// Hook specifically for teachers
export function useTeachers() {
  return useSemesterData<any>("teachers")
}

// Hook specifically for topics
export function useTopics(additionalFilters?: QueryConstraint[]) {
  return useSemesterData<any>("topics", additionalFilters)
}

// Hook specifically for enrollments
export function useEnrollments(additionalFilters?: QueryConstraint[]) {
  return useSemesterData<any>("enrollments", additionalFilters)
}

// Hook for user-specific data
export function useUserSemesterData<T>(
  collectionName: string,
  userField: string,
  userId: string | undefined,
) {
  const { currentSemester } = useSemester()
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!currentSemester || !userId) {
        setData([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const collectionRef = collection(db, collectionName)
        const q = query(collectionRef, where("semester_code", "==", currentSemester.id), where(userField, "==", userId))

        const snapshot = await getDocs(q)

        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[]

        setData(results)
      } catch (err) {
        console.error(`Error fetching ${collectionName} for user:`, err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentSemester, collectionName, userField, userId])

  return { data, isLoading, error }
}
