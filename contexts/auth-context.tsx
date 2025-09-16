"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"

interface AuthContextType {
  isAuthenticated: boolean
  login: (password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if already authenticated on initial load
    // First check cookie, then localStorage as fallback
    const cookieAuth = document.cookie
      .split("; ")
      .find((row) => row.startsWith("admin-auth="))
      ?.split("=")[1]
    
    if (cookieAuth === "true") {
      setIsAuthenticated(true)
    } else {
      const localStorageAuth = typeof window !== "undefined" ? localStorage.getItem("admin-auth") : null
      if (localStorageAuth === "true") {
        setIsAuthenticated(true)
      }
    }
  }, [])

  const login = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem("admin-auth", "true")
      // Also set a cookie for server-side checking
      document.cookie = "admin-auth=true; path=/; max-age=86400" // 1 day
      return true
    }
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("admin-auth")
    // Also remove the cookie
    document.cookie = "admin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push("/admin/login")
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}