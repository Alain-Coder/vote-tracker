const { initializeApp } = require("firebase/app")
const { getFirestore, collection, addDoc } = require("firebase/firestore")

// Firebase configuration - replace with your own
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// District data
const districts = [
  {
    id: "nkhotakota-central",
    name: "Nkhotakota Central",
  },
]

// Ward data
const wards = [
  {
    id: "ward-1",
    districtId: "nkhotakota-central",
    name: "Ward 1 - Mwansambo",
  },
]

// Center data
const centers = [
  {
    id: "center-123",
    wardId: "ward-1",
    centerNumber: "C-123",
    name: "Mwansambo Primary School",
    registeredVoters: 420,
  },
]

// Candidate data
const candidates = [
  {
    id: "penyani-jamane",
    name: "Penyani Jamane",
    party: "Independent",
  },
  {
    id: "candidate-b",
    name: "Candidate B",
    party: "MCP",
  },
  {
    id: "candidate-c",
    name: "Candidate C",
    party: "DPP",
  },
  {
    id: "candidate-d",
    name: "Candidate D",
    party: "UTM",
  },
]

async function seedData() {
  try {
    // Add districts
    for (const district of districts) {
      await addDoc(collection(db, "districts"), district)
      console.log(`Added district: ${district.name}`)
    }

    // Add wards
    for (const ward of wards) {
      await addDoc(collection(db, "wards"), ward)
      console.log(`Added ward: ${ward.name}`)
    }

    // Add centers
    for (const center of centers) {
      await addDoc(collection(db, "centers"), center)
      console.log(`Added center: ${center.name}`)
    }

    // Add candidates
    for (const candidate of candidates) {
      await addDoc(collection(db, "candidates"), candidate)
      console.log(`Added candidate: ${candidate.name}`)
    }

    console.log("Data seeding completed!")
  } catch (error) {
    console.error("Error seeding data:", error)
  }
}

seedData()