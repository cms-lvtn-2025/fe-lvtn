"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "firebase/auth"
import { onAuthChange, getUserProfile, type UserProfile } from "@/lib/firebase/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  updateProfileSemester: (semester_code: string) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  updateProfileSemester: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user)

      if (user) {
        // Try to get profile from both collections
        let userProfile = await getUserProfile(user.uid, "teacher")
        if (!userProfile) {
          userProfile = await getUserProfile(user.uid, "student")
        }
        setProfile(userProfile)
      } else {
        setProfile(null)
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
      } else {
        // No profile found for this semester, keep current profile but update semester_code
        setProfile({
          ...profile,
          semester_code: semester_code,
        } as any)
      }
    } catch (error) {
      console.error("Error fetching profile for semester:", error)
    } finally {
      setLoading(false)
    }
  }

  return <AuthContext.Provider value={{ user, profile, loading, updateProfileSemester }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
