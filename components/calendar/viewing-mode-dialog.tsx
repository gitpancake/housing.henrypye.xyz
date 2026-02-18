"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Camera,
  Plus,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Trash2,
  ImageIcon,
  StickyNote,
} from "lucide-react"

interface ViewingNoteData {
  id: string
  viewingId: string
  title: string
  notes: string | null
  photos: string[]
  createdAt: string
}

interface ViewingModeDialogProps {
  open: boolean
  onClose: () => void
  viewingId: string | null
  listingTitle: string
}

export function ViewingModeDialog({
  open,
  onClose,
  viewingId,
  listingTitle,
}: ViewingModeDialogProps) {
  const [notes, setNotes] = useState<ViewingNoteData[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)

  // Add form state
  const [newTitle, setNewTitle] = useState("")
  const [newNotes, setNewNotes] = useState("")
  const [saving, setSaving] = useState(false)

  // Edit state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editSaving, setEditSaving] = useState(false)

  // Photo upload state
  const [uploadingNoteId, setUploadingNoteId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeNoteIdRef = useRef<string | null>(null)

  const fetchNotes = useCallback(async () => {
    if (!viewingId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/viewings/${viewingId}/notes`)
      if (!res.ok) return
      const data = await res.json()
      setNotes(data.notes || [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [viewingId])

  useEffect(() => {
    if (open && viewingId) {
      fetchNotes()
      setShowAddForm(false)
      setExpandedNoteId(null)
      setEditingNoteId(null)
    }
  }, [open, viewingId, fetchNotes])

  async function handleAddNote() {
    if (!viewingId || !newTitle.trim()) {
      toast.error("Please enter a title")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/viewings/${viewingId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), notes: newNotes.trim() || null }),
      })
      if (!res.ok) throw new Error()
      toast.success("Unit added")
      setNewTitle("")
      setNewNotes("")
      setShowAddForm(false)
      await fetchNotes()
    } catch {
      toast.error("Failed to add unit")
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateNote(noteId: string) {
    if (!viewingId || !editTitle.trim()) {
      toast.error("Please enter a title")
      return
    }

    setEditSaving(true)
    try {
      const res = await fetch(`/api/viewings/${viewingId}/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim(), notes: editNotes.trim() || null }),
      })
      if (!res.ok) throw new Error()
      toast.success("Unit updated")
      setEditingNoteId(null)
      await fetchNotes()
    } catch {
      toast.error("Failed to update unit")
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!viewingId) return
    try {
      const res = await fetch(`/api/viewings/${viewingId}/notes/${noteId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
      toast.success("Unit removed")
      await fetchNotes()
    } catch {
      toast.error("Failed to delete unit")
    }
  }

  function triggerPhotoUpload(noteId: string) {
    activeNoteIdRef.current = noteId
    fileInputRef.current?.click()
  }

  async function handlePhotoUpload(files: FileList) {
    const noteId = activeNoteIdRef.current
    if (!viewingId || !noteId || files.length === 0) return

    setUploadingNoteId(noteId)

    const formData = new FormData()
    for (const file of Array.from(files)) {
      formData.append("photos", file)
    }

    try {
      const res = await fetch(
        `/api/viewings/${viewingId}/notes/${noteId}/photos`,
        { method: "POST", body: formData }
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Upload failed")
      }
      toast.success(`${files.length} photo${files.length > 1 ? "s" : ""} uploaded`)
      await fetchNotes()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photos")
    } finally {
      setUploadingNoteId(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function startEditing(note: ViewingNoteData) {
    setEditingNoteId(note.id)
    setEditTitle(note.title)
    setEditNotes(note.notes || "")
    setExpandedNoteId(note.id)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <StickyNote className="h-5 w-5" />
            Viewing Mode
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{listingTitle}</p>
        </DialogHeader>

        {/* Hidden file input for photo uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handlePhotoUpload(e.target.files)
            }
          }}
        />

        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 && !showAddForm ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">
                No units recorded yet. Add your first unit to start taking notes and photos.
              </p>
            </div>
          ) : (
            /* Existing unit notes */
            notes.map((note) => {
              const isExpanded = expandedNoteId === note.id
              const isEditing = editingNoteId === note.id
              const isUploading = uploadingNoteId === note.id
              const photos = (note.photos as string[]) || []

              return (
                <div key={note.id} className="rounded-lg border">
                  {/* Header — always visible */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                    onClick={() =>
                      setExpandedNoteId(isExpanded ? null : note.id)
                    }
                  >
                    <div className="text-left">
                      <p className="font-medium text-sm">{note.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {photos.length} photo{photos.length !== 1 ? "s" : ""}
                        {note.notes && " · has notes"}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-3">
                      <Separator />

                      {isEditing ? (
                        /* Edit form */
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Title</Label>
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="e.g. Unit 305 - 2br 2ba"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Notes</Label>
                            <Textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Your observations..."
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateNote(note.id)}
                              disabled={editSaving}
                            >
                              {editSaving ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingNoteId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Read view */
                        <>
                          {note.notes && (
                            <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-2">
                              {note.notes}
                            </p>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditing(note)}
                            >
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete &quot;{note.title}&quot;?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove the unit and all its photos.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteNote(note.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </>
                      )}

                      {/* Photos */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            Photos ({photos.length})
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploading}
                            onClick={() => triggerPhotoUpload(note.id)}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Camera className="h-3 w-3 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>

                        {photos.length > 0 && (
                          <div className="grid grid-cols-3 gap-1.5">
                            {photos.map((url, i) => (
                              <div
                                key={i}
                                className="rounded-lg overflow-hidden border"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={url}
                                  alt={`${note.title} photo ${i + 1}`}
                                  className="h-20 w-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}

          {/* Add unit form */}
          {showAddForm ? (
            <div className="rounded-lg border p-3 space-y-3">
              <p className="text-sm font-medium">New Unit</p>
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Unit 305 - 2br 2ba $2800/mo"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notes (optional)</Label>
                <Textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="First impressions, layout, light, condition..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddNote} disabled={saving}>
                  {saving ? "Saving..." : "Save Unit"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewTitle("")
                    setNewNotes("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
