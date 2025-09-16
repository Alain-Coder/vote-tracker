"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Users, MapPin, Building, Vote, BarChart, Search, TrendingUp, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import {
  getDistricts,
  getWards,
  getCenters,
  getCandidates,
  addDistrict,
  addWard,
  addCenter,
  addCandidate,
  getVotes,
  addVote,
  updateVote
} from "@/lib/firebase-service"
import { useAuth } from "@/contexts/auth-context"
import type { District, Ward, Center, Candidate, Vote as VoteType } from "@/lib/types"

export default function AdminClient() {
  const { logout } = useAuth()
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [newDistrict, setNewDistrict] = useState({ name: "" })
  const [newWard, setNewWard] = useState({ name: "", districtId: "" })
  const [newCenter, setNewCenter] = useState({
    name: "",
    centerNumber: "",
    wardId: "",
    registeredVoters: 0,
  })
  const [newCandidate, setNewCandidate] = useState({
    name: "",
    party: "",
  })

  // Vote entry states
  const [selectedWardId, setSelectedWardId] = useState("")
  const [selectedCenterId, setSelectedCenterId] = useState("")
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [voteErrors, setVoteErrors] = useState<Record<string, string>>({})
  const [existingVote, setExistingVote] = useState<VoteType | null>(null)
  const [saving, setSaving] = useState(false)

  // Ward browsing states
  const [selectedCandidateId, setSelectedCandidateId] = useState("")
  const [wardVotes, setWardVotes] = useState<Record<string, number>>({})

  // Search and filter states
  const [centerSearch, setCenterSearch] = useState("")
  const [wardSearch, setWardSearch] = useState("")
  const [centersPerPage, setCentersPerPage] = useState(10)
  const [wardsPerPage, setWardsPerPage] = useState(10)
  const [centerPage, setCenterPage] = useState(1)
  const [wardPage, setWardPage] = useState(1)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [districtsData, wardsData, centersData, candidatesData] = await Promise.all([
        getDistricts(),
        getWards(),
        getCenters(),
        getCandidates(),
      ]) 
      setDistricts(districtsData)
      setWards(wardsData)
      setCenters(centersData)
      setCandidates(candidatesData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Error", {
        description: "Error loading data. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveVotes = async () => {
    if (!selectedCenterId) return

    // Validate that total votes don't exceed registered voters
    const selectedCenter = centers.find(c => c.id === selectedCenterId)
    if (!selectedCenter) return

    const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0)
    
    if (totalVotes > selectedCenter.registeredVoters) {
      // Set error for the vote entry as a whole
      toast.error("Vote Entry Error", {
        description: `Total votes (${totalVotes}) cannot exceed registered voters (${selectedCenter.registeredVoters}) for this center.`,
      })
      return
    }

    // Check for individual candidate errors
    const hasErrors = Object.keys(voteErrors).length > 0
    if (hasErrors) {
      toast.error("Vote Entry Error", {
        description: "Please fix the vote entry errors before saving.",
      })
      return
    }

    setSaving(true)
    try {
      if (existingVote) {
        // Update existing vote
        await updateVote(existingVote.id, { counts: voteCounts })
      } else {
        // Create new vote
        await addVote({
          centerId: selectedCenterId,
          counts: voteCounts,
          submittedAt: new Date(),
        })
      }

      // Reload data to get updated vote data
      await loadVoteData(selectedCenterId)
      
      // Show success message
      toast.success("Votes Saved", {
        description: "Votes have been successfully saved.",
      })
    } catch (error) {
      console.error("Error saving votes:", error)
      toast.error("Error", {
        description: "Error saving votes. Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddDistrict = async () => {
    if (!newDistrict.name) {
      toast.error("Validation Error", {
        description: "Please enter a district name.",
      })
      return
    }
    try {
      await addDistrict(newDistrict)
      setNewDistrict({ name: "" })
      loadData()
      toast.success("District Added", {
        description: "District has been successfully added.",
      })
    } catch (error) {
      console.error("Error adding district:", error)
      toast.error("Error", {
        description: "Error adding district. Please try again.",
      })
    }
  }

  const handleAddWard = async () => {
    if (!newWard.name || !newWard.districtId) {
      toast.error("Validation Error", {
        description: "Please enter a ward name and select a district.",
      })
      return
    }
    try {
      await addWard(newWard)
      setNewWard({ name: "", districtId: "" })
      loadData()
      toast.success("Ward Added", {
        description: "Ward has been successfully added.",
      })
    } catch (error) {
      console.error("Error adding ward:", error)
      toast.error("Error", {
        description: "Error adding ward. Please try again.",
      })
    }
  }

  const handleAddCenter = async () => {
    if (!newCenter.name || !newCenter.centerNumber || !newCenter.wardId) {
      toast.error("Validation Error", {
        description: "Please enter center name, center number, and select a ward.",
      })
      return
    }
    try {
      await addCenter(newCenter)
      setNewCenter({ name: "", centerNumber: "", wardId: "", registeredVoters: 0 })
      loadData()
      toast.success("Center Added", {
        description: "Center has been successfully added.",
      })
    } catch (error) {
      console.error("Error adding center:", error)
      toast.error("Error", {
        description: "Error adding center. Please try again.",
      })
    }
  }

  const handleAddCandidate = async () => {
    if (!newCandidate.name || !newCandidate.party) {
      toast.error("Validation Error", {
        description: "Please enter candidate name and party.",
      })
      return
    }
    try {
      await addCandidate(newCandidate)
      setNewCandidate({ name: "", party: "" })
      loadData()
      toast.success("Candidate Added", {
        description: "Candidate has been successfully added.",
      })
    } catch (error) {
      console.error("Error adding candidate:", error)
      toast.error("Error", {
        description: "Error adding candidate. Please try again.",
      })
    }
  }

  // Handle vote count change with validation to ensure votes don't exceed registered voters
  const handleVoteCountChange = (candidateId: string, value: string) => {
    // Allow only numeric values or empty string
    if (value === "" || /^\d+$/.test(value)) {
      const numValue = value === "" ? 0 : Number.parseInt(value, 10)
      
      // Get the selected center
      const selectedCenter = centers.find(c => c.id === selectedCenterId)
      
      // Validate that votes don't exceed registered voters
      if (selectedCenter && numValue > selectedCenter.registeredVoters) {
        setVoteErrors(prev => ({
          ...prev,
          [candidateId]: `Votes cannot exceed registered voters (${selectedCenter.registeredVoters})`
        }))
      } else {
        // Clear error if validation passes
        setVoteErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[candidateId]
          return newErrors
        })
      }
      
      setVoteCounts((prev) => ({
        ...prev,
        [candidateId]: numValue,
      }))
    }
  }

  // Handle registered voters change with validation to allow only numbers
  const handleRegisteredVotersChange = (value: string) => {
    // Allow only numeric values or empty string
    if (value === "" || /^\d+$/.test(value)) {
      const numValue = value === "" ? 0 : Number.parseInt(value, 10)
      setNewCenter({ ...newCenter, registeredVoters: numValue })
    }
  }

  // Load vote data when a center is selected
  useEffect(() => {
    if (selectedCenterId) {
      loadVoteData(selectedCenterId)
      // Show notification when center is selected
      const selectedCenter = centers.find(center => center.id === selectedCenterId)
      if (selectedCenter) {
        toast.success("Center Selected", {
          description: `Selected center: ${selectedCenter.name} (${selectedCenter.centerNumber}).`,
        })
      }
    }
  }, [selectedCenterId, centers])

  // Reset center selection when ward changes
  useEffect(() => {
    if (selectedWardId) {
      setSelectedCenterId("")
      setVoteCounts({})
      setVoteErrors({})
      // Show notification when ward is selected
      const selectedWard = wards.find(ward => ward.id === selectedWardId)
      if (selectedWard) {
        toast.success("Ward Selected", {
          description: `Selected ward: ${selectedWard.name}. Now select a voting center.`,
        })
      }
    }
  }, [selectedWardId, wards])

  // Filtered and paginated centers
  const filteredCenters = useMemo(() => {
    return centers.filter(center => 
      (selectedWardId ? center.wardId === selectedWardId : true) &&
      (center.name.toLowerCase().includes(centerSearch.toLowerCase()) ||
      center.centerNumber.toLowerCase().includes(centerSearch.toLowerCase()))
    )
  }, [centers, centerSearch, selectedWardId])

  const paginatedCenters = useMemo(() => {
    const startIndex = (centerPage - 1) * centersPerPage
    return filteredCenters.slice(startIndex, startIndex + centersPerPage)
  }, [filteredCenters, centerPage, centersPerPage])

  const totalCenterPages = useMemo(() => {
    return Math.ceil(filteredCenters.length / centersPerPage)
  }, [filteredCenters, centersPerPage])

  // Filtered and paginated wards
  const filteredWards = useMemo(() => {
    return wards.filter(ward => 
      ward.name.toLowerCase().includes(wardSearch.toLowerCase())
    )
  }, [wards, wardSearch])

  const paginatedWards = useMemo(() => {
    const startIndex = (wardPage - 1) * wardsPerPage
    return filteredWards.slice(startIndex, startIndex + wardsPerPage)
  }, [filteredWards, wardPage, wardsPerPage])

  const totalWardPages = useMemo(() => {
    return Math.ceil(filteredWards.length / wardsPerPage)
  }, [filteredWards, wardsPerPage])

  const loadVoteData = async (centerId: string) => {
    try {
      const votesData = await getVotes(centerId)
      const existingVoteData = votesData[0] || null
      setExistingVote(existingVoteData)

      // Initialize vote counts
      const initialCounts: Record<string, number> = {}
      candidates.forEach((candidate) => {
        initialCounts[candidate.id] = existingVoteData?.counts[candidate.id] || 0
      })
      setVoteCounts(initialCounts)
      setVoteErrors({})
    } catch (error) {
      console.error("Error loading vote data:", error)
    }
  }

  const handleCandidateSelect = async (candidateId: string) => {
    setSelectedCandidateId(candidateId)
    
    // Show notification when candidate is selected
    const selectedCandidate = candidates.find(candidate => candidate.id === candidateId)
    if (selectedCandidate) {
      toast.success("Candidate Selected", {
        description: `Viewing performance for: ${selectedCandidate.name}`,
      })
    }
    
    // Load vote data for this candidate across all centers
    if (candidateId) {
      try {
        const allVotes = await getVotes()
        
        // Calculate votes per ward for this candidate
        const wardVoteCounts: Record<string, number> = {}
        
        // Initialize all wards with 0 votes
        wards.forEach(ward => {
          wardVoteCounts[ward.id] = 0
        })
        
        // Sum votes for this candidate by ward
        allVotes.forEach(vote => {
          const center = centers.find(c => c.id === vote.centerId)
          if (center && vote.counts[candidateId]) {
            const wardId = center.wardId
            wardVoteCounts[wardId] = (wardVoteCounts[wardId] || 0) + vote.counts[candidateId]
          }
        })
        
        setWardVotes(wardVoteCounts)
      } catch (error) {
        console.error("Error loading candidate data:", error)
        toast.error("Error", {
          description: "Error loading candidate data. Please try again.",
        })
      }
    }
  }

  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0)
  const selectedCenter = centers.find(c => c.id === selectedCenterId)
  const registeredVoters = selectedCenter ? selectedCenter.registeredVoters : 0

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-balance">Admin Panel</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage districts, wards, centers, candidates, and votes</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            logout()
            toast.success("Logged Out", {
              description: "You have been successfully logged out.",
            })
          }} 
          className="w-full sm:w-auto"
        >
          Logout
        </Button>
      </div>

      <Tabs defaultValue="districts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="districts" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Districts</span>
            <span className="sm:hidden">Dist</span>
          </TabsTrigger>
          <TabsTrigger value="wards" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Building className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Wards</span>
            <span className="sm:hidden">Wards</span>
          </TabsTrigger>
          <TabsTrigger value="centers" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Vote className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Centers</span>
            <span className="sm:hidden">Cent</span>
          </TabsTrigger>
          <TabsTrigger value="candidates" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Candidates</span>
            <span className="sm:hidden">Cand</span>
          </TabsTrigger>
          <TabsTrigger value="votes" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <BarChart className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Votes</span>
            <span className="sm:hidden">Votes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="districts">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New District
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="district-name">District Name</Label>
                  <Input
                    id="district-name"
                    value={newDistrict.name}
                    onChange={(e) => setNewDistrict({ name: e.target.value })}
                    placeholder="Enter district name"
                  />
                </div>
                <Button onClick={handleAddDistrict} className="w-full">
                  Add District
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Districts ({districts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {districts.map((district) => (
                    <div key={district.id} className="p-3 border rounded-lg">
                      <div className="font-semibold">{district.name}</div>
                      <div className="text-sm text-muted-foreground">ID: {district.id}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wards">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Ward
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ward-district">District</Label>
                    <Select
                      value={newWard.districtId}
                      onValueChange={(value) => setNewWard({ ...newWard, districtId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district.id} value={district.id}>
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ward-name">Ward Name</Label>
                    <Input
                      id="ward-name"
                      value={newWard.name}
                      onChange={(e) => setNewWard({ ...newWard, name: e.target.value })}
                      placeholder="Enter ward name"
                    />
                  </div>
                </div>
                <Button onClick={handleAddWard} className="w-full md:w-auto">
                  Add Ward
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Existing Wards ({wards.length})</span>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search wards..."
                      value={wardSearch}
                      onChange={(e) => {
                        setWardSearch(e.target.value)
                        setWardPage(1)
                      }}
                      className="pl-10"
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {paginatedWards.map((ward) => (
                    <div key={ward.id} className="p-3 border rounded-lg">
                      <div className="font-semibold">{ward.name}</div>
                      <div className="text-sm text-muted-foreground">
                        District: {districts.find((d) => d.id === ward.districtId)?.name}
                      </div>
                    </div>
                  ))}
                  
                  {filteredWards.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No wards found
                    </div>
                  )}
                </div>
                
                {totalWardPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {Math.min(wardsPerPage, filteredWards.length)} of {filteredWards.length} wards
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setWardPage(p => Math.max(1, p - 1))}
                        disabled={wardPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center text-sm">
                        Page {wardPage} of {totalWardPages}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setWardPage(p => Math.min(totalWardPages, p + 1))}
                        disabled={wardPage === totalWardPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="centers">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Center
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="center-ward">Ward</Label>
                    <Select
                      value={newCenter.wardId}
                      onValueChange={(value) => setNewCenter({ ...newCenter, wardId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ward" />
                      </SelectTrigger>
                      <SelectContent>
                        {wards.map((ward) => (
                          <SelectItem key={ward.id} value={ward.id}>
                            {ward.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="center-number">Center Number</Label>
                    <Input
                      id="center-number"
                      value={newCenter.centerNumber}
                      onChange={(e) => setNewCenter({ ...newCenter, centerNumber: e.target.value })}
                      placeholder="e.g., C-123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="center-name">Center Name</Label>
                    <Input
                      id="center-name"
                      value={newCenter.name}
                      onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                      placeholder="Enter center name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="registered-voters">Registered Voters</Label>
                    {/* Changed to text input with number validation */}
                    <Input
                      id="registered-voters"
                      value={newCenter.registeredVoters || ""}
                      onChange={(e) => handleRegisteredVotersChange(e.target.value)}
                      placeholder="Number of registered voters"
                    />
                  </div>
                </div>
                <Button onClick={handleAddCenter} className="w-full md:w-auto">
                  Add Center
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Existing Centers ({centers.length})</span>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search centers..."
                      value={centerSearch}
                      onChange={(e) => {
                        setCenterSearch(e.target.value)
                        setCenterPage(1)
                      }}
                      className="pl-10"
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {paginatedCenters.map((center) => (
                    <div key={center.id} className="p-3 border rounded-lg">
                      <div className="font-semibold">{center.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {center.centerNumber} • {center.registeredVoters} voters
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Ward: {wards.find((w) => w.id === center.wardId)?.name}
                      </div>
                    </div>
                  ))}
                  
                  {filteredCenters.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No centers found
                    </div>
                  )}
                </div>
                
                {totalCenterPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {Math.min(centersPerPage, filteredCenters.length)} of {filteredCenters.length} centers
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCenterPage(p => Math.max(1, p - 1))}
                        disabled={centerPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center text-sm">
                        Page {centerPage} of {totalCenterPages}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCenterPage(p => Math.min(totalCenterPages, p + 1))}
                        disabled={centerPage === totalCenterPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="candidates">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Candidate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="candidate-name">Candidate Name</Label>
                  <Input
                    id="candidate-name"
                    value={newCandidate.name}
                    onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                    placeholder="Enter candidate name"
                  />
                </div>
                <div>
                  <Label htmlFor="candidate-party">Party</Label>
                  <Input
                    id="candidate-party"
                    value={newCandidate.party}
                    onChange={(e) => setNewCandidate({ ...newCandidate, party: e.target.value })}
                    placeholder="Enter party name"
                  />
                </div>
                <Button onClick={handleAddCandidate} className="w-full">
                  Add Candidate
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Candidates ({candidates.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {candidates.map((candidate) => (
                    <div key={candidate.id} className="p-3 border rounded-lg">
                      <div className="font-semibold">{candidate.name}</div>
                      <div className="text-sm text-muted-foreground">{candidate.party}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="votes">
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Vote Management</h2>
                <p className="text-muted-foreground text-sm sm:text-base">Enter and track votes across centers and wards</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-primary/10 px-2 py-1 sm:px-3 sm:py-1 rounded-full">
                  <span className="text-xs sm:text-sm font-medium text-primary">Total Votes: {totalVotes.toLocaleString()}</span>
                </div>
                {selectedCenterId && (
                  <div className="bg-blue-500/10 px-2 py-1 sm:px-3 sm:py-1 rounded-full">
                    <span className="text-xs sm:text-sm font-medium text-blue-600">
                      Registered Voters: {registeredVoters.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Vote Entry Section - Main Panel */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-2 border-primary/20 shadow-sm">
                  <CardHeader className="bg-primary/5 rounded-t-lg">
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <Vote className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-lg sm:text-xl">Vote Entry</span>
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground">Select a ward and center to enter votes for each candidate</p>
                  </CardHeader>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="mb-4 sm:mb-6 space-y-4">
                      <div>
                        <Label htmlFor="vote-ward" className="text-base font-medium">Select Ward</Label>
                        <Select value={selectedWardId} onValueChange={setSelectedWardId}>
                          <SelectTrigger id="vote-ward" className="mt-2 h-10 sm:h-12">
                            <SelectValue placeholder="Choose a ward" />
                          </SelectTrigger>
                          <SelectContent>
                            {wards.map((ward) => (
                              <SelectItem key={ward.id} value={ward.id} className="py-2">
                                <div className="flex justify-between items-center w-full">
                                  <span className="font-medium text-sm sm:text-base">{ward.name} -</span>
                                  <span className="text-xs sm:text-sm text-muted-foreground pl-1">
                                    {centers.filter(c => c.wardId === ward.id).length} centers
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="vote-center" className="text-base font-medium">Select Voting Center</Label>
                        <Select 
                          value={selectedCenterId} 
                          onValueChange={setSelectedCenterId}
                          disabled={!selectedWardId}
                        >
                          <SelectTrigger id="vote-center" className="mt-2 h-10 sm:h-12">
                            <SelectValue placeholder="Choose a center to enter votes" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredCenters.map((center) => (
                              <SelectItem key={center.id} value={center.id} className="py-2">
                                <div className="flex justify-between items-center w-full">
                                  <span className="text-xs text-muted-foreground">{center.centerNumber} -</span>
                                  <span className="font-medium text-sm sm:text-base pl-1">{center.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {selectedCenterId && (
                      <div className="space-y-6">
                        {/* Candidate Votes Section */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b">
                            <h3 className="font-semibold text-lg">Candidate Votes</h3>
                            <span className="text-sm text-muted-foreground">
                              {candidates.length} candidates
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            {candidates.map((candidate) => (
                              <div 
                                key={candidate.id} 
                                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-xl hover:bg-accent transition-all duration-200 hover:shadow-sm"
                              >
                                <div
                                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow"
                                  style={{ backgroundColor: "#3b82f6" }}
                                >
                                  {candidate.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm sm:text-base truncate">{candidate.name}</div>
                                  <div className="text-xs sm:text-sm text-muted-foreground truncate">{candidate.party}</div>
                                </div>
                                <div className="w-20 sm:w-28">
                                  <Label htmlFor={`votes-${candidate.id}`} className="sr-only">
                                    Votes for {candidate.name}
                                  </Label>
                                  <div className="relative">
                                    <Input
                                      id={`votes-${candidate.id}`}
                                      value={voteCounts[candidate.id] !== undefined ? (voteCounts[candidate.id] || "") : ""}
                                      onChange={(e) => handleVoteCountChange(candidate.id, e.target.value)}
                                      className={`text-center pr-8 h-8 sm:h-10 text-sm sm:text-lg font-medium ${
                                        voteErrors[candidate.id] ? "border-red-500" : ""
                                      }`}
                                      placeholder="0"
                                    />
                                    <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xs sm:text-sm">
                                      votes
                                    </div>
                                    {voteErrors[candidate.id] && (
                                      <div className="absolute -bottom-5 sm:-bottom-6 left-0 right-0 flex items-center text-red-500 text-xs">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        <span className="truncate">{voteErrors[candidate.id]}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Validation Summary */}
                          {totalVotes > registeredVoters && (
                            <div className="p-2 sm:p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center text-red-500">
                              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                              <span className="text-xs sm:text-sm">
                                Total votes ({totalVotes}) exceed registered voters ({registeredVoters}) for this center
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
                          <Button 
                            onClick={handleSaveVotes} 
                            disabled={saving || totalVotes > registeredVoters || Object.keys(voteErrors).length > 0} 
                            size="default"
                            className="flex-1 h-10 sm:h-12"
                          >
                            {saving ? (
                              <span className="flex items-center">
                                <span className="animate-spin mr-1 sm:mr-2 text-sm">●</span>
                                <span className="text-sm sm:text-base">Saving...</span>
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                <span className="text-sm sm:text-base">Save Votes</span>
                              </span>
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setSelectedCenterId("")
                              setVoteCounts({})
                              setVoteErrors({})
                            }}
                            size="default"
                            className="flex-1 h-10 sm:h-12"
                          >
                            <span className="text-sm sm:text-base">Clear</span>
                          </Button>
                        </div>
                      </div>
                    )}

                    {!selectedCenterId && (
                      <div className="text-center py-8 sm:py-12 bg-muted/30 rounded-xl border-2 border-dashed">
                        <Vote className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-muted-foreground/30" />
                        <h3 className="text-base sm:text-lg font-semibold mb-2">
                          {selectedWardId ? "No Center Selected" : "Select a Ward First"}
                        </h3>
                        <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto px-2">
                          {selectedWardId 
                            ? "Select a voting center from the dropdown above to enter vote counts for candidates." 
                            : "Please select a ward first, then choose a voting center to enter votes."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Section */}
              <div className="space-y-4 sm:space-y-6">
                {/* Ward Browsing Card */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-base sm:text-lg">Ward Performance</span>
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground">View candidate performance by ward</p>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    <div>
                      <Label htmlFor="ward-candidate" className="text-base font-medium">Select Candidate</Label>
                      <Select value={selectedCandidateId} onValueChange={handleCandidateSelect}>
                        <SelectTrigger id="ward-candidate" className="mt-2 h-10 sm:h-12">
                          <SelectValue placeholder="Choose a candidate" />
                        </SelectTrigger>
                        <SelectContent>
                          {candidates.map((candidate) => (
                            <SelectItem key={candidate.id} value={candidate.id} className="py-2">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div
                                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                  style={{ backgroundColor: "#3b82f6" }}
                                >
                                  {candidate.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium text-sm sm:text-base truncate">{candidate.name}</div>
                                  <div className="text-xs text-muted-foreground truncate">{candidate.party}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedCandidateId && (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-primary/10 rounded-lg">
                          <div
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg"
                            style={{ backgroundColor: "#3b82f6" }}
                          >
                            {candidates.find(c => c.id === selectedCandidateId)?.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-base sm:text-lg truncate">{candidates.find(c => c.id === selectedCandidateId)?.name}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground truncate">{candidates.find(c => c.id === selectedCandidateId)?.party}</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-96 overflow-y-auto pr-1 sm:pr-2">
                          {wards.map((ward) => (
                            <div 
                              key={ward.id} 
                              className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent transition-colors"
                            >
                              <div className="min-w-0">
                                <div className="font-medium text-sm sm:text-base truncate">{ward.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {centers.filter(c => c.wardId === ward.id).length} centers
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-base sm:text-xl text-primary">{wardVotes[ward.id]?.toLocaleString() || 0}</div>
                                <div className="text-xs text-muted-foreground">votes</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!selectedCandidateId && (
                      <div className="text-center py-6 sm:py-10 bg-muted/30 rounded-lg border border-dashed">
                        <BarChart className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-muted-foreground/30" />
                        <p className="text-muted-foreground text-xs sm:text-sm px-2">
                          Select a candidate to view their performance across wards
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Quick Stats Card */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-base sm:text-lg">System Overview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div className="p-3 sm:p-4 bg-blue-500/10 rounded-lg text-center">
                        <div className="text-lg sm:text-2xl font-bold text-blue-600">{centers.length}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1">Centers</div>
                      </div>
                      <div className="p-3 sm:p-4 bg-green-500/10 rounded-lg text-center">
                        <div className="text-lg sm:text-2xl font-bold text-green-600">{wards.length}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1">Wards</div>
                      </div>
                      <div className="p-3 sm:p-4 bg-purple-500/10 rounded-lg text-center">
                        <div className="text-lg sm:text-2xl font-bold text-purple-600">{candidates.length}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1">Candidates</div>
                      </div>
                      <div className="p-3 sm:p-4 bg-orange-500/10 rounded-lg text-center">
                        <div className="text-lg sm:text-2xl font-bold text-orange-600">{totalVotes.toLocaleString()}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1">Total Votes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
