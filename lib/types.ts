export interface District {
  id: string
  name: string
}

export interface Ward {
  id: string
  districtId: string
  name: string
}

export interface Center {
  id: string
  wardId: string
  centerNumber: string
  name: string
  registeredVoters: number
}

export interface Candidate {
  id: string
  name: string
  party: string
}

export interface Vote {
  id: string
  centerId: string
  counts: Record<string, number>
  submittedAt: Date
}

export interface VoteAggregation {
  candidateId: string
  candidate: Candidate | Ward
  totalVotes: number
  percentage: number
}