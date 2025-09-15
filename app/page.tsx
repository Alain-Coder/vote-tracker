"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, MapPin, Building, Vote, Trophy, Users, BarChart3, PieChartIcon } from "lucide-react"
import { getDistricts, getWards, getCenters, getVotes, getCandidates } from "@/lib/firebase-service"
import { calculateDistrictTotals, calculateWardVoteTotals } from "@/lib/aggregation"
import { VoteSummaryCard } from "@/components/vote-summary-card"
// Add chart components
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import type { District, Ward, Center, VoteAggregation, Candidate } from "@/lib/types"

// Define chart colors using direct HSL values - improved color scheme
const CHART_COLORS = [
  "hsl(25, 80%, 60%)",  // Red (primary)
  "hsl(120, 60%, 50%)", // Green
  "hsl(300, 70%, 70%)", // Purple
  "hsl(240, 50%, 80%)", // Light blue
  "hsl(70, 70%, 60%)",  // Orange
]

export default function Dashboard() {
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [totals, setTotals] = useState<VoteAggregation[]>([])
  const [wardTotals, setWardTotals] = useState<VoteAggregation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [districtsData, wardsData, centersData, votes, candidatesData] = await Promise.all([
        getDistricts(),
        getWards(),
        getCenters(),
        getVotes(),
        getCandidates(),
      ])

      setDistricts(districtsData)
      setWards(wardsData)
      setCenters(centersData)
      setCandidates(candidatesData)

      // Calculate district totals (by candidate)
      const totalsData = await calculateDistrictTotals()
      setTotals(totalsData)
      
      // Calculate ward totals (by ward)
      const wardTotalsData = await calculateWardVoteTotals()
      setWardTotals(wardTotalsData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalRegisteredVoters = centers.reduce((sum, center) => sum + center.registeredVoters, 0)
  const totalVotes = totals.reduce((sum, result) => sum + result.totalVotes, 0)

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId)
  const selectedCandidateData = totals.find(t => t.candidateId === selectedCandidateId)

  // Prepare data for candidate charts
  const candidateChartData = totals.map((result, index) => {
    // Type guard to check if candidate is a Candidate (has party property)
    const isCandidate = (candidate: Candidate | Ward): candidate is Candidate => {
      return 'party' in candidate;
    };
    
    return {
      name: result.candidate.name,
      party: isCandidate(result.candidate) ? result.candidate.party : '',
      votes: result.totalVotes,
      percentage: result.percentage,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    };
  })
  
  // Prepare data for ward charts
  const wardChartData = wardTotals.map((result, index) => ({
    name: result.candidate.name,
    votes: result.totalVotes,
    percentage: result.percentage,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }))

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-balance">Nkhotakota Central</h1>
          <p className="text-xl text-muted-foreground">Vote Tracker Dashboard</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Admin Panel
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Vote className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalVotes.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Votes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalRegisteredVoters.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Registered Voters</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Building className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{centers.length}</div>
                <div className="text-sm text-muted-foreground">Voting Centers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {totalRegisteredVoters > 0 ? ((totalVotes / totalRegisteredVoters) * 100).toFixed(1) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Turnout</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Candidate Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                votes: {
                  label: "Votes",
                  color: "hsl(25, 80%, 60%)",
                },
              }}
              className="h-[300px]"
            >
              <BarChart data={candidateChartData}>
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
                  {candidateChartData.map((entry, index) => (
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

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Ward Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={Object.fromEntries(
                wardChartData.map((item, index) => [
                  `item-${index}`,
                  {
                    label: `${item.name}: ${item.votes.toLocaleString()} votes (${item.percentage.toFixed(1)}%)`,
                    color: CHART_COLORS[index % CHART_COLORS.length],
                  },
                ])
              )}
              className="h-[300px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={wardChartData}
                  dataKey="votes"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  {wardChartData.map((entry, index) => (
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
        {/* Leaderboard */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Trophy className="w-6 h-6 text-yellow-500" />
                District Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {totals.length > 0 ? (
                totals.map((result, index) => (
                  <div key={result.candidateId} className="relative">
                    {index === 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-50">Leading</Badge>
                    )}
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                        {index + 1}
                      </div>
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: "#3b82f6" }}
                      >
                        {result.candidate.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div className="flex-1">
                        <div className="text-xl font-bold">{result.candidate.name}</div>
                        {/* Type guard to safely access party property */}
                        {'party' in result.candidate && (
                          <div className="text-muted-foreground">{(result.candidate as Candidate).party}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{result.totalVotes.toLocaleString()}</div>
                        <div className="text-muted-foreground">{result.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No votes recorded yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Navigation and Candidate Selection */}
        <div className="space-y-6">
          {/* Candidate Selection for Detailed View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                View Candidate Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Candidate</label>
                <Select value={selectedCandidateId} onValueChange={setSelectedCandidateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a candidate to view details" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.name} ({candidate.party})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCandidateId && selectedCandidate && selectedCandidateData && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3">{selectedCandidate.name} - District Overview</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="text-center">
                      <CardContent className="p-3">
                        <div className="text-2xl font-bold text-primary">{selectedCandidateData.totalVotes.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Total Votes</div>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="p-3">
                        <div className="text-2xl font-bold text-primary">{selectedCandidateData.percentage.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Vote Share</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-4">
                    <Link href={`/candidates/${selectedCandidateId}`}>
                      <Button className="w-full" variant="outline">
                        View Detailed Performance
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {!selectedCandidateId && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Select a candidate to view detailed information
                </div>
              )}
            </CardContent>
          </Card>

          {/* Browse by Ward */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Browse by Ward
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {wards.map((ward) => (
                <Link key={ward.id} href={`/wards/${ward.id}`}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Building className="w-4 h-4 mr-2" />
                    {ward.name}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}