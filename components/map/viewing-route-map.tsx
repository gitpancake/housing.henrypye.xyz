"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function numberedIcon(n: number) {
    return L.divIcon({
        className: "",
        html: `<div style="
            background: #2563eb;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">${n}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
}

interface RouteStop {
    label: string;
    time: string;
    lat: number;
    lng: number;
}

interface ViewingRouteMapProps {
    stops: RouteStop[];
}

export default function ViewingRouteMap({ stops }: ViewingRouteMapProps) {
    if (stops.length === 0) return null;

    const positions: [number, number][] = stops.map((s) => [s.lat, s.lng]);
    const bounds = L.latLngBounds(positions);

    return (
        <MapContainer
            bounds={bounds}
            boundsOptions={{ padding: [40, 40] }}
            style={{ height: "200px", width: "100%" }}
            className="z-0 rounded-lg"
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Polyline
                positions={positions}
                pathOptions={{ color: "#2563eb", weight: 3, dashArray: "8 8" }}
            />
            {stops.map((stop, i) => (
                <Marker
                    key={i}
                    position={[stop.lat, stop.lng]}
                    icon={numberedIcon(i + 1)}
                >
                    <Popup>
                        <div className="text-sm">
                            <span className="font-semibold">{i + 1}. </span>
                            {stop.label}
                            <br />
                            <span className="text-xs text-gray-500">{stop.time}</span>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
