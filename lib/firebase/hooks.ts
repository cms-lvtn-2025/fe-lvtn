"use client"

import { useEffect, useState } from "react"
import { collection, onSnapshot, query, type QueryConstraint } from "firebase/firestore"
import { db } from "./config"

// Generic hook for real-time data
export function useCollection<T>(collectionName: string, constraints: QueryConstraint[] = []) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const collectionRef = collection(db, collectionName)
    const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[]
        setData(items)
        setLoading(false)
      },
      (err) => {
        console.error(`Error listening to ${collectionName}:`, err)
        setError(err as Error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [collectionName, constraints])

  return { data, loading, error }
}

// Hook for single document
export function useDocument<T>(collectionName: string, id: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const docRef = collection(db, collectionName)
    const q = query(docRef)

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const doc = snapshot.docs.find((d) => d.id === id)
        if (doc) {
          setData({ id: doc.id, ...doc.data() } as T)
        } else {
          setData(null)
        }
        setLoading(false)
      },
      (err) => {
        console.error(`Error listening to document ${id}:`, err)
        setError(err as Error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [collectionName, id])

  return { data, loading, error }
}
