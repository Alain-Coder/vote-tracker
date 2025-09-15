"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Vote, MapPin, Users, BarChart3, PieChartIcon, Search } from "lucide-react"
import { getWards, getCenters, getVotes, getCandidates } from "@/lib/firebase-service"
import { calculateWardTotals } from "@/lib/aggregation"
import { CandidateBadge } from "@/components/candidate-badge"
import { VoteSummaryCard } from "@/components/vote-summary-card"
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

export default function WardPage() {
  const params = useParams()
  const router = useRouter()
  const wardId = params.wardId as string

  const [ward, setWard] = useState<Ward | null>(null)
  const [centers, setCenters] = useState<Center[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [totals, setTotals] = useState<VoteAggregation[]>([])
  const [centerVotes, setCenterVotes] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const centersPerPage = 10

  useEffect(() => {
    loadData()
  }, [wardId])

  const loadData = async () => {
    try {
      const [wardsData, centersData, votesData, candidatesData] = await Promise.all([
        getWards(), 
        getCenters(), // Get all centers first
        getVotes(), 
        getCandidates()
      ])

      const wardData = wardsData.find((w) => w.id === wardId)
      setWard(wardData || null)
      
      // Filter centers by wardId
      const wardCenters = centersData.filter(center => center.wardId === wardId)
      setCenters(wardCenters)
      setCandidates(candidatesData)

      // Calculate ward totals
      const totalsData = await calculateWardTotals(wardId)
      setTotals(totalsData)

      // Calculate votes per center
      const centerIds = new Set(wardCenters.map((c) => c.id))
      const wardVotesData = votesData.filter((vote) => centerIds.has(vote.centerId))

      const centerVoteCounts: Record<string, number> = {}
      wardCenters.forEach((center) => {
        const centerVote = wardVotesData.find((vote) => vote.centerId === center.id)
        centerVoteCounts[center.id] = centerVote
          ? Object.values(centerVote.counts).reduce((sum, count) => sum + count, 0)
          : 0
      })
      setCenterVotes(centerVoteCounts)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId)
  const selectedCandidateData = totals.find(t => t.candidateId === selectedCandidateId)

  // Prepare data for charts with improved color assignment
  const chartData = totals.map((result, index) => {
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

  // Prepare data for center distribution chart (based on votes)
  const centerChartData = centers.map((center, index) => {
    const totalVotesInCenter = centerVotes[center.id] || 0
    const turnoutPercentage = center.registeredVoters > 0 
      ? (totalVotesInCenter / center.registeredVoters) * 100 
      : 0
    
    return {
      name: center.name.length > 15 ? `${center.name.substring(0, 15)}...` : center.name,
      centerNumber: center.centerNumber,
      votes: totalVotesInCenter,
      registeredVoters: center.registeredVoters,
      turnout: turnoutPercentage,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }
  }).sort((a, b) => b.votes - a.votes) // Sort by votes

  // Filter centers based on search term
  const filteredCenters = centers.filter(center => 
    center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.centerNumber.includes(searchTerm)
  )

  // Pagination
  const totalPages = Math.ceil(filteredCenters.length / centersPerPage)
  const indexOfLastCenter = currentPage * centersPerPage
  const indexOfFirstCenter = indexOfLastCenter - centersPerPage
  const currentCenters = filteredCenters.slice(indexOfFirstCenter, indexOfLastCenter)

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!ward) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Ward not found</div>
      </div>
    )
  }

  const totalRegisteredVoters = centers.reduce((sum, center) => sum + center.registeredVoters, 0)
  const totalVotes = totals.reduce((sum, result) => sum + result.totalVotes, 0)

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-balance">{ward.name}</h1>
            <p className="text-muted-foreground">{centers.length} voting centers</p>
          </div>
        </div>

        {/* Ward Stats */}
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
                  <div className="text-sm text-muted-foreground">Turnout</div>
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
              Votes by Candidate
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

        {/* Center Turnout Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Votes by Center
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={Object.fromEntries(
                centerChartData.slice(0, 5).map((item, index) => [
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
                  data={centerChartData.slice(0, 5)}
                  dataKey="votes"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  {centerChartData.slice(0, 5).map((entry, index) => (
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
        {/* Ward Results */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Ward Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {totals.length > 0 ? (
                totals.map((result, index) => (
                  <div key={result.candidateId} className="relative">
                    {index === 0 && result.totalVotes > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-green-500 text-green-50">Leading</Badge>
                    )}
                    {/* Type guard to ensure we're passing a Candidate to CandidateBadge */}
                    {'party' in result.candidate && (
                      <CandidateBadge
                        candidate={result.candidate as Candidate}
                        votes={result.totalVotes}
                        percentage={result.percentage}
                      />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No votes recorded yet</div>
              )}
            </CardContent>
          </Card>

          {/* Centers List with Search and Pagination */}
          <Card>
            <CardHeader>
              <CardTitle>Voting Centers</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search centers..."
                    className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1) // Reset to first page when searching
                    }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentCenters.length > 0 ? (
                <>
                  {currentCenters.map((center) => (
                    <Link key={center.id} href={`/centers/${center.id}`}>
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded">
                            <Vote className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold">{center.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {center.centerNumber} • {center.registeredVoters} registered voters
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{centerVotes[center.id]?.toLocaleString() || 0} votes</div>
                          <div className="text-sm text-muted-foreground">
                            {center.registeredVoters > 0
                              ? (((centerVotes[center.id] || 0) / center.registeredVoters) * 100).toFixed(1)
                              : 0}
                            % turnout
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No centers found matching your search" : "No voting centers found"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Candidate Selection */}
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
                  <h3 className="font-semibold mb-3">{selectedCandidate.name} - Ward Performance</h3>
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

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Centers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {centers
                  .sort((a, b) => (centerVotes[b.id] || 0) - (centerVotes[a.id] || 0))
                  .slice(0, 5)
                  .map((center, index) => (
                    <div key={center.id} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{center.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {centerVotes[center.id]?.toLocaleString() || 0} votes
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