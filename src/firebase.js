import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBZIyvMGVs2Up9n_p30PFcz3KhzO-B_BI",
  authDomain: "term-ya-icu-b.firebaseapp.com",
  projectId: "term-ya-icu-b",
  storageBucket: "term-ya-icu-b.firebasestorage.app",
  messagingSenderId: "425604483080",
  appId: "1:425604483080:web:647f8f206d7cdc71dc69bd",
  measurementId: "G-3Q10VSGMC1"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export default app
