"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./auth-context";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getUserProfile } from "../firebase/auth";

interface Semester {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}

interface SemesterContextType {
  semesters: Semester[];
  currentSemester: Semester | null;
  setCurrentSemester: (semester: Semester) => void;
  isLoading: boolean;
}

const SemesterContext = createContext<SemesterContextType | undefined>(
  undefined
);

export function SemesterProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, updateProfileSemester } = useAuth();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [currentSemester, setCurrentSemester] = useState<Semester | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserSemesters() {
      if (!user) {
        setSemesters([]);
        setCurrentSemester(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        if (!profile) {
          setSemesters([]);
          setCurrentSemester(null);
          setIsLoading(false);
          return;
        }

        const isRole = profile.role;
        let userSemesterIds: string[] = [];

        if (isRole === "teacher") {
          // Fetch all teacher documents with this user's email to get all semester_codes
          const teachersRef = collection(db, "teachers");
          const q = query(teachersRef, where("email", "==", profile.email));
          const snapshot = await getDocs(q);

          userSemesterIds = snapshot.docs.map(
            (doc) => doc.data().semester_code
          );
        } else if (isRole === "student") {
          // Fetch all student documents with this user's email to get all semester_codes
          const studentsRef = collection(db, "students");
          const q = query(studentsRef, where("email", "==", profile.email));
          const snapshot = await getDocs(q);

          userSemesterIds = snapshot.docs.map(
            (doc) => doc.data().semester_code
          );
        }

        // Remove duplicates
        userSemesterIds = Array.from(new Set(userSemesterIds));

        // Fetch all semester documents
        const semestersRef = collection(db, "semesters");
        const semestersSnapshot = await getDocs(semestersRef);

        const allSemesters: Semester[] = semestersSnapshot.docs
          .filter((doc) => userSemesterIds.includes(doc.id))
          .map((doc) => ({
            id: doc.id,
            title: doc.data().title,
            created_at: doc.data().created_at?.toDate(),
            updated_at: doc.data().updated_at?.toDate(),
          }));

        setSemesters(allSemesters);

        // Load saved semester from localStorage or use profile's semester or first semester
        const savedSemesterId = localStorage.getItem("currentSemesterId");
        const savedSemester = allSemesters.find(
          (s) => s.id === savedSemesterId
        );
        const profileSemester = allSemesters.find(
          (s) => s.id === profile?.semester_code?.toString()
        );

        if (savedSemester) {
          console.log(0)
          setCurrentSemester(savedSemester);
        } else if (profileSemester) {
          console.log(1)
          setCurrentSemester(profileSemester);
          localStorage.setItem("currentSemesterId", profileSemester.id);
        } else if (allSemesters.length > 0) {
          console.log(2)
          setCurrentSemester(allSemesters[0]);
          localStorage.setItem("currentSemesterId", allSemesters[0].id);
        }
      } catch (error) {
        console.error("Error fetching user semesters:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserSemesters();
  }, [user, profile]);

  const handleSetCurrentSemester = async (semester: Semester) => {
    setCurrentSemester(semester);
    localStorage.setItem("currentSemesterId", semester.id);
    // Fetch profile document for this semester (each student has different ID per semester)
    await updateProfileSemester(semester.id);
  };

  return (
    <SemesterContext.Provider
      value={{
        semesters,
        currentSemester,
        setCurrentSemester: handleSetCurrentSemester,
        isLoading,
      }}
    >
      {children}
    </SemesterContext.Provider>
  );
}

export function useSemester() {
  const context = useContext(SemesterContext);
  if (context === undefined) {
    throw new Error("useSemester must be used within a SemesterProvider");
  }
  return context;
}
