"use client"

import { useState, useEffect } from "react"

interface User {
  id: string
  username: string
  displayName: string
  isAdmin: boolean
  onboardingComplete: boolean
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .finally(() => setLoading(false))
  }, [])

  return { user, loading }
}
