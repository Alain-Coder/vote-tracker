"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Edit } from "lucide-react"
import { getCenter, getCandidates, getVotes, addVote, updateVote } from "@/lib/firebase-service"
import { calculateCenterTotals } from "@/lib/aggregation"
import { CandidateBadge } from "@/components/candidate-badge"
import { VoteSummaryCard } from "@/components/vote-summary-card"
import type { Center, Candidate, Vote, VoteAggregation } from "@/lib/types"

export default function CenterPage() {
  const params = useParams()
  const router = useRouter()
  const centerId = params.centerId as string

  const [center, setCenter] = useState<Center | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [existingVote, setExistingVote] = useState<Vote | null>(null)
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [totals, setTotals] = useState<VoteAggregation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    loadData()
  }, [centerId])

  const loadData = async () => {
    try {
      const [centerData, candidatesData, votesData] = await Promise.all([
        getCenter(centerId),
        getCandidates(),
        getVotes(centerId),
      ])

      setCenter(centerData)
      setCandidates(candidatesData)

      // Check if votes already exist for this center
      const existingVoteData = votesData[0] || null
      setExistingVote(existingVoteData)

      // Initialize vote counts
      const initialCounts: Record<string, number> = {}
      candidatesData.forEach((candidate) => {
        initialCounts[candidate.id] = existingVoteData?.counts[candidate.id] || 0
      })
      setVoteCounts(initialCounts)

      // Calculate totals
      const totalsData = await calculateCenterTotals(centerId)
      setTotals(totalsData)

      // Set edit mode if no votes exist yet
      setEditMode(!existingVoteData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVoteCountChange = (candidateId: string, count: number) => {
    setVoteCounts((prev) => ({
      ...prev,
      [candidateId]: Math.max(0, count),
    }))
  }

  const handleSaveVotes = async () => {
    if (!center) return

    setSaving(true)
    try {
      if (existingVote) {
        // Update existing vote
        await updateVote(existingVote.id, { counts: voteCounts })
      } else {
        // Create new vote
        await addVote({
          centerId,
          counts: voteCounts,
          submittedAt: new Date(),
        })
      }

      // Reload data to get updated totals
      await loadData()
      setEditMode(false)
    } catch (error) {
      console.error("Error saving votes:", error)
    } finally {
      setSaving(false)
    }
  }

  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0)

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!center) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Center not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">{center.name}</h1>
            <p className="text-muted-foreground">
              Center {center.centerNumber} • {center.registeredVoters} registered voters
            </p>
          </div>

          {!editMode && existingVote && (
            <Button onClick={() => setEditMode(true)} variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Votes
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <VoteSummaryCard title="Center Summary" totalVotes={totalVotes} registeredVoters={center.registeredVoters} />

          {editMode ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Enter Votes
                  <Button onClick={handleSaveVotes} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Votes"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: "#3b82f6" }}
                    >
                      {candidate.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{candidate.name}</div>
                      <div className="text-sm text-muted-foreground">{candidate.party}</div>
                    </div>
                    <div className="w-24">
                      <Label htmlFor={`votes-${candidate.id}`} className="sr-only">
                        Votes for {candidate.name}
                      </Label>
                      <Input
                        id={`votes-${candidate.id}`}
                        type="number"
                        min="0"
                        value={voteCounts[candidate.id] || 0}
                        onChange={(e) => handleVoteCountChange(candidate.id, Number.parseInt(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Votes:</span>
                    <span>{totalVotes.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Vote Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {totals.map((result) => (
                  <CandidateBadge
                    key={result.candidateId}
                    candidate={result.candidate as Candidate}
                    votes={result.totalVotes}
                    percentage={result.percentage}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {totals.map((result, index) => (
                  <div key={result.candidateId} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{result.candidate.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.totalVotes.toLocaleString()} votes ({result.percentage.toFixed(1)}%)
                      </div>
                    </div>
                    <div className="w-3 h-8 rounded" style={{ backgroundColor: "#3b82f6" }} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {existingVote && (
            <Card>
              <CardHeader>
                <CardTitle>Vote Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{existingVote.submittedAt.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vote ID:</span>
                    <span className="font-mono text-xs">{existingVote.id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}