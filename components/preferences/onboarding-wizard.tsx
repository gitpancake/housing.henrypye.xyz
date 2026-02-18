"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Plus, X, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomDesire {
    label: string;
    enabled: boolean;
}

interface PreferencesData {
    naturalLight: boolean;
    bedroomsMin: number;
    bedroomsMax: number;
    outdoorsAccess: boolean;
    publicTransport: boolean;
    budgetMin: number;
    budgetMax: number;
    petFriendly: boolean;
    moveInDateStart: string;
    moveInDateEnd: string;
    laundryInUnit: boolean;
    parking: boolean;
    quietNeighbourhood: boolean;
    modernFinishes: boolean;
    storageSpace: boolean;
    gymAmenities: boolean;
    customDesires: CustomDesire[];
}

const STEPS = ["Welcome", "Basics", "What Matters", "Custom & Review"];

const PREFERENCE_ITEMS: {
    key: keyof PreferencesData;
    label: string;
    description: string;
}[] = [
    {
        key: "naturalLight",
        label: "Natural Light",
        description: "Big windows, south-facing, bright spaces",
    },
    {
        key: "outdoorsAccess",
        label: "Outdoor Space",
        description: "Balcony, patio, nearby parks and trails",
    },
    {
        key: "quietNeighbourhood",
        label: "Quiet Area",
        description: "Low traffic noise, peaceful surroundings",
    },
    {
        key: "publicTransport",
        label: "Transit Access",
        description: "Near SkyTrain, bus routes, transit hubs",
    },
    {
        key: "laundryInUnit",
        label: "In-Unit Laundry",
        description: "Washer/dryer in the apartment",
    },
    {
        key: "parking",
        label: "Parking",
        description: "Dedicated parking spot included",
    },
    {
        key: "modernFinishes",
        label: "Modern Finishes",
        description: "Updated kitchen, appliances, flooring",
    },
    {
        key: "storageSpace",
        label: "Storage Space",
        description: "Closets, storage locker, pantry",
    },
    {
        key: "gymAmenities",
        label: "Gym / Amenities",
        description: "Building gym, pool, common areas",
    },
    {
        key: "petFriendly",
        label: "Pet Friendly",
        description: "Must allow cats, dogs, or other pets",
    },
];

interface OnboardingWizardProps {
    initialData?: Partial<PreferencesData>;
    isEditing?: boolean;
}

export function OnboardingWizard({
    initialData,
    isEditing = false,
}: OnboardingWizardProps) {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);

    const [prefs, setPrefs] = useState<PreferencesData>({
        naturalLight: initialData?.naturalLight ?? false,
        bedroomsMin: initialData?.bedroomsMin ?? 1,
        bedroomsMax: initialData?.bedroomsMax ?? 2,
        outdoorsAccess: initialData?.outdoorsAccess ?? false,
        publicTransport: initialData?.publicTransport ?? false,
        budgetMin: initialData?.budgetMin ?? 1500,
        budgetMax: initialData?.budgetMax ?? 2500,
        petFriendly: initialData?.petFriendly ?? false,
        moveInDateStart: initialData?.moveInDateStart ?? "",
        moveInDateEnd: initialData?.moveInDateEnd ?? "",
        laundryInUnit: initialData?.laundryInUnit ?? false,
        parking: initialData?.parking ?? false,
        quietNeighbourhood: initialData?.quietNeighbourhood ?? false,
        modernFinishes: initialData?.modernFinishes ?? false,
        storageSpace: initialData?.storageSpace ?? false,
        gymAmenities: initialData?.gymAmenities ?? false,
        customDesires: initialData?.customDesires ?? [],
    });

    const [newDesireLabel, setNewDesireLabel] = useState("");

    function togglePref(key: keyof PreferencesData) {
        setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    function update<K extends keyof PreferencesData>(
        key: K,
        value: PreferencesData[K],
    ) {
        setPrefs((prev) => ({ ...prev, [key]: value }));
    }

    function addCustomDesire() {
        if (!newDesireLabel.trim()) return;
        update("customDesires", [
            ...prefs.customDesires,
            { label: newDesireLabel.trim(), enabled: true },
        ]);
        setNewDesireLabel("");
    }

    function removeCustomDesire(index: number) {
        update(
            "customDesires",
            prefs.customDesires.filter((_, i) => i !== index),
        );
    }

    function toggleCustomDesire(index: number) {
        const updated = [...prefs.customDesires];
        updated[index] = {
            ...updated[index],
            enabled: !updated[index].enabled,
        };
        update("customDesires", updated);
    }

    async function handleSave() {
        setSaving(true);
        try {
            const res = await fetch("/api/preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(prefs),
            });

            if (!res.ok) throw new Error("Failed to save preferences");

            toast.success("Preferences saved!");
            router.push("/");
            router.refresh();
        } catch {
            toast.error("Failed to save preferences. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    const progress = ((step + 1) / STEPS.length) * 100;
    const enabledCount = PREFERENCE_ITEMS.filter(
        (item) => prefs[item.key] as boolean,
    ).length;

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                        Step {step + 1} of {STEPS.length}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        {STEPS[step]}
                    </span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {step === 0 && (
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">
                            {isEditing
                                ? "Edit Your Preferences"
                                : "Welcome to Nest Finder!"}
                        </CardTitle>
                        <CardDescription className="text-base">
                            {isEditing
                                ? "Update what matters to you in your next apartment."
                                : "Let's figure out what matters to you in your next apartment."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground mb-6">
                            Toggle on the things that are important to you.
                            Leave off anything you don't care about. This helps
                            us score apartments that match what you're actually
                            looking for.
                        </p>
                    </CardContent>
                </Card>
            )}

            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>The Basics</CardTitle>
                        <CardDescription>
                            Budget, bedrooms, and timing
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="space-y-4">
                            <Label className="text-base font-medium">
                                Monthly Budget (CAD)
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="budgetMin"
                                        className="text-sm text-muted-foreground"
                                    >
                                        Minimum
                                    </Label>
                                    <Input
                                        id="budgetMin"
                                        type="number"
                                        value={prefs.budgetMin}
                                        onChange={(e) =>
                                            update(
                                                "budgetMin",
                                                parseInt(e.target.value) || 0,
                                            )
                                        }
                                        min={0}
                                        step={100}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="budgetMax"
                                        className="text-sm text-muted-foreground"
                                    >
                                        Maximum
                                    </Label>
                                    <Input
                                        id="budgetMax"
                                        type="number"
                                        value={prefs.budgetMax}
                                        onChange={(e) =>
                                            update(
                                                "budgetMax",
                                                parseInt(e.target.value) || 0,
                                            )
                                        }
                                        min={0}
                                        step={100}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-base font-medium">
                                Bedrooms
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="bedroomsMin"
                                        className="text-sm text-muted-foreground"
                                    >
                                        Minimum
                                    </Label>
                                    <Input
                                        id="bedroomsMin"
                                        type="number"
                                        value={prefs.bedroomsMin}
                                        onChange={(e) =>
                                            update(
                                                "bedroomsMin",
                                                parseInt(e.target.value) || 0,
                                            )
                                        }
                                        min={0}
                                        max={5}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="bedroomsMax"
                                        className="text-sm text-muted-foreground"
                                    >
                                        Maximum
                                    </Label>
                                    <Input
                                        id="bedroomsMax"
                                        type="number"
                                        value={prefs.bedroomsMax}
                                        onChange={(e) =>
                                            update(
                                                "bedroomsMax",
                                                parseInt(e.target.value) || 0,
                                            )
                                        }
                                        min={0}
                                        max={5}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-base font-medium">
                                Move-in Dates
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="moveInStart"
                                        className="text-sm text-muted-foreground"
                                    >
                                        Earliest
                                    </Label>
                                    <Input
                                        id="moveInStart"
                                        type="date"
                                        value={prefs.moveInDateStart}
                                        onChange={(e) =>
                                            update(
                                                "moveInDateStart",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="moveInEnd"
                                        className="text-sm text-muted-foreground"
                                    >
                                        Latest
                                    </Label>
                                    <Input
                                        id="moveInEnd"
                                        type="date"
                                        value={prefs.moveInDateEnd}
                                        onChange={(e) =>
                                            update(
                                                "moveInDateEnd",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>What Matters to You</CardTitle>
                        <CardDescription>
                            Toggle on the things that are important.{" "}
                            {enabledCount} of {PREFERENCE_ITEMS.length}{" "}
                            selected.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {PREFERENCE_ITEMS.map((item) => {
                                const enabled = prefs[item.key] as boolean;
                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => togglePref(item.key)}
                                        className={cn(
                                            "w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-all",
                                            enabled
                                                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                                : "border-border hover:border-muted-foreground/30 hover:bg-muted/50",
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                                                enabled
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-muted-foreground/30",
                                            )}
                                        >
                                            {enabled && (
                                                <Check className="h-3.5 w-3.5" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p
                                                className={cn(
                                                    "font-medium",
                                                    enabled && "text-primary",
                                                )}
                                            >
                                                {item.label}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Custom & Review</CardTitle>
                        <CardDescription>
                            Add anything else that matters, then save
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <Label className="text-base font-medium">
                                Add Custom Preferences
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g., Near good coffee shops, Bike storage..."
                                    value={newDesireLabel}
                                    onChange={(e) =>
                                        setNewDesireLabel(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        (e.preventDefault(), addCustomDesire())
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={addCustomDesire}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {prefs.customDesires.length > 0 && (
                                <div className="space-y-2 mt-4">
                                    {prefs.customDesires.map((desire, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "flex items-center justify-between rounded-lg border p-3 transition-all",
                                                desire.enabled
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border",
                                            )}
                                        >
                                            <button
                                                type="button"
                                                className="flex items-center gap-3 text-left"
                                                onClick={() =>
                                                    toggleCustomDesire(i)
                                                }
                                            >
                                                <div
                                                    className={cn(
                                                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                                                        desire.enabled
                                                            ? "border-primary bg-primary text-primary-foreground"
                                                            : "border-muted-foreground/30",
                                                    )}
                                                >
                                                    {desire.enabled && (
                                                        <Check className="h-3 w-3" />
                                                    )}
                                                </div>
                                                <span
                                                    className={cn(
                                                        "font-medium text-sm",
                                                        desire.enabled &&
                                                            "text-primary",
                                                    )}
                                                >
                                                    {desire.label}
                                                </span>
                                            </button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                    removeCustomDesire(i)
                                                }
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="font-medium mb-4">
                                Your Preferences Summary
                            </h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="text-muted-foreground">
                                        Budget
                                    </span>
                                    <span>
                                        ${prefs.budgetMin.toLocaleString()} - $
                                        {prefs.budgetMax.toLocaleString()}/mo
                                    </span>
                                    <span className="text-muted-foreground">
                                        Bedrooms
                                    </span>
                                    <span>
                                        {prefs.bedroomsMin}-{prefs.bedroomsMax}
                                    </span>
                                    {prefs.moveInDateStart && (
                                        <>
                                            <span className="text-muted-foreground">
                                                Move-in
                                            </span>
                                            <span>
                                                {prefs.moveInDateStart} to{" "}
                                                {prefs.moveInDateEnd ||
                                                    "flexible"}
                                            </span>
                                        </>
                                    )}
                                </div>

                                <div className="border-t pt-3">
                                    <p className="text-sm font-medium mb-2">
                                        Important to you:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {PREFERENCE_ITEMS.filter(
                                            (item) =>
                                                prefs[item.key] as boolean,
                                        ).map((item) => (
                                            <span
                                                key={item.key}
                                                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                                            >
                                                <Check className="h-3 w-3" />
                                                {item.label}
                                            </span>
                                        ))}
                                        {prefs.customDesires
                                            .filter((d) => d.enabled)
                                            .map((d, i) => (
                                                <span
                                                    key={`custom-${i}`}
                                                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                                                >
                                                    <Check className="h-3 w-3" />
                                                    {d.label}
                                                </span>
                                            ))}
                                        {PREFERENCE_ITEMS.every(
                                            (item) =>
                                                !(prefs[item.key] as boolean),
                                        ) &&
                                            prefs.customDesires.every(
                                                (d) => !d.enabled,
                                            ) && (
                                                <span className="text-sm text-muted-foreground">
                                                    None selected
                                                </span>
                                            )}
                                    </div>
                                </div>

                                {PREFERENCE_ITEMS.some(
                                    (item) => !(prefs[item.key] as boolean),
                                ) && (
                                    <div className="border-t pt-3">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Not important:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {PREFERENCE_ITEMS.filter(
                                                (item) =>
                                                    !(prefs[
                                                        item.key
                                                    ] as boolean),
                                            ).map((item) => (
                                                <span
                                                    key={item.key}
                                                    className="inline-flex rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                                                >
                                                    {item.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="mt-6 flex justify-between">
                <Button
                    variant="outline"
                    onClick={() => setStep((s) => s - 1)}
                    disabled={step === 0}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                {step < STEPS.length - 1 ? (
                    <Button onClick={() => setStep((s) => s + 1)}>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button onClick={handleSave} disabled={saving}>
                        {saving
                            ? "Saving..."
                            : isEditing
                              ? "Save Changes"
                              : "Complete Setup"}
                    </Button>
                )}
            </div>
        </div>
    );
}
