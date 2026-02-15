"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import dynamic from "next/dynamic"

const ListingsMap = dynamic(() => import("@/components/map/listings-map"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-muted flex items-center justify-center">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  ),
})

interface MapListing {
  id: string
  title: string
  address: string
  latitude: number | null
  longitude: number | null
  price: number | null
  bedrooms: number | null
}

export default function MapPage() {
  const [listings, setListings] = useState<MapListing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/listings")
      .then((res) => res.json())
      .then((data) => setListings(data.listings || []))
      .finally(() => setLoading(false))
  }, [])

  const mappedCount = listings.filter((l) => l.latitude && l.longitude).length

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold">Map View</h1>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading..." : `${mappedCount} of ${listings.length} listings on map`}
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <ListingsMap listings={listings} />
      </div>
    </div>
  )
}
