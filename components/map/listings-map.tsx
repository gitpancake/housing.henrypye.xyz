"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

import { locationConfig } from "@/lib/location-config";

const DEFAULT_CENTER = locationConfig.defaultCenter;

interface MapListing {
    id: string;
    title: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    price: number | null;
    bedrooms: number | null;
}

interface ListingsMapProps {
    listings: MapListing[];
}

export default function ListingsMap({ listings }: ListingsMapProps) {
    const mapped = listings.filter((l) => l.latitude && l.longitude);

    return (
        <MapContainer
            center={DEFAULT_CENTER}
            zoom={11}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mapped.map((listing) => (
                <Marker
                    key={listing.id}
                    position={[listing.latitude!, listing.longitude!]}
                >
                    <Popup>
                        <div className="space-y-1">
                            <Link
                                href={`/listings/${listing.id}`}
                                className="font-semibold text-sm hover:underline"
                            >
                                {listing.title}
                            </Link>
                            {listing.address && (
                                <p className="text-xs text-gray-600">
                                    {listing.address}
                                </p>
                            )}
                            <div className="flex gap-2 text-xs">
                                {listing.price && (
                                    <span>
                                        ${listing.price.toLocaleString()}/mo
                                    </span>
                                )}
                                {listing.bedrooms != null && (
                                    <span>{listing.bedrooms} bed</span>
                                )}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
