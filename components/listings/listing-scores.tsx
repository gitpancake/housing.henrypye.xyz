"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { RefreshCw, Star } from "lucide-react";
import { scoreColor, scoreBg } from "@/lib/scores";
import type { Score, ScoreBreakdown } from "@/types";

interface ListingScoresProps {
    listingId: string;
    scores: Score[];
    evaluating: boolean;
    onEvaluate: () => void;
    onRefresh: () => void;
}

export function ListingScores({
    listingId,
    scores,
    evaluating,
    onEvaluate,
    onRefresh,
}: ListingScoresProps) {
    async function handleOverride(scoreId: string, value: string) {
        const numVal = value === "" ? null : parseFloat(value);
        try {
            await fetch(`/api/listings/${listingId}/scores/${scoreId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ manualOverrideScore: numVal }),
            });
            toast.success("Score updated");
            onRefresh();
        } catch {
            toast.error("Failed to update score");
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Scores
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onEvaluate}
                        disabled={evaluating}
                    >
                        <RefreshCw
                            className={`h-4 w-4 mr-2 ${evaluating ? "animate-spin" : ""}`}
                        />
                        {evaluating ? "Evaluating..." : "Re-evaluate"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {scores.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                            Not yet evaluated
                        </p>
                        <Button onClick={onEvaluate} disabled={evaluating}>
                            {evaluating ? "Evaluating..." : "Run AI Evaluation"}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {scores.map((score) => {
                            const effectiveScore =
                                score.manualOverrideScore ?? score.aiOverallScore;
                            const breakdown = (score.aiBreakdown ??
                                []) as ScoreBreakdown[];
                            return (
                                <div key={score.id}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold">
                                            {score.user.displayName}
                                        </h3>
                                        {effectiveScore != null && (
                                            <span
                                                className={`text-2xl font-bold tabular-nums ${scoreColor(effectiveScore)}`}
                                            >
                                                {effectiveScore.toFixed(1)}/10
                                            </span>
                                        )}
                                    </div>

                                    {score.aiSummary && (
                                        <p className="text-sm text-muted-foreground mb-3">
                                            {score.aiSummary}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-sm text-muted-foreground">
                                            Manual Override:
                                        </span>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={10}
                                            step={0.5}
                                            className="w-24"
                                            placeholder="—"
                                            defaultValue={
                                                score.manualOverrideScore ?? ""
                                            }
                                            onBlur={(e) =>
                                                handleOverride(
                                                    score.id,
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    {breakdown.length > 0 && (
                                        <Accordion type="single" collapsible>
                                            <AccordionItem value="breakdown">
                                                <AccordionTrigger className="text-sm">
                                                    Score Breakdown
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-2">
                                                        {breakdown.map(
                                                            (item, i) => (
                                                                <div
                                                                    key={i}
                                                                    className={`rounded-lg p-3 ${scoreBg(item.score)}`}
                                                                >
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="text-sm font-medium">
                                                                            {
                                                                                item.category
                                                                            }
                                                                        </span>
                                                                        <span
                                                                            className={`text-sm font-bold tabular-nums ${scoreColor(item.score)}`}
                                                                        >
                                                                            {
                                                                                item.score
                                                                            }
                                                                            /10
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {
                                                                            item.reasoning
                                                                        }
                                                                    </p>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    )}

                                    <Separator className="mt-4" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
