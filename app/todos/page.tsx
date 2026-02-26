"use client";

import { useEffect, useState, useCallback } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { useCurrentUser } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ListTodo,
  Plus,
  MapPin,
  ExternalLink,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format, isPast, startOfDay } from "date-fns";
import { TodoDialog, type TodoData } from "@/components/calendar/todo-dialog";

export default function TodosPage() {
  const { userId: currentUserId } = useCurrentUser();
  const [todos, setTodos] = useState<TodoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<TodoData | null>(null);

  const fetchTodos = useCallback(async () => {
    const res = await fetch("/api/todos");
    if (res.ok) {
      const data = await res.json();
      setTodos(data.todos);
    }
  }, []);

  useEffect(() => {
    fetch("/api/todos")
      .then((r) => r.json())
      .then((data) => setTodos(data.todos || []))
      .finally(() => setLoading(false));
  }, []);

  async function toggleCompleted(todo: TodoData) {
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      if (!res.ok) throw new Error();
      setTodos((prev) =>
        prev.map((t) =>
          t.id === todo.id ? { ...t, completed: !t.completed } : t,
        ),
      );
      toast.success(todo.completed ? "Task reopened" : "Task completed");
    } catch {
      toast.error("Failed to update task");
    }
  }

  async function deleteTodo(id: string) {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTodos((prev) => prev.filter((t) => t.id !== id));
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  }

  const now = startOfDay(new Date());
  const overdue = todos.filter(
    (t) => !t.completed && isPast(new Date(t.scheduledAt)) && new Date(t.scheduledAt) < now,
  );
  const upcoming = todos.filter(
    (t) => !t.completed && new Date(t.scheduledAt) >= now,
  );
  const completed = todos.filter((t) => t.completed);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </PageWrapper>
    );
  }

  function TodoRow({ todo }: { todo: TodoData }) {
    return (
      <div
        className={`flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors ${
          todo.completed ? "opacity-60" : ""
        }`}
      >
        <Checkbox
          checked={todo.completed}
          onCheckedChange={() => toggleCompleted(todo)}
          className="mt-0.5"
        />
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => {
            setSelectedTodo(todo);
            setDialogOpen(true);
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className={`font-medium text-sm ${
                todo.completed ? "line-through text-muted-foreground" : ""
              }`}
            >
              {todo.title}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(todo.scheduledAt), "EEE, MMM d 'at' h:mm a")}
            </span>
            {todo.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {todo.location}
              </span>
            )}
            {todo.link && (
              <a
                href={todo.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                Link
              </a>
            )}
          </div>
          {todo.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {todo.description}
            </p>
          )}
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className="text-xs text-emerald-700 dark:text-emerald-400"
          >
            {todo.user.displayName}
          </Badge>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteTodo(todo.id);
            }}
            className="text-zinc-300 hover:text-red-500 transition-colors p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">
              Shared to-do list for your move
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedTodo(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Overdue */}
        {overdue.length > 0 && (
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                Overdue ({overdue.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overdue.map((t) => (
                  <TodoRow key={t.id} todo={t} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming ({upcoming.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcoming.map((t) => (
                  <TodoRow key={t.id} todo={t} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Completed ({completed.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completed.map((t) => (
                  <TodoRow key={t.id} todo={t} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {todos.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
              <p className="text-muted-foreground mb-6">
                Add tasks for your move — vet appointments, ICBC visits, and
                more.
              </p>
              <Button
                onClick={() => {
                  setSelectedTodo(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Task
              </Button>
            </CardContent>
          </Card>
        )}

        <TodoDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSaved={fetchTodos}
          todo={selectedTodo}
        />
      </div>
    </PageWrapper>
  );
}
