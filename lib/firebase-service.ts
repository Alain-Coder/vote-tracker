import { collection, doc, getDocs, getDoc, addDoc, updateDoc, query, where, CollectionReference, Query } from "firebase/firestore"
import { db } from "./firebase"
import type { District, Ward, Center, Candidate, Vote } from "./types"

// Districts
export const getDistricts = async (): Promise<District[]> => {
  const snapshot = await getDocs(collection(db, "districts"))
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as District)
}

export const addDistrict = async (district: Omit<District, "id">): Promise<string> => {
  const docRef = await addDoc(collection(db, "districts"), district)
  return docRef.id
}

// Wards
export const getWards = async (districtId?: string): Promise<Ward[]> => {
  let q: CollectionReference | Query = collection(db, "wards")
  if (districtId) {
    q = query(collection(db, "wards"), where("districtId", "==", districtId))
  }
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Ward)
}

export const addWard = async (ward: Omit<Ward, "id">): Promise<string> => {
  const docRef = await addDoc(collection(db, "wards"), ward)
  return docRef.id
}

// Centers
export const getCenters = async (wardId?: string): Promise<Center[]> => {
  let q: CollectionReference | Query = collection(db, "centers")
  if (wardId) {
    q = query(collection(db, "centers"), where("wardId", "==", wardId))
  }
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Center)
}

export const getCenter = async (centerId: string): Promise<Center | null> => {
  const docRef = doc(db, "centers", centerId)
  const snapshot = await getDoc(docRef)
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Center) : null
}

export const addCenter = async (center: Omit<Center, "id">): Promise<string> => {
  const docRef = await addDoc(collection(db, "centers"), center)
  return docRef.id
}

// Candidates
export const getCandidates = async (): Promise<Candidate[]> => {
  const snapshot = await getDocs(collection(db, "candidates"))
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Candidate)
}

export const addCandidate = async (candidate: Omit<Candidate, "id">): Promise<string> => {
  const docRef = await addDoc(collection(db, "candidates"), candidate)
  return docRef.id
}

// Votes
export const getVotes = async (centerId?: string): Promise<Vote[]> => {
  let q: CollectionReference | Query = collection(db, "votes")
  if (centerId) {
    q = query(collection(db, "votes"), where("centerId", "==", centerId))
  }
  const snapshot = await getDocs(q)
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate() || new Date(),
      }) as Vote,
  )
}

export const addVote = async (vote: Omit<Vote, "id">): Promise<string> => {
  const docRef = await addDoc(collection(db, "votes"), {
    ...vote,
    submittedAt: new Date(),
  })
  return docRef.id
}

export const updateVote = async (voteId: string, vote: Partial<Vote>): Promise<void> => {
  const docRef = doc(db, "votes", voteId)
  await updateDoc(docRef, vote)
}