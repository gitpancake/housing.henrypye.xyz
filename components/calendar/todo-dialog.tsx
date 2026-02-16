"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

export interface TodoData {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  durationMin: number;
  location: string | null;
  link: string | null;
  completed: boolean;
  user: { id: string; displayName: string };
}

interface TodoDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  todo?: TodoData | null;
  defaultDate?: string;
}

export function TodoDialog({
  open,
  onClose,
  onSaved,
  todo,
  defaultDate,
}: TodoDialogProps) {
  const isEditing = !!todo;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("12:00");
  const [durationMin, setDurationMin] = useState("30");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || "");
      const dt = new Date(todo.scheduledAt);
      setDate(format(dt, "yyyy-MM-dd"));
      setTime(format(dt, "HH:mm"));
      setDurationMin(String(todo.durationMin));
      setLocation(todo.location || "");
      setLink(todo.link || "");
      setCompleted(todo.completed);
    } else {
      setTitle("");
      setDescription("");
      setDate(defaultDate || format(new Date(), "yyyy-MM-dd"));
      setTime("12:00");
      setDurationMin("30");
      setLocation("");
      setLink("");
      setCompleted(false);
    }
  }, [todo, defaultDate, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !date || !time) {
      toast.error("Please enter a title, date, and time");
      return;
    }

    setSaving(true);
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

    try {
      const url = isEditing ? `/api/todos/${todo.id}` : "/api/todos";
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          scheduledAt,
          durationMin: parseInt(durationMin),
          location: location.trim() || null,
          link: link.trim() || null,
          completed,
        }),
      });

      if (!res.ok) throw new Error();
      toast.success(isEditing ? "Task updated" : "Task added");
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to save task");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!todo) return;
    try {
      const res = await fetch(`/api/todos/${todo.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Task deleted");
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to delete task");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Add Task"}</DialogTitle>
        </DialogHeader>

        {isEditing && todo && (
          <p className="text-sm text-muted-foreground">
            Added by {todo.user.displayName}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Register Ziggy with a vet"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={durationMin} onValueChange={setDurationMin}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location (optional)</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. VCA Canada, 123 Main St"
            />
          </div>

          <div className="space-y-2">
            <Label>Link / Website (optional)</Label>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="e.g. https://icbc.com/appointment"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any additional details..."
              rows={2}
            />
          </div>

          {isEditing && (
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="completed"
                checked={completed}
                onCheckedChange={(c) => setCompleted(c === true)}
              />
              <Label htmlFor="completed" className="text-sm cursor-pointer">
                Mark as completed
              </Label>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {isEditing ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove the task.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : isEditing ? "Update" : "Add Task"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
