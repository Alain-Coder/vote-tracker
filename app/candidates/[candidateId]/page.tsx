"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Vote, MapPin, Users, Building, BarChart3, PieChartIcon } from "lucide-react"
import { getWards, getCenters, getVotes, getCandidates } from "@/lib/firebase-service"
import { calculateCandidateTotals } from "@/lib/aggregation"
import { CandidateBadge } from "@/components/candidate-badge"
// Add chart components
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import type { Ward, Center, VoteAggregation, Candidate } from "@/lib/types"

// Define chart colors using direct HSL values - improved color scheme
const CHART_COLORS = [
  "hsl(25, 80%, 60%)",  // Red (primary)
  "hsl(120, 60%, 50%)", // Green
  "hsl(300, 70%, 70%)", // Purple
  "hsl(240, 50%, 80%)", // Light blue
  "hsl(70, 70%, 60%)",  // Orange
]

export default function CandidatePage() {
  const params = useParams()
  const router = useRouter()
  const candidateId = params.candidateId as string

  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [wards, setWards] = useState<Ward[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [wardTotals, setWardTotals] = useState<VoteAggregation[]>([])
  const [centerTotals, setCenterTotals] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [candidateId])

  const loadData = async () => {
    try {
      const [wardsData, centersData, votesData, candidatesData] = await Promise.all([
        getWards(), 
        getCenters(), 
        getVotes(),
        getCandidates()
      ])

      const candidateData = candidatesData.find((c) => c.id === candidateId)
      setCandidate(candidateData || null)
      setWards(wardsData)
      setCenters(centersData)

      // Calculate candidate totals across all wards
      if (candidateData) {
        const totalsData = await calculateCandidateTotals(candidateId)
        setWardTotals(totalsData)
        
        // Calculate votes per center for this candidate
        const centerVotes: Record<string, number> = {}
        votesData.forEach(vote => {
          const center = centersData.find(c => c.id === vote.centerId)
          if (center && vote.counts[candidateId]) {
            centerVotes[center.id] = (centerVotes[center.id] || 0) + vote.counts[candidateId]
          }
        })
        setCenterTotals(centerVotes)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Prepare data for charts with improved color assignment
  const chartData = wardTotals.map((wardTotal, index) => ({
    name: wardTotal.candidate.name,
    votes: wardTotal.totalVotes,
    percentage: wardTotal.percentage,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }))

  // Prepare data for center distribution chart
  const centerChartData = centers
    .map((center, index) => {
      const votes = centerTotals[center.id] || 0
      return {
        name: center.name.length > 15 ? `${center.name.substring(0, 15)}...` : center.name,
        votes,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }
    })
    .sort((a, b) => b.votes - a.votes) // Sort by votes
    .slice(0, 10) // Show top 10 centers

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Candidate not found</div>
      </div>
    )
  }

  const totalVotes = wardTotals.reduce((sum, wardTotal) => sum + wardTotal.totalVotes, 0)
  const totalRegisteredVoters = centers.reduce((sum, center) => sum + center.registeredVoters, 0)

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg"
            style={{ backgroundColor: "#3b82f6" }}
          >
            {candidate.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-balance">{candidate.name}</h1>
            <p className="text-muted-foreground">{candidate.party}</p>
          </div>
        </div>

        {/* Candidate Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Vote className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-xl font-bold">{totalVotes.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Votes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-xl font-bold">{totalRegisteredVoters.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Registered Voters</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-xl font-bold">
                    {totalRegisteredVoters > 0 ? ((totalVotes / totalRegisteredVoters) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Turnout</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Votes by Ward
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                votes: {
                  label: "Votes",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 10) + (value.length > 10 ? "..." : "")}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="votes" 
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CHART_COLORS[index % CHART_COLORS.length]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Center Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Center Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={Object.fromEntries(
                centerChartData.map((item, index) => [
                  `item-${index}`,
                  {
                    label: `${item.name} (${item.votes} votes)`,
                    color: CHART_COLORS[index % CHART_COLORS.length],
                  },
                ])
              )}
              className="h-[300px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={centerChartData}
                  dataKey="votes"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  {centerChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CHART_COLORS[index % CHART_COLORS.length]} 
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Ward Performance */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Ward Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {wardTotals.length > 0 ? (
                wardTotals.map((wardTotal, index) => {
                  const ward = wards.find(w => w.id === wardTotal.candidate.id)
                  if (!ward) return null
                  
                  const wardCenters = centers.filter(c => c.wardId === ward.id)
                  const wardRegisteredVoters = wardCenters.reduce((sum, center) => sum + center.registeredVoters, 0)
                  const wardTurnout = wardRegisteredVoters > 0 ? ((wardTotal.totalVotes / wardRegisteredVoters) * 100) : 0
                  
                  return (
                    <div key={ward.id} className="relative">
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold">{ward.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {wardCenters.length} centers • {wardRegisteredVoters.toLocaleString()} registered voters
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{wardTotal.totalVotes.toLocaleString()} votes</div>
                          <div className="text-sm text-muted-foreground">
                            {wardTotal.percentage.toFixed(1)}% share • {wardTurnout.toFixed(1)}% turnout
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">No ward data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Centers */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Top Performing Centers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {centers
                  .map((center, index) => {
                    const votes = centerTotals[center.id] || 0
                    return { center, votes, index }
                  })
                  .sort((a, b) => b.votes - a.votes)
                  .slice(0, 3) // Show only top 3 centers
                  .map(({ center, votes, index }) => (
                    <div key={center.id} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{center.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {votes.toLocaleString()} votes
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}