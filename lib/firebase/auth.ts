import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth"
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore"
import { auth, db } from "./config"

export type UserRole = "teacher" | "student"

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  username: string
  gender: string
  major_code: string
  semester_code: string
  classCode: number
}

export async function signIn(email: string, password: string, role: UserRole) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Verify user role from Firestore
    const userDoc = await getDoc(doc(db, role === "teacher" ? "teachers" : "students", user.uid))


    

    if (!userDoc.exists()) {
      await firebaseSignOut(auth)
      throw new Error(`Tài khoản không tồn tại trong hệ thống ${role === "teacher" ? "giáo viên" : "sinh viên"}`)
    }
    console.log("cccc", user)
    return {
      user,
      profile: { id: user.uid, ...userDoc.data(), role: role } as UserProfile,
    }
  } catch (error: any) {
    throw new Error(error.message || "Đăng nhập thất bại")
  }
}

export async function signOut() {
  await firebaseSignOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

// export async function getUserProfile(userId: string, role: UserRole): Promise<UserProfile | null> {
//   try {
//     const userDoc = await getDoc(doc(db, role === "teacher" ? "teachers" : "students", userId))
//     if (userDoc.exists()) {
//       return { id: userId, role, ...userDoc.data() } as UserProfile
//     }
//     return null
//   } catch (error) {
//     console.error("Error fetching user profile:", error)
//     return null
//   }
// }

export async function getUserProfile(userId: string, role: UserRole): Promise<UserProfile | null> {
  try {
    const collectionName = role === "teacher" ? "teachers" : "students"
    const userDoc = await getDoc(doc(db, collectionName, userId))

    if (userDoc.exists()) {
      return { id: userId, role, ...userDoc.data() } as UserProfile
    }

    return null
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

// Check if user has access to a specific semester
export async function checkUserSemesterAccess(userId: string, role: UserRole, semester_code: string): Promise<boolean> {
  try {
    const collectionName = role === "teacher" ? "teachers" : "students"
    const q = query(
      collection(db, collectionName),
      where("__name__", "==", userId),
      where("semester_code", "==", semester_code)
    )
    const snapshot = await getDocs(q)
    return !snapshot.empty
  } catch (error) {
    console.error("Error checking semester access:", error)
    return false
  }
}

export async function signInWithGoogle(role: UserRole) {
  try {
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)
    const user = userCredential.user

    // Check if user exists in the correct role collection
    const collectionName = role === "teacher" ? "teachers" : "students"
    const userDoc = await getDoc(doc(db, collectionName, user.uid))

    if (!userDoc.exists()) {
      // Create new user profile if doesn't exist
      const newProfile: Partial<UserProfile> = {
        email: user.email || "",
        role: role,
        username: user.displayName || user.email?.split("@")[0] || "",
      }

      await setDoc(doc(db, collectionName, user.uid), newProfile)

      return {
        user,
        profile: { id: user.uid, ...newProfile } as UserProfile,
      }
    }

    return {
      user,
      profile: { id: user.uid, ...userDoc.data() } as UserProfile,
    }
  } catch (error: any) {
    throw new Error(error.message || "Đăng nhập Google thất bại")
  }
}
