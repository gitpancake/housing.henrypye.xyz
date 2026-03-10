"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  username: string
  displayName: string
  isAdmin: boolean
  onboardingComplete: boolean
  email: string
  photoURL: string | null
  sharedUserId: string
  activeTeamId: string
  teamRole: "owner" | "collaborator" | "viewer"
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
        } else {
          router.push("/login")
        }
      })
      .finally(() => setLoading(false))
  }, [router])

  return { user, loading }
}
