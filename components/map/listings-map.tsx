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

const goldIcon = L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 24 32">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="#EAB308" stroke="#A16207" stroke-width="1"/>
        <circle cx="12" cy="11" r="5" fill="white"/>
        <polygon points="12,7 13.2,10 16.5,10 13.8,12 14.7,15.2 12,13.2 9.3,15.2 10.2,12 7.5,10 10.8,10" fill="#EAB308"/>
    </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
});

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
    status: string;
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
                    icon={
                        listing.status === "FAVORITE" ? goldIcon : defaultIcon
                    }
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
