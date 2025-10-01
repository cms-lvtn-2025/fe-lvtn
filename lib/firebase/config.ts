import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyDqdenwOQWuIHkehz_Ua8_mHk1lkEKvVww",
  authDomain: "education-99cbf.firebaseapp.com",
  projectId: "education-99cbf",
  storageBucket: "education-99cbf.firebasestorage.app",
  messagingSenderId: "277079491748",
  appId: "1:277079491748:web:540c5488c3393b722b5231",
  measurementId: "G-F5SMLFS9TS",
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

export { app, auth, db, storage }
