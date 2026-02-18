"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Calculator,
    Pencil,
    RotateCcw,
    Zap,
    Wifi,
    Shield,
    Car,
    Train,
    Droplets,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpenseCalculatorProps {
    rent: number | null;
    monthlyTakeHome: number | null;
    hasParking: boolean;
}

interface ExpenseItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    defaultValue: number;
    description: string;
}

const DEFAULT_EXPENSES: ExpenseItem[] = [
    {
        id: "hydro",
        label: "Hydro (Electricity)",
        icon: <Zap className="h-3.5 w-3.5" />,
        defaultValue: 50,
        description: "BC Hydro avg for 1-2br apartment",
    },
    {
        id: "internet",
        label: "Internet",
        icon: <Wifi className="h-3.5 w-3.5" />,
        defaultValue: 75,
        description: "Standard internet plan",
    },
    {
        id: "renters_insurance",
        label: "Renter's Insurance",
        icon: <Shield className="h-3.5 w-3.5" />,
        defaultValue: 35,
        description: "Basic tenant insurance",
    },
    {
        id: "transit",
        label: "Transit Pass",
        icon: <Train className="h-3.5 w-3.5" />,
        defaultValue: 110,
        description: "1-zone Compass monthly pass",
    },
    {
        id: "parking",
        label: "Parking",
        icon: <Car className="h-3.5 w-3.5" />,
        defaultValue: 150,
        description: "Monthly parking if not included",
    },
    {
        id: "water_laundry",
        label: "Laundry / Water",
        icon: <Droplets className="h-3.5 w-3.5" />,
        defaultValue: 30,
        description: "Coin laundry if not in-unit",
    },
];

function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString()}`;
}

export function ExpenseCalculator({
    rent,
    monthlyTakeHome,
    hasParking,
}: ExpenseCalculatorProps) {
    const initialValues: Record<string, number> = {};
    for (const expense of DEFAULT_EXPENSES) {
        // If listing includes parking, default parking cost to 0
        if (expense.id === "parking" && hasParking) {
            initialValues[expense.id] = 0;
        } else {
            initialValues[expense.id] = expense.defaultValue;
        }
    }

    const [values, setValues] = useState<Record<string, number>>(initialValues);
    const [editing, setEditing] = useState<string | null>(null);

    const totalExtras = useMemo(
        () => Object.values(values).reduce((sum, v) => sum + v, 0),
        [values],
    );

    const rentAmount = rent ?? 0;
    const totalMonthly = rentAmount + totalExtras;

    const percentOfIncome =
        monthlyTakeHome && monthlyTakeHome > 0
            ? ((totalMonthly / monthlyTakeHome) * 100).toFixed(1)
            : null;

    function resetToDefaults() {
        setValues(initialValues);
        setEditing(null);
    }

    function updateValue(id: string, val: string) {
        const num = parseInt(val) || 0;
        setValues((prev) => ({ ...prev, [id]: Math.max(0, num) }));
    }

    const percentColor = percentOfIncome
        ? parseFloat(percentOfIncome) <= 33
            ? "text-green-600 dark:text-green-400"
            : parseFloat(percentOfIncome) <= 40
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-red-600 dark:text-red-400"
        : "";

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Monthly Expenses
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetToDefaults}
                        className="text-xs"
                    >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Rent */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rent</span>
                    <span className="text-sm font-bold">
                        {rent ? formatCurrency(rent) : "—"}
                    </span>
                </div>

                <Separator />

                {/* Expense items */}
                <div className="space-y-2">
                    {DEFAULT_EXPENSES.map((expense) => {
                        const isEditing = editing === expense.id;
                        const value = values[expense.id];
                        const isModified =
                            value !==
                            (expense.id === "parking" && hasParking
                                ? 0
                                : expense.defaultValue);

                        return (
                            <div
                                key={expense.id}
                                className="flex items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-muted-foreground shrink-0">
                                        {expense.icon}
                                    </span>
                                    <div className="min-w-0">
                                        <span className="text-sm">
                                            {expense.label}
                                        </span>
                                        {isModified && (
                                            <Badge
                                                variant="outline"
                                                className="text-[9px] ml-1.5 py-0"
                                            >
                                                edited
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            min={0}
                                            className="w-20 h-7 text-sm text-right"
                                            value={value}
                                            onChange={(e) =>
                                                updateValue(
                                                    expense.id,
                                                    e.target.value,
                                                )
                                            }
                                            onBlur={() => setEditing(null)}
                                            onKeyDown={(e) =>
                                                e.key === "Enter" &&
                                                setEditing(null)
                                            }
                                            autoFocus
                                        />
                                    ) : (
                                        <button
                                            className="text-sm tabular-nums font-medium hover:text-primary transition-colors flex items-center gap-1"
                                            onClick={() =>
                                                setEditing(expense.id)
                                            }
                                        >
                                            {formatCurrency(value)}
                                            <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <Separator />

                {/* Subtotal extras */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                        Additional Costs
                    </span>
                    <span className="font-medium">
                        {formatCurrency(totalExtras)}
                    </span>
                </div>

                {/* Total */}
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold">
                            Total Monthly Cost
                        </span>
                        <span className="text-lg font-bold">
                            {formatCurrency(totalMonthly)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">
                            Annual Cost
                        </span>
                        <span className="text-sm font-bold">
                            {formatCurrency(totalMonthly * 12)}
                        </span>
                    </div>
                    {percentOfIncome && (
                        <div className="flex items-center justify-between pt-1 border-t border-border/50">
                            <span className="text-xs text-muted-foreground">
                                % of combined take-home
                            </span>
                            <span
                                className={`text-sm font-bold ${percentColor}`}
                            >
                                {percentOfIncome}%
                            </span>
                        </div>
                    )}
                </div>

                <p className="text-[11px] text-muted-foreground">
                    Estimates based on Vancouver averages. Click any amount to
                    adjust.
                </p>
            </CardContent>
        </Card>
    );
}
