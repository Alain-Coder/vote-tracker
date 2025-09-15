import type { Candidate } from "@/lib/types"

interface CandidateBadgeProps {
  candidate: Candidate
  votes?: number
  percentage?: number
  showLogo?: boolean
}

export function CandidateBadge({ candidate, votes, percentage, showLogo = true }: CandidateBadgeProps) {
  // Default color if none is provided
  const defaultColor = "#3b82f6" // blue-500
  
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
      {showLogo && (
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: defaultColor }}
        >
          {candidate.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
      )}
      <div className="flex-1">
        <div className="font-semibold">{candidate.name}</div>
        <div className="text-sm text-muted-foreground">{candidate.party}</div>
      </div>
      {votes !== undefined && (
        <div className="text-right">
          <div className="font-bold text-lg">{votes.toLocaleString()}</div>
          {percentage !== undefined && <div className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</div>}
        </div>
      )}
    </div>
  )
}