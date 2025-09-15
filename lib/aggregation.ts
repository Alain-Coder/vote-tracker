import { getCandidates, getVotes, getCenters, getWards } from "./firebase-service"
import type { VoteAggregation, Ward } from "./types"

export const calculateDistrictTotals = async (): Promise<VoteAggregation[]> => {
  const [candidates, votes] = await Promise.all([getCandidates(), getVotes()])

  const totals: Record<string, number> = {}
  let totalVotes = 0

  // Aggregate all votes
  votes.forEach((vote) => {
    Object.entries(vote.counts).forEach(([candidateId, count]) => {
      totals[candidateId] = (totals[candidateId] || 0) + count
      totalVotes += count
    })
  })

  // Create aggregation with candidate details
  return candidates
    .map((candidate) => ({
      candidateId: candidate.id,
      candidate,
      totalVotes: totals[candidate.id] || 0,
      percentage: totalVotes > 0 ? ((totals[candidate.id] || 0) / totalVotes) * 100 : 0,
    }))
    .sort((a, b) => b.totalVotes - a.totalVotes)
}

export const calculateWardTotals = async (wardId: string): Promise<VoteAggregation[]> => {
  const [candidates, allCenters, votes] = await Promise.all([getCandidates(), getCenters(), getVotes()])

  const wardCenters = allCenters.filter(c => c.wardId === wardId)
  
  const centerIds = new Set(wardCenters.map((c) => c.id))
  const wardVotes = votes.filter((vote) => centerIds.has(vote.centerId))

  const totals: Record<string, number> = {}
  let totalVotes = 0

  wardVotes.forEach((vote) => {
    Object.entries(vote.counts).forEach(([candidateId, count]) => {
      totals[candidateId] = (totals[candidateId] || 0) + count
      totalVotes += count
    })
  })

  return candidates
    .map((candidate) => ({
      candidateId: candidate.id,
      candidate,
      totalVotes: totals[candidate.id] || 0,
      percentage: totalVotes > 0 ? ((totals[candidate.id] || 0) / totalVotes) * 100 : 0,
    }))
    .sort((a, b) => b.totalVotes - a.totalVotes)
}

export const calculateCenterTotals = async (centerId: string): Promise<VoteAggregation[]> => {
  const [candidates, votes] = await Promise.all([getCandidates(), getVotes(centerId)])

  const centerVote = votes[0] // Should only be one vote record per center
  const totals = centerVote?.counts || {}
  const totalVotes = Object.values(totals).reduce((sum, count) => sum + count, 0)

  return candidates
    .map((candidate) => ({
      candidateId: candidate.id,
      candidate,
      totalVotes: totals[candidate.id] || 0,
      percentage: totalVotes > 0 ? ((totals[candidate.id] || 0) / totalVotes) * 100 : 0,
    }))
    .sort((a, b) => b.totalVotes - a.totalVotes)
}

export const calculateCandidateTotals = async (candidateId: string): Promise<VoteAggregation[]> => {
  const [wards, centers, votes, candidates] = await Promise.all([
    getWards(),
    getCenters(),
    getVotes(),
    getCandidates()
  ])

  const candidate = candidates.find(c => c.id === candidateId)
  if (!candidate) {
    return []
  }

  // Calculate totals per ward for this candidate
  const wardTotals: Record<string, number> = {}
  let totalVotes = 0

  // Initialize all wards with 0 votes
  wards.forEach(ward => {
    wardTotals[ward.id] = 0
  })

  // Sum votes for this candidate by ward
  votes.forEach(vote => {
    const center = centers.find(c => c.id === vote.centerId)
    if (center && vote.counts[candidateId]) {
      const wardId = center.wardId
      wardTotals[wardId] = (wardTotals[wardId] || 0) + vote.counts[candidateId]
      totalVotes += vote.counts[candidateId]
    }
  })

  // Create aggregation with ward details
  return wards
    .map((ward) => ({
      candidateId: ward.id,
      candidate: ward,
      totalVotes: wardTotals[ward.id] || 0,
      percentage: totalVotes > 0 ? ((wardTotals[ward.id] || 0) / totalVotes) * 100 : 0,
    }))
    .sort((a, b) => b.totalVotes - a.totalVotes)
}

export const calculateWardVoteTotals = async (): Promise<VoteAggregation[]> => {
  const [wards, centers, votes] = await Promise.all([
    getWards(),
    getCenters(),
    getVotes()
  ])

  // Calculate total votes per ward
  const wardTotals: Record<string, number> = {}
  let totalVotes = 0

  // Initialize all wards with 0 votes
  wards.forEach(ward => {
    wardTotals[ward.id] = 0
  })

  // Sum all votes by ward
  votes.forEach(vote => {
    const center = centers.find(c => c.id === vote.centerId)
    if (center) {
      const wardId = center.wardId
      const voteCount = Object.values(vote.counts).reduce((sum, count) => sum + count, 0)
      wardTotals[wardId] = (wardTotals[wardId] || 0) + voteCount
      totalVotes += voteCount
    }
  })

  // Create aggregation with ward details
  return wards
    .map((ward) => ({
      candidateId: ward.id,
      candidate: ward,
      totalVotes: wardTotals[ward.id] || 0,
      percentage: totalVotes > 0 ? ((wardTotals[ward.id] || 0) / totalVotes) * 100 : 0,
    }))
    .sort((a, b) => b.totalVotes - a.totalVotes)
}