import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore"

// Initialize Firebase (you'll need to set these environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function testFirestore() {
  console.log("Testing Firestore connection...")
  
  try {
    // Test reading from a collection
    const snapshot = await getDocs(collection(db, "districts"))
    console.log(`Found ${snapshot.size} districts`)
    
    // Test writing to a collection
    const testDoc = await addDoc(collection(db, "test"), {
      message: "Firestore is working!",
      timestamp: new Date()
    })
    console.log("Test document added with ID:", testDoc.id)
    
    console.log("Firestore test completed successfully!")
  } catch (error) {
    console.error("Firestore test failed:", error)
  }
}

testFirestore()