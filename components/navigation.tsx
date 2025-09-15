import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Settings, MapPin } from "lucide-react"

export function Navigation() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-bold">Nkhotakota Central</div>
              <div className="text-sm text-muted-foreground">Vote Tracker</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
