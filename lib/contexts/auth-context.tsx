"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "firebase/auth"
import { onAuthChange, getUserProfile, type UserProfile, getUserProfileByEmailAndSemester } from "@/lib/firebase/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { useSemester } from "./semester-context"

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  updateProfileSemester: (semester_code: string) => void
  userRoles: string[]
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  updateProfileSemester: () => {},
  userRoles: [],
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRoles, setUserRoles] = useState<string[]>([])
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user)
      console.log(user)
      const semester = localStorage.getItem("currentSemesterId")
      if (user && user.email && semester) {
        // Try to get profile from both collections
        let userProfile = await getUserProfileByEmailAndSemester(user.email, semester, "teacher")
        if (!userProfile) {
          userProfile = await getUserProfile(user.uid, "student")
        }
        setProfile(userProfile)

        // Fetch roles from rolesystems
        if (userProfile) {
          const rolesQuery = query(
            collection(db, "rolesystems"),
            where("teacher_code", "==", userProfile.id),
            where("semester_code", "==", userProfile.semester_code),
            where("activate", "==", true)
          )
          const rolesSnapshot = await getDocs(rolesQuery)
          const roles = rolesSnapshot.docs.map(doc => doc.data().role)
          setUserRoles(roles)
        }
      } else {
        setProfile(null)
        setUserRoles([])
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const updateProfileSemester = async (semester_code: string) => {
    if (!profile || !user) return

    setLoading(true)
    try {
      // Fetch student/teacher document for this semester
      // Since each student has multiple documents (one per semester) with different IDs
      // We need to query by email and semester_code
      const collectionName = profile.role === "teacher" ? "teachers" : "students"
      const collectionRef = collection(db, collectionName)
      const q = query(
        collectionRef,
        where("email", "==", profile.email),
        where("semester_code", "==", semester_code)
      )

      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const newProfileDoc = snapshot.docs[0]
        const newProfile = {
          id: newProfileDoc.id,
          role: profile.role,
          ...newProfileDoc.data()
        } as any

        setProfile(newProfile)

        // Fetch roles for new semester
        const rolesQuery = query(
          collection(db, "rolesystems"),
          where("teacher_code", "==", newProfile.id),
          where("semester_code", "==", semester_code),
          where("activate", "==", true)
        )
        const rolesSnapshot = await getDocs(rolesQuery)
        const roles = rolesSnapshot.docs.map(doc => doc.data().role)
        setUserRoles(roles)
      } else {
        // No profile found for this semester, keep current profile but update semester_code
        setProfile({
          ...profile,
          semester_code: semester_code,
        } as any)
        setUserRoles([])
      }
    } catch (error) {
      console.error("Error fetching profile for semester:", error)
    } finally {
      setLoading(false)
    }
  }

  return <AuthContext.Provider value={{ user, profile, loading, updateProfileSemester, userRoles }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
