"use client"

import { useUser } from "@/hooks/use-user"
import { AppShell } from "./app-shell"

export function PageWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) return <>{children}</>

  return (
    <AppShell user={user}>
      {children}
    </AppShell>
  )
}
