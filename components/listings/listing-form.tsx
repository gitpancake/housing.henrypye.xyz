"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(
    () => import("@/components/map/location-picker"),
    {
        ssr: false,
        loading: () => (
            <div className="h-[300px] rounded-lg border bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">Loading map...</p>
            </div>
        ),
    },
);

interface ListingFormData {
    title: string;
    url: string;
    description: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    price: string;
    bedrooms: string;
    bathrooms: string;
    petFriendly: boolean;
    squareFeet: string;
    contactPhone: string;
    photos: string[];
    scrapedContent: string;
    notes: string;
}

interface ListingFormProps {
    listingId?: string;
    initialData?: Partial<ListingFormData>;
}

export function ListingForm({ listingId, initialData }: ListingFormProps) {
    const router = useRouter();
    const isEditing = !!listingId;
    const [saving, setSaving] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [pasteText, setPasteText] = useState("");
    const [photoUrl, setPhotoUrl] = useState("");

    const [form, setForm] = useState<ListingFormData>({
        title: initialData?.title ?? "",
        url: initialData?.url ?? "",
        description: initialData?.description ?? "",
        address: initialData?.address ?? "",
        latitude: initialData?.latitude ?? null,
        longitude: initialData?.longitude ?? null,
        price: initialData?.price ?? "",
        bedrooms: initialData?.bedrooms ?? "",
        bathrooms: initialData?.bathrooms ?? "",
        petFriendly: initialData?.petFriendly ?? false,
        squareFeet: initialData?.squareFeet ?? "",
        contactPhone: initialData?.contactPhone ?? "",
        photos: initialData?.photos ?? [],
        scrapedContent: initialData?.scrapedContent ?? "",
        notes: initialData?.notes ?? "",
    });

    function update<K extends keyof ListingFormData>(
        key: K,
        value: ListingFormData[K],
    ) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function addPhoto() {
        if (!photoUrl.trim()) return;
        update("photos", [...form.photos, photoUrl.trim()]);
        setPhotoUrl("");
    }

    function removePhoto(index: number) {
        update(
            "photos",
            form.photos.filter((_, i) => i !== index),
        );
    }

    async function handleParse() {
        if (!pasteText.trim() || pasteText.trim().length < 20) {
            toast.error("Please paste more listing content to parse");
            return;
        }

        setParsing(true);
        try {
            const res = await fetch("/api/listings/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: pasteText }),
            });

            if (!res.ok) {
                const { error } = await res.json();
                throw new Error(error || "Failed to parse");
            }

            const { parsed } = await res.json();

            setForm((prev) => ({
                ...prev,
                title: parsed.title || prev.title,
                address: parsed.address || prev.address,
                price: parsed.price ? String(parsed.price) : prev.price,
                bedrooms:
                    parsed.bedrooms != null
                        ? String(parsed.bedrooms)
                        : prev.bedrooms,
                bathrooms:
                    parsed.bathrooms != null
                        ? String(parsed.bathrooms)
                        : prev.bathrooms,
                squareFeet:
                    parsed.squareFeet != null
                        ? String(parsed.squareFeet)
                        : prev.squareFeet,
                petFriendly: parsed.petFriendly ?? prev.petFriendly,
                contactPhone: parsed.contactPhone || prev.contactPhone,
                description: parsed.description || prev.description,
                scrapedContent: pasteText,
            }));

            toast.success("Parsed! Review the details below.");
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to parse listing",
            );
        } finally {
            setParsing(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title.trim()) {
            toast.error("Please add a title for the listing");
            return;
        }

        setSaving(true);
        try {
            const url = isEditing
                ? `/api/listings/${listingId}`
                : "/api/listings";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) throw new Error("Failed to save listing");

            const { listing } = await res.json();
            const id = listingId ?? listing.id;

            toast.success(
                isEditing
                    ? "Listing updated! Running AI evaluation..."
                    : "Listing added! Running AI evaluation...",
            );

            // Trigger evaluation in the background
            fetch(`/api/listings/${id}/evaluate`, { method: "POST" }).catch(
                () => {
                    // Evaluation failure is non-blocking
                },
            );

            router.push(`/listings/${id}`);
            router.refresh();
        } catch {
            toast.error("Failed to save listing. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-3xl space-y-6 px-4 py-8"
        >
            <div>
                <h1 className="text-2xl font-bold">
                    {isEditing ? "Edit Listing" : "Add New Listing"}
                </h1>
                <p className="text-muted-foreground">
                    {isEditing
                        ? "Update the details and we'll re-run the AI evaluation."
                        : "Found a promising place? Add the details and we'll score it."}
                </p>
            </div>

            {!isEditing && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Quick Add — Paste Listing
                        </CardTitle>
                        <CardDescription>
                            Paste text from apartments.com, rentals.ca, or any
                            listing site. AI will extract the details and
                            pre-fill the form below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            value={pasteText}
                            onChange={(e) => setPasteText(e.target.value)}
                            placeholder="Paste the full listing page content here..."
                            rows={6}
                        />
                        <Button
                            type="button"
                            onClick={handleParse}
                            disabled={parsing || !pasteText.trim()}
                        >
                            {parsing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Parsing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Parse with AI
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Basic Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={form.title}
                            onChange={(e) => update("title", e.target.value)}
                            placeholder="e.g., Bright 2BR near Commercial Drive"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="url">Listing URL</Label>
                        <Input
                            id="url"
                            type="url"
                            value={form.url}
                            onChange={(e) => update("url", e.target.value)}
                            placeholder="https://craigslist.org/..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={form.description}
                            onChange={(e) =>
                                update("description", e.target.value)
                            }
                            placeholder="Paste the listing description here..."
                            rows={6}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price ($/mo)</Label>
                            <Input
                                id="price"
                                type="number"
                                value={form.price}
                                onChange={(e) =>
                                    update("price", e.target.value)
                                }
                                placeholder="2000"
                                min={0}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bedrooms">Bedrooms</Label>
                            <Input
                                id="bedrooms"
                                type="number"
                                value={form.bedrooms}
                                onChange={(e) =>
                                    update("bedrooms", e.target.value)
                                }
                                placeholder="2"
                                min={0}
                                max={10}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bathrooms">Bathrooms</Label>
                            <Input
                                id="bathrooms"
                                type="number"
                                value={form.bathrooms}
                                onChange={(e) =>
                                    update("bathrooms", e.target.value)
                                }
                                placeholder="1"
                                min={0}
                                max={10}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sqft">Sq Ft</Label>
                            <Input
                                id="sqft"
                                type="number"
                                value={form.squareFeet}
                                onChange={(e) =>
                                    update("squareFeet", e.target.value)
                                }
                                placeholder="800"
                                min={0}
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 rounded-lg border p-4">
                        <Checkbox
                            id="petFriendly"
                            checked={form.petFriendly}
                            onCheckedChange={(checked) =>
                                update("petFriendly", checked === true)
                            }
                        />
                        <Label htmlFor="petFriendly" className="cursor-pointer">
                            Pet Friendly
                        </Label>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contactPhone">Contact Phone</Label>
                        <Input
                            id="contactPhone"
                            type="tel"
                            value={form.contactPhone}
                            onChange={(e) =>
                                update("contactPhone", e.target.value)
                            }
                            placeholder="(778) 655-3101"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Location</CardTitle>
                    <CardDescription>
                        Enter an address or click the map to set the location
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            value={form.address}
                            onChange={(e) => update("address", e.target.value)}
                            placeholder="123 Main St, Vancouver, BC"
                        />
                    </div>
                    <LocationPicker
                        latitude={form.latitude}
                        longitude={form.longitude}
                        onLocationChange={(lat, lng) => {
                            update("latitude", lat);
                            update("longitude", lng);
                        }}
                    />
                    {form.latitude && form.longitude && (
                        <p className="text-xs text-muted-foreground">
                            Coordinates: {form.latitude.toFixed(5)},{" "}
                            {form.longitude.toFixed(5)}
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Photos</CardTitle>
                    <CardDescription>
                        Add photo URLs from the listing
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            value={photoUrl}
                            onChange={(e) => setPhotoUrl(e.target.value)}
                            placeholder="https://images.example.com/photo.jpg"
                            onKeyDown={(e) =>
                                e.key === "Enter" &&
                                (e.preventDefault(), addPhoto())
                            }
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addPhoto}
                        >
                            Add
                        </Button>
                    </div>
                    {form.photos.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {form.photos.map((url, i) => (
                                <div
                                    key={i}
                                    className="group relative rounded-lg overflow-hidden border"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={url}
                                        alt={`Photo ${i + 1}`}
                                        className="h-32 w-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src =
                                                "";
                                            (e.target as HTMLImageElement).alt =
                                                "Failed to load";
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(i)}
                                        className="absolute top-1 right-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={form.notes}
                        onChange={(e) => update("notes", e.target.value)}
                        placeholder="Any personal notes about this place..."
                        rows={3}
                    />
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1"
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                    {saving
                        ? "Saving..."
                        : isEditing
                          ? "Save & Re-evaluate"
                          : "Add Listing & Evaluate"}
                </Button>
            </div>
        </form>
    );
}
