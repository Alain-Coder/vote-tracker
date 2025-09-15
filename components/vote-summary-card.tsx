import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface VoteSummaryCardProps {
  title: string
  totalVotes: number
  registeredVoters?: number
  children?: React.ReactNode
}

export function VoteSummaryCard({ title, totalVotes, registeredVoters, children }: VoteSummaryCardProps) {
  const turnout = registeredVoters ? (totalVotes / registeredVoters) * 100 : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Votes:</span>
            <span className="font-semibold">{totalVotes.toLocaleString()}</span>
          </div>
          {registeredVoters && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registered Voters:</span>
                <span className="font-semibold">{registeredVoters.toLocaleString()}</span>
              </div>
              {turnout && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Turnout:</span>
                  <span className="font-semibold">{turnout.toFixed(1)}%</span>
                </div>
              )}
            </>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}
