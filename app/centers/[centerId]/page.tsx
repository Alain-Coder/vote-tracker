"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getCenter, getCandidates, getVotes } from "@/lib/firebase-service"
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
  const [totals, setTotals] = useState<VoteAggregation[]>([])
  const [loading, setLoading] = useState(true)

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

      // Calculate totals
      const totalsData = await calculateCenterTotals(centerId)
      setTotals(totalsData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalVotes = totals.reduce((sum, result) => sum + result.totalVotes, 0)

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

        <div>
          <h1 className="text-3xl font-bold text-balance">{center.name}</h1>
          <p className="text-muted-foreground">
            Center {center.centerNumber} • {center.registeredVoters} registered voters
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <VoteSummaryCard title="Center Summary" totalVotes={totalVotes} registeredVoters={center.registeredVoters} />

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