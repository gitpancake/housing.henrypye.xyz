"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    CheckSquare,
    Square,
    CheckCircle2,
    ListTodo,
} from "lucide-react";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    eachDayOfInterval,
    isSameDay,
    isSameMonth,
    isToday,
    startOfDay,
    addDays,
} from "date-fns";
import { ViewingDialog } from "./viewing-dialog";
import { ViewingPreviewDialog } from "./viewing-preview-dialog";
import { ViewingModeDialog } from "./viewing-mode-dialog";
import { TodoDialog, type TodoData } from "./todo-dialog";
import { getAreaFromAddress } from "@/lib/area-utils";

interface ViewingData {
    id: string;
    listingId: string;
    scheduledAt: string;
    notes: string | null;
    status: string;
    listing: {
        id: string;
        title: string;
        address: string;
        price: number | null;
        url: string;
    };
    user: { id: string; displayName: string };
}

interface ListingOption {
    id: string;
    title: string;
    address: string;
    price: number | null;
}

interface CalendarViewProps {
    initialViewings: ViewingData[];
    initialTodos: TodoData[];
    listings: ListingOption[];
    currentUserId: string;
}

// User color assignments
const USER_COLORS: Record<
    number,
    { bg: string; text: string; border: string }
> = {
    0: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-800 dark:text-blue-300",
        border: "border-blue-300 dark:border-blue-700",
    },
    1: {
        bg: "bg-pink-100 dark:bg-pink-900/30",
        text: "text-pink-800 dark:text-pink-300",
        border: "border-pink-300 dark:border-pink-700",
    },
};

const TODO_COLORS = {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-300 dark:border-emerald-700",
};

function statusBadge(status: string) {
    switch (status) {
        case "COMPLETED":
            return (
                <Badge variant="secondary" className="text-[10px]">
                    Done
                </Badge>
            );
        case "CANCELLED":
            return (
                <Badge variant="destructive" className="text-[10px]">
                    Cancelled
                </Badge>
            );
        default:
            return null;
    }
}

export function CalendarView({
    initialViewings,
    initialTodos,
    listings,
    currentUserId,
}: CalendarViewProps) {
    const [viewings, setViewings] = useState<ViewingData[]>(initialViewings);
    const [todos, setTodos] = useState<TodoData[]>(initialTodos);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<"month" | "week">(
        typeof window !== "undefined" && window.innerWidth < 768
            ? "week"
            : "month",
    );
    const [dialogOpen, setDialogOpen] = useState(false);
    const [todoDialogOpen, setTodoDialogOpen] = useState(false);
    const [selectedViewing, setSelectedViewing] = useState<ViewingData | null>(
        null,
    );
    const [selectedTodo, setSelectedTodo] = useState<TodoData | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewViewing, setPreviewViewing] = useState<ViewingData | null>(
        null,
    );
    const [viewingModeOpen, setViewingModeOpen] = useState(false);

    // Build a user index for consistent color assignment
    const userIndex = new Map<string, number>();
    let idx = 0;
    for (const v of viewings) {
        if (!userIndex.has(v.user.id)) {
            userIndex.set(v.user.id, idx++);
        }
    }

    const fetchViewings = useCallback(async () => {
        const res = await fetch("/api/viewings");
        if (res.ok) {
            const data = await res.json();
            setViewings(data.viewings);
        }
    }, []);

    const fetchTodos = useCallback(async () => {
        const res = await fetch("/api/todos");
        if (res.ok) {
            const data = await res.json();
            setTodos(data.todos);
        }
    }, []);

    function openAddDialog(date?: string) {
        setSelectedViewing(null);
        setSelectedDate(date || null);
        setDialogOpen(true);
    }

    function openPreviewDialog(viewing: ViewingData) {
        setPreviewViewing(viewing);
        setPreviewOpen(true);
    }

    function openEditDialog(viewing: ViewingData) {
        setSelectedViewing(viewing);
        setSelectedDate(null);
        setDialogOpen(true);
    }

    function openAddTodoDialog(date?: string) {
        setSelectedTodo(null);
        setSelectedDate(date || null);
        setTodoDialogOpen(true);
    }

    function openEditTodoDialog(todo: TodoData) {
        setSelectedTodo(todo);
        setSelectedDate(null);
        setTodoDialogOpen(true);
    }

    // Get days to render
    const days =
        viewMode === "month"
            ? eachDayOfInterval({
                  start: startOfWeek(startOfMonth(currentDate), {
                      weekStartsOn: 1,
                  }),
                  end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }),
              })
            : eachDayOfInterval({
                  start: startOfWeek(currentDate, { weekStartsOn: 1 }),
                  end: endOfWeek(currentDate, { weekStartsOn: 1 }),
              });

    function navigate(dir: "prev" | "next") {
        if (viewMode === "month") {
            setCurrentDate(
                dir === "prev"
                    ? subMonths(currentDate, 1)
                    : addMonths(currentDate, 1),
            );
        } else {
            setCurrentDate(
                dir === "prev"
                    ? subWeeks(currentDate, 1)
                    : addWeeks(currentDate, 1),
            );
        }
    }

    function getViewingsForDay(day: Date) {
        return viewings.filter((v) => isSameDay(new Date(v.scheduledAt), day));
    }

    function getTodosForDay(day: Date) {
        return todos.filter((t) => isSameDay(new Date(t.scheduledAt), day));
    }

    // Week view: hours from 8am to 10pm
    const weekHours = Array.from({ length: 15 }, (_, i) => i + 8);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate("prev")}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg font-semibold min-w-[180px] text-center">
                        {viewMode === "month"
                            ? format(currentDate, "MMMM yyyy")
                            : `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d")} – ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d, yyyy")}`}
                    </h2>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate("next")}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentDate(new Date())}
                    >
                        Today
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border overflow-hidden">
                        <button
                            className={`px-3 py-1.5 text-sm ${viewMode === "month" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                            onClick={() => setViewMode("month")}
                        >
                            Month
                        </button>
                        <button
                            className={`px-3 py-1.5 text-sm ${viewMode === "week" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                            onClick={() => setViewMode("week")}
                        >
                            Week
                        </button>
                    </div>
                    <Button onClick={() => openAddDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Viewing
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => openAddTodoDialog()}
                    >
                        <ListTodo className="h-4 w-4 mr-2" />
                        Task
                    </Button>
                </div>
            </div>

            {/* Month View */}
            {viewMode === "month" && (
                <Card>
                    <CardContent className="p-0">
                        {/* Day headers */}
                        <div className="grid grid-cols-7 border-b">
                            {[
                                "Mon",
                                "Tue",
                                "Wed",
                                "Thu",
                                "Fri",
                                "Sat",
                                "Sun",
                            ].map((d) => (
                                <div
                                    key={d}
                                    className="py-2 text-center text-xs font-medium text-muted-foreground"
                                >
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Day cells */}
                        <div className="grid grid-cols-7">
                            {days.map((day, i) => {
                                const dayViewings = getViewingsForDay(day);
                                const dayTodos = getTodosForDay(day);
                                const inMonth = isSameMonth(day, currentDate);
                                const today = isToday(day);

                                return (
                                    <div
                                        key={i}
                                        className={`min-h-[100px] border-b border-r p-1 cursor-pointer hover:bg-muted/50 transition-colors ${
                                            !inMonth ? "bg-muted/20" : ""
                                        } ${i % 7 === 0 ? "border-l" : ""}`}
                                        onClick={() =>
                                            openAddDialog(
                                                format(day, "yyyy-MM-dd"),
                                            )
                                        }
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span
                                                className={`text-xs font-medium ${
                                                    today
                                                        ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                                                        : !inMonth
                                                          ? "text-muted-foreground/50"
                                                          : "text-muted-foreground"
                                                }`}
                                            >
                                                {format(day, "d")}
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            {dayViewings.map((v) => {
                                                const colorIdx =
                                                    userIndex.get(v.user.id) ??
                                                    0;
                                                const colors =
                                                    USER_COLORS[colorIdx] ||
                                                    USER_COLORS[0];
                                                return (
                                                    <button
                                                        key={v.id}
                                                        className={`w-full text-left rounded px-1.5 py-0.5 text-[11px] leading-tight border ${colors.bg} ${colors.text} ${colors.border} hover:opacity-80 transition-opacity ${
                                                            v.status ===
                                                            "CANCELLED"
                                                                ? "opacity-50 line-through"
                                                                : ""
                                                        }`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openPreviewDialog(
                                                                v,
                                                            );
                                                        }}
                                                    >
                                                        <div className="font-medium truncate">
                                                            {format(
                                                                new Date(
                                                                    v.scheduledAt,
                                                                ),
                                                                "h:mm a",
                                                            )}
                                                        </div>
                                                        <div className="truncate">
                                                            {v.listing.title}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                            {dayTodos.map((t) => (
                                                <button
                                                    key={t.id}
                                                    className={`w-full text-left rounded px-1.5 py-0.5 text-[11px] leading-tight border ${TODO_COLORS.bg} ${TODO_COLORS.text} ${TODO_COLORS.border} hover:opacity-80 transition-opacity ${
                                                        t.completed
                                                            ? "opacity-50 line-through"
                                                            : ""
                                                    }`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditTodoDialog(t);
                                                    }}
                                                >
                                                    <div className="font-medium truncate flex items-center gap-1">
                                                        {t.completed ? (
                                                            <CheckSquare className="h-2.5 w-2.5 shrink-0" />
                                                        ) : (
                                                            <Square className="h-2.5 w-2.5 shrink-0" />
                                                        )}
                                                        {format(
                                                            new Date(
                                                                t.scheduledAt,
                                                            ),
                                                            "h:mm a",
                                                        )}
                                                    </div>
                                                    <div className="truncate pl-3.5">
                                                        {t.title}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Week View */}
            {viewMode === "week" && (
                <Card>
                    <CardContent className="p-0 overflow-x-auto">
                        <div className="min-w-[700px]">
                            {/* Day headers */}
                            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
                                <div className="py-2" />
                                {days.map((day, i) => (
                                    <div
                                        key={i}
                                        className={`py-2 text-center border-l ${isToday(day) ? "bg-primary/5" : ""}`}
                                    >
                                        <div className="text-xs text-muted-foreground">
                                            {format(day, "EEE")}
                                        </div>
                                        <div
                                            className={`text-sm font-medium ${isToday(day) ? "text-primary" : ""}`}
                                        >
                                            {format(day, "d")}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Hour rows */}
                            {weekHours.map((hour) => (
                                <div
                                    key={hour}
                                    className="grid grid-cols-[60px_repeat(7,1fr)] border-b min-h-[60px]"
                                >
                                    <div className="text-[11px] text-muted-foreground text-right pr-2 pt-1">
                                        {hour === 12
                                            ? "12 PM"
                                            : hour > 12
                                              ? `${hour - 12} PM`
                                              : `${hour} AM`}
                                    </div>
                                    {days.map((day, di) => {
                                        const dayViewings = getViewingsForDay(
                                            day,
                                        ).filter((v) => {
                                            const h = new Date(
                                                v.scheduledAt,
                                            ).getHours();
                                            return h === hour;
                                        });
                                        const hourTodos = getTodosForDay(
                                            day,
                                        ).filter((t) => {
                                            const h = new Date(
                                                t.scheduledAt,
                                            ).getHours();
                                            return h === hour;
                                        });

                                        return (
                                            <div
                                                key={di}
                                                className={`border-l relative cursor-pointer hover:bg-muted/30 transition-colors ${isToday(day) ? "bg-primary/5" : ""}`}
                                                onClick={() =>
                                                    openAddDialog(
                                                        format(
                                                            day,
                                                            "yyyy-MM-dd",
                                                        ),
                                                    )
                                                }
                                            >
                                                {dayViewings.map((v) => {
                                                    const colorIdx =
                                                        userIndex.get(
                                                            v.user.id,
                                                        ) ?? 0;
                                                    const colors =
                                                        USER_COLORS[colorIdx] ||
                                                        USER_COLORS[0];
                                                    const area =
                                                        getAreaFromAddress(
                                                            v.listing.address,
                                                        );
                                                    return (
                                                        <button
                                                            key={v.id}
                                                            className={`absolute inset-x-0.5 top-0.5 rounded p-1.5 text-left border ${colors.bg} ${colors.text} ${colors.border} hover:opacity-80 transition-opacity ${
                                                                v.status ===
                                                                "CANCELLED"
                                                                    ? "opacity-50"
                                                                    : ""
                                                            }`}
                                                            style={{
                                                                minHeight:
                                                                    "55px",
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openPreviewDialog(
                                                                    v,
                                                                );
                                                            }}
                                                        >
                                                            <div className="text-[11px] font-semibold">
                                                                {format(
                                                                    new Date(
                                                                        v.scheduledAt,
                                                                    ),
                                                                    "h:mm a",
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] truncate font-medium">
                                                                {
                                                                    v.listing
                                                                        .title
                                                                }
                                                            </div>
                                                            {area && (
                                                                <div className="text-[10px] opacity-75 truncate">
                                                                    {area}
                                                                </div>
                                                            )}
                                                            <div className="text-[10px] opacity-75">
                                                                {
                                                                    v.user
                                                                        .displayName
                                                                }
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                                {hourTodos.map((t) => (
                                                    <button
                                                        key={t.id}
                                                        className={`absolute inset-x-0.5 rounded p-1.5 text-left border ${TODO_COLORS.bg} ${TODO_COLORS.text} ${TODO_COLORS.border} hover:opacity-80 transition-opacity ${
                                                            t.completed
                                                                ? "opacity-50"
                                                                : ""
                                                        }`}
                                                        style={{
                                                            minHeight: "55px",
                                                            top: `${dayViewings.length > 0 ? "58px" : "2px"}`,
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditTodoDialog(
                                                                t,
                                                            );
                                                        }}
                                                    >
                                                        <div className="text-[11px] font-semibold flex items-center gap-1">
                                                            {t.completed ? (
                                                                <CheckSquare className="h-2.5 w-2.5 shrink-0" />
                                                            ) : (
                                                                <Square className="h-2.5 w-2.5 shrink-0" />
                                                            )}
                                                            {format(
                                                                new Date(
                                                                    t.scheduledAt,
                                                                ),
                                                                "h:mm a",
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] truncate font-medium pl-3.5">
                                                            {t.title}
                                                        </div>
                                                        <div className="text-[10px] opacity-75 pl-3.5">
                                                            {t.user.displayName}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Upcoming items list (below calendar) */}
            {(() => {
                const upcomingViewings = viewings
                    .filter(
                        (v) =>
                            v.status === "SCHEDULED" &&
                            new Date(v.scheduledAt) >= startOfDay(new Date()),
                    )
                    .map((v) => ({
                        type: "viewing" as const,
                        id: v.id,
                        scheduledAt: v.scheduledAt,
                        data: v,
                    }));
                const upcomingTodos = todos
                    .filter(
                        (t) =>
                            !t.completed &&
                            new Date(t.scheduledAt) >= startOfDay(new Date()),
                    )
                    .map((t) => ({
                        type: "todo" as const,
                        id: t.id,
                        scheduledAt: t.scheduledAt,
                        data: t,
                    }));
                const upcoming = [...upcomingViewings, ...upcomingTodos].sort(
                    (a, b) =>
                        new Date(a.scheduledAt).getTime() -
                        new Date(b.scheduledAt).getTime(),
                );

                if (upcoming.length === 0) return null;

                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Upcoming
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {upcoming.map((item) => {
                                    if (item.type === "viewing") {
                                        const v = item.data;
                                        const colorIdx =
                                            userIndex.get(v.user.id) ?? 0;
                                        const colors =
                                            USER_COLORS[colorIdx] ||
                                            USER_COLORS[0];
                                        const area = getAreaFromAddress(
                                            v.listing.address,
                                        );
                                        return (
                                            <button
                                                key={`v-${v.id}`}
                                                className={`w-full text-left flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors ${colors.border}`}
                                                onClick={() =>
                                                    openPreviewDialog(v)
                                                }
                                            >
                                                <div
                                                    className={`rounded-lg p-2 ${colors.bg}`}
                                                >
                                                    <CalendarIcon
                                                        className={`h-4 w-4 ${colors.text}`}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm truncate">
                                                            {v.listing.title}
                                                        </span>
                                                        {statusBadge(v.status)}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                        <span>
                                                            {format(
                                                                new Date(
                                                                    v.scheduledAt,
                                                                ),
                                                                "EEE, MMM d 'at' h:mm a",
                                                            )}
                                                        </span>
                                                        <span>30 min</span>
                                                        {area && (
                                                            <span className="flex items-center gap-0.5">
                                                                <MapPin className="h-3 w-3" />
                                                                {area}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${colors.text}`}
                                                >
                                                    {v.user.displayName}
                                                </Badge>
                                            </button>
                                        );
                                    } else {
                                        const t = item.data;
                                        return (
                                            <button
                                                key={`t-${t.id}`}
                                                className={`w-full text-left flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors ${TODO_COLORS.border}`}
                                                onClick={() =>
                                                    openEditTodoDialog(t)
                                                }
                                            >
                                                <div
                                                    className={`rounded-lg p-2 ${TODO_COLORS.bg}`}
                                                >
                                                    <CheckSquare
                                                        className={`h-4 w-4 ${TODO_COLORS.text}`}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm truncate">
                                                            {t.title}
                                                        </span>
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px]"
                                                        >
                                                            Task
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                        <span>
                                                            {format(
                                                                new Date(
                                                                    t.scheduledAt,
                                                                ),
                                                                "EEE, MMM d 'at' h:mm a",
                                                            )}
                                                        </span>
                                                        <span>
                                                            {t.durationMin} min
                                                        </span>
                                                        {t.location && (
                                                            <span className="flex items-center gap-0.5">
                                                                <MapPin className="h-3 w-3" />
                                                                {t.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${TODO_COLORS.text}`}
                                                >
                                                    {t.user.displayName}
                                                </Badge>
                                            </button>
                                        );
                                    }
                                })}
                            </div>
                        </CardContent>
                    </Card>
                );
            })()}

            {/* Empty state */}
            {viewings.length === 0 && todos.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            Nothing scheduled yet
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Schedule apartment viewings and tasks on this shared
                            calendar.
                        </p>
                        <div className="flex justify-center gap-3">
                            <Button onClick={() => openAddDialog()}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Viewing
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => openAddTodoDialog()}
                            >
                                <ListTodo className="h-4 w-4 mr-2" />
                                Add Task
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Dialogs */}
            <ViewingPreviewDialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                onEdit={() => {
                    setPreviewOpen(false);
                    if (previewViewing) openEditDialog(previewViewing);
                }}
                onStartViewing={() => {
                    setPreviewOpen(false);
                    setViewingModeOpen(true);
                }}
                viewing={previewViewing}
            />
            <ViewingModeDialog
                open={viewingModeOpen}
                onClose={() => setViewingModeOpen(false)}
                viewingId={previewViewing?.id || null}
                listingTitle={previewViewing?.listing.title || ""}
            />
            <ViewingDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSaved={fetchViewings}
                listings={listings}
                viewing={selectedViewing}
                defaultDate={selectedDate || undefined}
            />
            <TodoDialog
                open={todoDialogOpen}
                onClose={() => setTodoDialogOpen(false)}
                onSaved={fetchTodos}
                todo={selectedTodo}
                defaultDate={selectedDate || undefined}
            />
        </div>
    );
}
