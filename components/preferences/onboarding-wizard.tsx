"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, Plus, X, Sparkles } from "lucide-react"

interface CustomDesire {
  label: string
  importance: number
}

interface PreferencesData {
  naturalLight: number
  bedroomsMin: number
  bedroomsMax: number
  outdoorsAccess: number
  publicTransport: number
  budgetMin: number
  budgetMax: number
  petFriendly: boolean
  moveInDateStart: string
  moveInDateEnd: string
  laundryInUnit: number
  parking: number
  quietNeighbourhood: number
  modernFinishes: number
  storageSpace: number
  gymAmenities: number
  customDesires: CustomDesire[]
}

const STEPS = [
  "Welcome",
  "Basics",
  "Environment",
  "Amenities",
  "Logistics",
  "Custom & Review",
]

interface OnboardingWizardProps {
  initialData?: Partial<PreferencesData>
  isEditing?: boolean
}

export function OnboardingWizard({ initialData, isEditing = false }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [prefs, setPrefs] = useState<PreferencesData>({
    naturalLight: initialData?.naturalLight ?? 5,
    bedroomsMin: initialData?.bedroomsMin ?? 1,
    bedroomsMax: initialData?.bedroomsMax ?? 2,
    outdoorsAccess: initialData?.outdoorsAccess ?? 5,
    publicTransport: initialData?.publicTransport ?? 5,
    budgetMin: initialData?.budgetMin ?? 1500,
    budgetMax: initialData?.budgetMax ?? 2500,
    petFriendly: initialData?.petFriendly ?? false,
    moveInDateStart: initialData?.moveInDateStart ?? "",
    moveInDateEnd: initialData?.moveInDateEnd ?? "",
    laundryInUnit: initialData?.laundryInUnit ?? 5,
    parking: initialData?.parking ?? 5,
    quietNeighbourhood: initialData?.quietNeighbourhood ?? 5,
    modernFinishes: initialData?.modernFinishes ?? 5,
    storageSpace: initialData?.storageSpace ?? 5,
    gymAmenities: initialData?.gymAmenities ?? 5,
    customDesires: initialData?.customDesires ?? [],
  })

  const [newDesireLabel, setNewDesireLabel] = useState("")

  function updatePref<K extends keyof PreferencesData>(key: K, value: PreferencesData[K]) {
    setPrefs((prev) => ({ ...prev, [key]: value }))
  }

  function addCustomDesire() {
    if (!newDesireLabel.trim()) return
    updatePref("customDesires", [
      ...prefs.customDesires,
      { label: newDesireLabel.trim(), importance: 5 },
    ])
    setNewDesireLabel("")
  }

  function removeCustomDesire(index: number) {
    updatePref(
      "customDesires",
      prefs.customDesires.filter((_, i) => i !== index)
    )
  }

  function updateCustomDesireImportance(index: number, importance: number) {
    const updated = [...prefs.customDesires]
    updated[index] = { ...updated[index], importance }
    updatePref("customDesires", updated)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      })

      if (!res.ok) throw new Error("Failed to save preferences")

      toast.success("Preferences saved!")
      router.push("/")
      router.refresh()
    } catch {
      toast.error("Failed to save preferences. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="text-sm text-muted-foreground">{STEPS[step]}</span>
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
              {isEditing ? "Edit Your Preferences" : "Welcome to Nest Finder!"}
            </CardTitle>
            <CardDescription className="text-base">
              {isEditing
                ? "Update what matters most to you in your next apartment."
                : "Let's figure out what matters most to you in your next apartment. We'll walk through a few categories to understand your ideal home in Vancouver."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Rate each feature from 1 (don't care) to 10 (must have). This
              helps us score apartments that match what you're looking for.
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
              <Label className="text-base font-medium">Monthly Budget (CAD)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetMin" className="text-sm text-muted-foreground">
                    Minimum
                  </Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    value={prefs.budgetMin}
                    onChange={(e) => updatePref("budgetMin", parseInt(e.target.value) || 0)}
                    min={0}
                    step={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budgetMax" className="text-sm text-muted-foreground">
                    Maximum
                  </Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    value={prefs.budgetMax}
                    onChange={(e) => updatePref("budgetMax", parseInt(e.target.value) || 0)}
                    min={0}
                    step={100}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Bedrooms</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedroomsMin" className="text-sm text-muted-foreground">
                    Minimum
                  </Label>
                  <Input
                    id="bedroomsMin"
                    type="number"
                    value={prefs.bedroomsMin}
                    onChange={(e) => updatePref("bedroomsMin", parseInt(e.target.value) || 0)}
                    min={0}
                    max={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedroomsMax" className="text-sm text-muted-foreground">
                    Maximum
                  </Label>
                  <Input
                    id="bedroomsMax"
                    type="number"
                    value={prefs.bedroomsMax}
                    onChange={(e) => updatePref("bedroomsMax", parseInt(e.target.value) || 0)}
                    min={0}
                    max={5}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Move-in Dates</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="moveInStart" className="text-sm text-muted-foreground">
                    Earliest
                  </Label>
                  <Input
                    id="moveInStart"
                    type="date"
                    value={prefs.moveInDateStart}
                    onChange={(e) => updatePref("moveInDateStart", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moveInEnd" className="text-sm text-muted-foreground">
                    Latest
                  </Label>
                  <Input
                    id="moveInEnd"
                    type="date"
                    value={prefs.moveInDateEnd}
                    onChange={(e) => updatePref("moveInDateEnd", e.target.value)}
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
            <CardTitle>Environment</CardTitle>
            <CardDescription>
              How important are these environmental factors?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <SliderField
              label="Natural Light"
              description="Big windows, south-facing, bright spaces"
              value={prefs.naturalLight}
              onChange={(v) => updatePref("naturalLight", v)}
            />
            <SliderField
              label="Access to Outdoors"
              description="Balcony, patio, nearby parks and trails"
              value={prefs.outdoorsAccess}
              onChange={(v) => updatePref("outdoorsAccess", v)}
            />
            <SliderField
              label="Quiet Neighbourhood"
              description="Low traffic noise, peaceful surroundings"
              value={prefs.quietNeighbourhood}
              onChange={(v) => updatePref("quietNeighbourhood", v)}
            />
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
            <CardDescription>
              Rate the importance of these features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <SliderField
              label="In-Unit Laundry"
              description="Washer/dryer in the apartment"
              value={prefs.laundryInUnit}
              onChange={(v) => updatePref("laundryInUnit", v)}
            />
            <SliderField
              label="Parking"
              description="Dedicated parking spot included"
              value={prefs.parking}
              onChange={(v) => updatePref("parking", v)}
            />
            <SliderField
              label="Modern Finishes"
              description="Updated kitchen, appliances, flooring"
              value={prefs.modernFinishes}
              onChange={(v) => updatePref("modernFinishes", v)}
            />
            <SliderField
              label="Storage Space"
              description="Closets, storage locker, pantry"
              value={prefs.storageSpace}
              onChange={(v) => updatePref("storageSpace", v)}
            />
            <SliderField
              label="Gym / Amenities"
              description="Building gym, pool, common areas"
              value={prefs.gymAmenities}
              onChange={(v) => updatePref("gymAmenities", v)}
            />
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Logistics</CardTitle>
            <CardDescription>
              Transportation and pet requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <SliderField
              label="Public Transport Access"
              description="Near SkyTrain, bus routes, transit hubs"
              value={prefs.publicTransport}
              onChange={(v) => updatePref("publicTransport", v)}
            />
            <div className="flex items-center space-x-3 rounded-lg border p-4">
              <Checkbox
                id="petFriendly"
                checked={prefs.petFriendly}
                onCheckedChange={(checked) => updatePref("petFriendly", checked === true)}
              />
              <div>
                <Label htmlFor="petFriendly" className="text-base font-medium cursor-pointer">
                  Pet Friendly
                </Label>
                <p className="text-sm text-muted-foreground">
                  Must allow cats, dogs, or other pets
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Desires & Review</CardTitle>
            <CardDescription>
              Add anything else that matters to you, then save
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-medium">Add Custom Desires</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Near good coffee shops, Bike storage..."
                  value={newDesireLabel}
                  onChange={(e) => setNewDesireLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomDesire())}
                />
                <Button type="button" variant="outline" size="icon" onClick={addCustomDesire}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {prefs.customDesires.length > 0 && (
                <div className="space-y-4 mt-4">
                  {prefs.customDesires.map((desire, i) => (
                    <div key={i} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{desire.label}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeCustomDesire(i)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-24">
                          Importance: {desire.importance}/10
                        </span>
                        <Slider
                          value={[desire.importance]}
                          onValueChange={([v]) => updateCustomDesireImportance(i, v)}
                          min={1}
                          max={10}
                          step={1}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="font-medium mb-4">Your Preferences Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-muted-foreground">Budget</div>
                <div>${prefs.budgetMin} – ${prefs.budgetMax}/mo</div>
                <div className="text-muted-foreground">Bedrooms</div>
                <div>{prefs.bedroomsMin}–{prefs.bedroomsMax}</div>
                <div className="text-muted-foreground">Pet Friendly</div>
                <div>{prefs.petFriendly ? "Required" : "Not required"}</div>
                <div className="text-muted-foreground">Natural Light</div>
                <div>{prefs.naturalLight}/10</div>
                <div className="text-muted-foreground">Outdoors Access</div>
                <div>{prefs.outdoorsAccess}/10</div>
                <div className="text-muted-foreground">Quiet Area</div>
                <div>{prefs.quietNeighbourhood}/10</div>
                <div className="text-muted-foreground">In-Unit Laundry</div>
                <div>{prefs.laundryInUnit}/10</div>
                <div className="text-muted-foreground">Parking</div>
                <div>{prefs.parking}/10</div>
                <div className="text-muted-foreground">Modern Finishes</div>
                <div>{prefs.modernFinishes}/10</div>
                <div className="text-muted-foreground">Storage</div>
                <div>{prefs.storageSpace}/10</div>
                <div className="text-muted-foreground">Gym/Amenities</div>
                <div>{prefs.gymAmenities}/10</div>
                <div className="text-muted-foreground">Transit Access</div>
                <div>{prefs.publicTransport}/10</div>
                {prefs.moveInDateStart && (
                  <>
                    <div className="text-muted-foreground">Move-in Window</div>
                    <div>{prefs.moveInDateStart} to {prefs.moveInDateEnd || "flexible"}</div>
                  </>
                )}
                {prefs.customDesires.map((d, i) => (
                  <div key={i} className="contents">
                    <div className="text-muted-foreground">{d.label}</div>
                    <div>{d.importance}/10</div>
                  </div>
                ))}
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
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Complete Setup"}
          </Button>
        )}
      </div>
    </div>
  )
}

function SliderField({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">{label}</Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="text-lg font-semibold tabular-nums w-12 text-right">
          {value}/10
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={1}
        max={10}
        step={1}
      />
    </div>
  )
}
